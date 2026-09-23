import random
import socket
import struct
import subprocess
import sys
import tempfile
import time
from ipaddress import ip_address
from pathlib import Path
from threading import Event, Lock, Thread

from services.backup_service import (
    BACKUP_EXTENSION,
    criar_backup_temporario,
    importar_backup_de_arquivo,
)

TCP_PORT = 54321
UDP_PORT = 54322
DISCOVERY_QUERY = "XYTASK_DISCOVERY"
PROTOCOL_MAGIC = b"XYT1"
DISCOVERY_WAIT_SECONDS = 2.5
CONNECT_TIMEOUT_SECONDS = 12
TRANSFER_TIMEOUT_SECONDS = 600
CHUNK_SIZE = 64 * 1024
FIREWALL_RULE_NAME = "XY Task (rede privada)"

_lock = Lock()
_session: dict | None = None


def _sanitize_name(name: str) -> str:
    cleaned = "".join(ch for ch in name.strip() if ch not in "|\r\n")
    return cleaned or "Computador"


def _computer_name() -> str:
    return _sanitize_name(socket.gethostname())


def _is_private_ipv4(ip: str) -> bool:
    try:
        parsed = ip_address(ip)
    except ValueError:
        return False
    return parsed.version == 4 and (
        parsed.is_private or parsed.is_loopback or parsed.is_link_local
    )


def _local_ipv4() -> str:
    candidates: list[str] = []
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if _is_private_ipv4(ip) and not ip.startswith("127."):
                candidates.append(ip)
    except OSError:
        pass

    if candidates:
        return candidates[0]

    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("192.168.0.1", 80))
        ip = probe.getsockname()[0]
        if _is_private_ipv4(ip) and not ip.startswith("127."):
            return ip
    except OSError:
        pass
    finally:
        probe.close()

    return "127.0.0.1"


def _broadcast_targets(local_ip: str) -> list[str]:
    targets = ["255.255.255.255"]
    parts = local_ip.split(".")
    if len(parts) == 4 and not local_ip.startswith("127."):
        subnet = f"{parts[0]}.{parts[1]}.{parts[2]}.255"
        if subnet not in targets:
            targets.append(subnet)
    return targets


def _close_socket(sock: socket.socket | None) -> None:
    if sock is None:
        return
    try:
        sock.close()
    except OSError:
        pass


def _recv_exact(sock: socket.socket, size: int) -> bytes:
    buffer = bytearray()
    while len(buffer) < size:
        chunk = sock.recv(size - len(buffer))
        if not chunk:
            raise ConnectionError("Conexão encerrada durante a transferência.")
        buffer.extend(chunk)
    return bytes(buffer)


def _send_payload(sock: socket.socket, payload: bytes) -> None:
    sock.sendall(PROTOCOL_MAGIC + struct.pack("!Q", len(payload)) + payload)


def _recv_payload(sock: socket.socket) -> bytes:
    magic = _recv_exact(sock, len(PROTOCOL_MAGIC))
    if magic != PROTOCOL_MAGIC:
        raise ValueError("Resposta inválida do outro computador.")
    (length,) = struct.unpack("!Q", _recv_exact(sock, 8))
    if length <= 0 or length > 512 * 1024 * 1024:
        raise ValueError("Tamanho de arquivo inválido.")
    return _recv_exact(sock, length)


def _ensure_private_firewall() -> tuple[bool, str]:
    if sys.platform != "win32":
        return True, ""

    program = sys.executable
    commands = [
        [
            "netsh",
            "advfirewall",
            "firewall",
            "add",
            "rule",
            f"name={FIREWALL_RULE_NAME}",
            "dir=in",
            "action=allow",
            f"program={program}",
            "enable=yes",
            "profile=private",
        ],
        [
            "netsh",
            "advfirewall",
            "firewall",
            "add",
            "rule",
            "name=XY Task LAN TCP 54321",
            "dir=in",
            "action=allow",
            "protocol=TCP",
            "localport=54321",
            "profile=private",
        ],
        [
            "netsh",
            "advfirewall",
            "firewall",
            "add",
            "rule",
            "name=XY Task LAN UDP 54322",
            "dir=in",
            "action=allow",
            "protocol=UDP",
            "localport=54322",
            "profile=private",
        ],
    ]

    creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    failures = 0
    for command in commands:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            creationflags=creationflags,
        )
        if result.returncode != 0:
            output = (result.stdout or "") + (result.stderr or "")
            if "já existe" not in output.lower() and "already exists" not in output.lower():
                failures += 1

    if failures:
        return False, (
            "Não foi possível configurar o Firewall automaticamente. "
            "Em Rede privada, permita o XY Task nas portas TCP 54321 e UDP 54322. "
            "Não libere essas portas em redes públicas."
        )
    return True, ""


