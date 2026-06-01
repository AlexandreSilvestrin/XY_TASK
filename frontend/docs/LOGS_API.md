# Logs via Socket.IO

O frontend conecta ao backend com **Socket.IO** e escuta o evento **`log`**.

## Conexão (frontend)

```typescript
import { io } from 'socket.io-client'

const socket = io('http://127.0.0.1:5000') // ou origem do Vite em dev

socket.on('log', (data) => {
  // exibe na tabela de logs
})
```

### URL do socket

| Ambiente | URL padrão |
|----------|------------|
| Desenvolvimento (`npm run dev`) | Mesma origem do Vite (proxy `/socket.io` → `127.0.0.1:5000`) |
| WebView / build | `http://127.0.0.1:5000` |

Override com variável de ambiente:

```env
VITE_SOCKET_URL=http://127.0.0.1:5000
```

## Evento `log`

O Python deve emitir:

```python
socketio.emit("log", {
    "module": "notas",
    "status": "success",
    "file": "empresa.xlsx",
    "message": "Arquivo gerado com sucesso",
})
```

### Payload

```json
{
  "module": "notas",
  "status": "success",
  "file": "empresa.xlsx",
  "message": "Arquivo gerado com sucesso"
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `module` | string | Módulo/página — coluna **Type** |
| `status` | string | `success` (verde) ou outro valor (vermelho, ex.: `error`) |
| `file` | string | Coluna **File** |
| `message` | string | Coluna **Message** |

Também é aceito um **array** de logs ou `{ "logs": [...] }` no mesmo evento.

## Exemplo Flask-SocketIO

```python
from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on("connect")
def on_connect():
    print("Cliente conectado")

def emit_log(module: str, status: str, file: str, message: str):
    socketio.emit(
        "log",
        {
            "module": module,
            "status": status,
            "file": file,
            "message": message,
        },
    )

if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000)
```

## Interface

- Cabeçalho: **Type** | **Message** | **File**
- Cada evento `log` adiciona uma linha (mais recente no topo)
- Indicador **ETL · ao vivo** quando conectado; **Backend offline** quando desconectado
