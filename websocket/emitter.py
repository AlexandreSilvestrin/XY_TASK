_socketio = None


def init_socketio(socketio):
    global _socketio
    _socketio = socketio


def emit_log(module, status, file, message):
    if _socketio is None:
        return

    _socketio.emit(
        "log",
        {
            "module": module,
            "status": status,
            "file": file,
            "message": message,
        },
    )


def emit_cnpj_progress(index, cnpj, nome):
    if _socketio is None:
        return

    _socketio.emit(
        "cnpj_progress",
        {
            "index": index,
            "cnpj": cnpj,
            "nome": nome,
        },
    )