def _session_snapshot() -> dict:
    with _lock:
        if _session is None:
            return {
                "success": True,
                "active": False,
                "status": "idle",
                "message": "Nenhuma transferência em andamento.",
            }
        return {
            "success": True,
            "active": _session["status"] in {"waiting", "transferring"},
            "status": _session["status"],
            "message": _session["message"],
            "hostname": _session["hostname"],
            "code": _session["code"],
            "ip": _session["ip"],
            "firewall_ok": _session["firewall_ok"],
            "firewall_message": _session.get("firewall_message", ""),
        }


def _set_session(**changes) -> None:
    with _lock:
        if _session is None:
            return
        _session.update(changes)


def _cleanup_session_resources(session: dict) -> None:
    session["stop_event"].set()
    _close_socket(session.get("tcp_sock"))
    _close_socket(session.get("udp_sock"))
    temp_path = session.get("temp_path")
    if isinstance(temp_path, Path) and temp_path.exists():
        try:
            temp_path.unlink()
        except OSError:
            pass


def _udp_responder(session: dict) -> None:
    sock: socket.socket = session["udp_sock"]
    reply = (
        f"XYTASK|{session['hostname']}|{session['ip']}|READY|{session['code']}"
    ).encode("utf-8")
    while not session["stop_event"].is_set():
        try:
            data, addr = sock.recvfrom(1024)
        except TimeoutError:
            continue
        except OSError:
            break
        if data.decode("utf-8", errors="ignore").strip() == DISCOVERY_QUERY:
            try:
                sock.sendto(reply, addr)
            except OSError:
                break


def _tcp_sender(session: dict) -> None:
    sock: socket.socket = session["tcp_sock"]
    payload = Path(session["temp_path"]).read_bytes()
    while not session["stop_event"].is_set():
        try:
            conn, addr = sock.accept()
        except TimeoutError:
            continue
        except OSError:
            break

        peer_ip = addr[0]
        if not _is_private_ipv4(peer_ip):
            _close_socket(conn)
            continue

        _set_session(
            status="transferring",
            message="Transferindo o banco para o outro computador...",
        )
        try:
            conn.settimeout(TRANSFER_TIMEOUT_SECONDS)
            _send_payload(conn, payload)
            _set_session(
                status="completed",
                message="Transferência concluída. O banco foi enviado pela rede.",
            )
        except OSError:
            _set_session(
                status="error",
                message="Erro ao enviar o banco. A conexão foi interrompida.",
            )
        finally:
            _close_socket(conn)
            session["stop_event"].set()
            _close_socket(sock)
            _close_socket(session.get("udp_sock"))
            temp_path = session.get("temp_path")
            if isinstance(temp_path, Path) and temp_path.exists():
                try:
                    temp_path.unlink()
                except OSError:
                    pass
        return

    with _lock:
        if _session is session and session["status"] == "waiting":
            session["status"] = "cancelled"
            session["message"] = "Envio pela rede cancelado."


def iniciar_envio() -> dict:
    global _session

    with _lock:
        if _session is not None and _session["status"] in {"waiting", "transferring"}:
            return {
                "success": False,
                "message": "Já existe um envio pela rede em andamento.",
            }

    firewall_ok, firewall_message = _ensure_private_firewall()

    try:
        temp_path = criar_backup_temporario()
    except Exception as exc:
        return {
            "success": False,
            "message": f"Não foi possível gerar o banco para envio: {exc}",
        }

    hostname = _computer_name()
    ip = _local_ipv4()
    code = f"{random.randint(0, 999999):06d}"
    stop_event = Event()

    tcp_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        tcp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        tcp_sock.bind(("0.0.0.0", TCP_PORT))
        tcp_sock.listen(1)
        tcp_sock.settimeout(1.0)

        udp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        udp_sock.bind(("0.0.0.0", UDP_PORT))
        udp_sock.settimeout(1.0)
    except OSError as exc:
        _close_socket(tcp_sock)
        _close_socket(udp_sock)
        try:
            temp_path.unlink(missing_ok=True)
        except OSError:
            pass
        return {
            "success": False,
            "message": (
                "Não foi possível abrir a porta da rede local. "
                f"Verifique se a porta {TCP_PORT} (TCP) e {UDP_PORT} (UDP) "
                f"estão livres. {exc}"
            ),
        }

    session = {
        "status": "waiting",
        "message": "Aguardando outro computador...",
        "hostname": hostname,
        "code": code,
        "ip": ip,
        "temp_path": temp_path,
        "tcp_sock": tcp_sock,
        "udp_sock": udp_sock,
        "stop_event": stop_event,
        "firewall_ok": firewall_ok,
        "firewall_message": firewall_message,
    }

    with _lock:
        _session = session

    Thread(target=_udp_responder, args=(session,), daemon=True, name="banco-udp").start()
    Thread(target=_tcp_sender, args=(session,), daemon=True, name="banco-tcp").start()

    message = (
        "Aguardando conexão...\n\n"
        f"Computador: {hostname}\n"
        f"Código: {code}\n\n"
        "Aguardando outro computador..."
    )
    if firewall_message:
        message += f"\n\n{firewall_message}"

    return {
        "success": True,
        "status": "waiting",
        "message": message,
        "hostname": hostname,
        "code": code,
        "ip": ip,
        "firewall_ok": firewall_ok,
        "firewall_message": firewall_message,
    }


