import os
import sys
import time
import urllib.error
import urllib.request

# build main.spec pyinstaller main.spec --clean --distpath release

from pathlib import Path
from threading import Thread
from tkinter import Tk, filedialog

from flask import Flask, jsonify, request, send_from_directory
from flask_socketio import SocketIO

from config.caminhos import setup as setup_data
from config.version import __version__
from routes.cnpj_routes import cnpj_bp
from routes.dimob_routes import dimob_bp
from routes.notas_routes import notas_bp
from routes.prn_routes import prn_bp
from routes.razao_routes import razao_bp
from services.cnpj_service import encerrar_pesquisa_cnpj
from services.update_check import check_and_apply_update
from app_webview import run_webview
from websocket.emitter import init_socketio

# ---------------------------------------------------
# caminhos
# ---------------------------------------------------

def _get_resource_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent


BASE_DIR = _get_resource_dir()
DIST_DIR = BASE_DIR / "dist"

# ---------------------------------------------------
# flask
# ---------------------------------------------------

app = Flask(
    __name__,
    static_folder=str(DIST_DIR),
    static_url_path=""
)

socketio = SocketIO(
    app,
    cors_allowed_origins="*"
)

init_socketio(socketio)
app.register_blueprint(prn_bp)
app.register_blueprint(notas_bp)
app.register_blueprint(cnpj_bp)
app.register_blueprint(razao_bp)
app.register_blueprint(dimob_bp)

_shutdown_done = False


def shutdown_application():
    global _shutdown_done

    if _shutdown_done:
        return
    _shutdown_done = True

    encerrar_pesquisa_cnpj(timeout=5)

    try:
        socketio.stop()
    except Exception:
        pass


# ---------------------------------------------------
# rota principal
# ---------------------------------------------------

@app.route("/")
def index():
    return send_from_directory(DIST_DIR, "index.html")


# ---------------------------------------------------
# versão do app
# ---------------------------------------------------

@app.route("/version", methods=["GET"])
def app_version():
    return jsonify({
        "success": True,
        "version": __version__,
    })


# ---------------------------------------------------
# fallback react router
# ---------------------------------------------------

@app.route("/<path:path>")
def catch_all(path):

    file_path = DIST_DIR / path

    if file_path.exists():
        return send_from_directory(DIST_DIR, path)

    return send_from_directory(DIST_DIR, "index.html")


# ---------------------------------------------------
# select pasta/arquivo
# ---------------------------------------------------

@app.route("/select", methods=["POST"])
def select():

    data = request.json or {}

    select_type = data.get("type")
    module = data.get("module")
    target = data.get("target")

    print("SELECT:")
    print("type:", select_type)
    print("module:", module)
    print("target:", target)

    root = Tk()
    root.withdraw()
    root.attributes("-topmost", True)

    selected_path = None

    if select_type == "pasta":
        selected_path = filedialog.askdirectory()

    elif select_type == "arquivos":
        selected_path = filedialog.askopenfilename()

    root.destroy()

    if not selected_path:
        return jsonify({
            "success": False,
            "message": "Nenhum item selecionado"
        }), 400

    return jsonify({
        "success": True,
        "path": selected_path,
        "module": module,
        "target": target,
    })


# ---------------------------------------------------
# websocket conectado
# ---------------------------------------------------

@socketio.on("connect")
def connected():
    print("Frontend conectado")


# ---------------------------------------------------
# iniciar flask
# ---------------------------------------------------

def run_flask():
    socketio.run(
        app,
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False,
        allow_unsafe_werkzeug=True,
    )


def wait_for_server(url: str, timeout: float = 30) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=1)
            return True
        except (urllib.error.URLError, TimeoutError, OSError):
            time.sleep(0.2)
    return False


# ---------------------------------------------------
# main
# ---------------------------------------------------

def main():
    if check_and_apply_update(__version__):
        os._exit(0)

    setup_data()

    flask_thread = Thread(
        target=run_flask,
        daemon=True,
    )
    flask_thread.start()

    if not wait_for_server("http://127.0.0.1:5000"):
        raise RuntimeError("Servidor Flask não iniciou a tempo.")

    run_webview("http://127.0.0.1:5000")

    shutdown_application()
    os._exit(0)


if __name__ == "__main__":
    main()