def status_envio() -> dict:
    return _session_snapshot()


def cancelar_envio(*, force: bool = False) -> dict:
    global _session
    with _lock:
        session = _session
        if session is None:
            return {"success": True, "status": "idle", "message": "Nenhum envio ativo."}
        if session["status"] == "transferring" and not force:
            return {
                "success": False,
                "message": "Não é possível cancelar durante a transferência.",
            }
        _session = None

    _cleanup_session_resources(session)
    return {
        "success": True,
        "status": "cancelled",
        "message": "Envio pela rede cancelado.",
    }


def descobrir_computadores() -> dict:
    local_ip = _local_ipv4()
    found: dict[str, dict] = {}
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.settimeout(DISCOVERY_WAIT_SECONDS)
        sock.bind(("0.0.0.0", 0))
        payload = DISCOVERY_QUERY.encode("utf-8")
        for target in _broadcast_targets(local_ip):
            try:
                sock.sendto(payload, (target, UDP_PORT))
            except OSError:
                continue

        deadline = time.monotonic() + DISCOVERY_WAIT_SECONDS
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                break
            sock.settimeout(remaining)
            try:
                data, addr = sock.recvfrom(1024)
            except TimeoutError:
                break
            except OSError:
                break

            text = data.decode("utf-8", errors="ignore").strip()
            parts = text.split("|")
            if len(parts) < 5 or parts[0] != "XYTASK" or parts[3] != "READY":
                continue
            hostname = _sanitize_name(parts[1])
            advertised_ip = parts[2].strip()
            code = "".join(ch for ch in parts[4] if ch.isdigit())[:6]
            ip = advertised_ip
            if advertised_ip.startswith("127.") or not _is_private_ipv4(advertised_ip):
                ip = addr[0]
            if not _is_private_ipv4(ip):
                continue
            found[ip] = {
                "hostname": hostname,
                "ip": ip,
                "code": code.zfill(6) if code else "",
            }
    finally:
        _close_socket(sock)

    computers = sorted(found.values(), key=lambda item: item["hostname"].lower())
    if computers:
        message = f"{len(computers)} computador(es) encontrado(s)."
    else:
        message = (
            "Nenhum computador encontrado. Confirme que o outro está em "
            "Enviar pela rede e que ambos estão na mesma rede privada."
        )
    return {
        "success": True,
        "status": "searching",
        "message": message,
        "computers": computers,
    }


def receber_banco(ip: str) -> dict:
    target_ip = (ip or "").strip()
    if not _is_private_ipv4(target_ip):
        return {
            "success": False,
            "status": "error",
            "message": "IP inválido. Use apenas endereços IPv4 da rede local.",
        }

    temp_file = tempfile.NamedTemporaryFile(
        prefix="XYTask_Recv_",
        suffix=BACKUP_EXTENSION,
        delete=False,
    )
    destination = Path(temp_file.name)
    temp_file.close()

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.settimeout(CONNECT_TIMEOUT_SECONDS)
        try:
            sock.connect((target_ip, TCP_PORT))
        except TimeoutError:
            return {
                "success": False,
                "status": "error",
                "message": (
                    "Tempo esgotado ao conectar. O outro computador pode ter "
                    "encerrado o envio ou o firewall bloqueou a porta TCP 54321."
                ),
            }
        except ConnectionRefusedError:
            return {
                "success": False,
                "status": "error",
                "message": (
                    "Conexão recusada. Confirme que o outro computador está "
                    "aguardando em Enviar pela rede."
                ),
            }
        except OSError as exc:
            return {
                "success": False,
                "status": "error",
                "message": f"Não foi possível conectar: {exc}",
            }

        sock.settimeout(TRANSFER_TIMEOUT_SECONDS)
        payload = _recv_payload(sock)
        destination.write_bytes(payload)
    except (ConnectionError, ValueError, OSError) as exc:
        return {
            "success": False,
            "status": "error",
            "message": f"Erro na transferência: {exc}",
        }
    finally:
        _close_socket(sock)

    try:
        result = importar_backup_de_arquivo(destination)
    finally:
        try:
            destination.unlink(missing_ok=True)
        except OSError:
            pass

    if result.get("success"):
        result["status"] = "completed"
        result["message"] = (
            "Transferência concluída. " + str(result.get("message") or "")
        ).strip()
    else:
        result["status"] = "error"
    return result
