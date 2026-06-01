# XY Task

Aplicativo desktop para automação contábil. Une uma interface web moderna com processamento Python pesado (Excel, PDF, banco de dados, etc.).

Ao abrir, o programa:
1. Sobe um servidor local (Flask) em `http://127.0.0.1:5000`
2. Abre uma janela nativa (pywebview) maximizada com a interface

---

## O que o programa faz

| Módulo | Função |
|--------|--------|
| **Notas / Faturamento** | Processa notas fiscais, gera faturamento, pesquisa CNPJ e gerencia o banco de CNPJs |
| **Excel para PRN** | Converte planilhas Excel para arquivos PRN |
| **Razão** | Gera relatórios de razão contábil |
| **Importação DIMOB** | Importa e processa arquivos DIMOB |

Na tela **Home** há explicações detalhadas de cada módulo.

---

## Como funciona por dentro

```
┌─────────────────┐     HTTP + WebSocket     ┌──────────────────┐
│  Interface      │ ◄──────────────────────► │  Backend Python  │
│  (React/Vite)   │                          │  (Flask)         │
└─────────────────┘                          └──────────────────┘
        ▲                                              │
        │                                              ▼
   pywebview                                    core/ (processamento)
   (janela nativa)                              data/ (bancos .db)
```

- **Frontend** (`frontend/`) — React + TypeScript + Tailwind
- **Backend** (`main.py`, `routes/`, `services/`, `core/`) — Flask com WebSocket para logs em tempo real
- **Dados** — bancos SQLite (`BANCOCNPJ.db`, `GUIANOMES.db`) copiados automaticamente na primeira execução

---

## Requisitos

- **Python** 3.12+
- **Node.js** 18+ (só para desenvolver/buildar o frontend)
- **Java** (necessário para leitura de PDFs via tabula-py)

---

## Rodar em desenvolvimento

### 1. Backend

```powershell
# criar e ativar ambiente virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# instalar dependências
pip install -e .

# subir o servidor
python main.py
```

### 2. Frontend (em outro terminal)

```powershell
cd frontend
npm install
npm run dev
```

O Vite abre em `http://localhost:5173` e encaminha as chamadas de API para o Flask.

> Para testar como usuário final (janela nativa), basta rodar só `python main.py` — ele usa o frontend já buildado em `dist/`.

---

## Gerar o instalador (.exe)

### 1. Buildar o frontend

```powershell
cd frontend
npm run build
```

Isso gera os arquivos estáticos em `dist/` na raiz do projeto.

### 2. Empacotar com PyInstaller

```powershell
pyinstaller main.spec --clean --distpath release
```

O executável fica em `release/XY_TASK/XY_TASK.exe`.

**Antes de distribuir**, confira:
- A versão em `pyproject.toml` está atualizada (aparece na tela Home)
- O frontend foi buildado (`npm run build`) com as últimas alterações
- O ícone `xy-logo.ico` está na raiz do projeto

---

## Estrutura do projeto

```
XY_TASK/
├── main.py              # ponto de entrada — Flask + webview
├── app_webview.py       # janela nativa maximizada
├── main.spec            # configuração do PyInstaller
├── pyproject.toml       # dependências e versão do app
├── config/              # caminhos e configurações
├── core/                # lógica de processamento (notas, razão, dimob…)
├── routes/              # rotas da API Flask
├── services/            # camada entre rotas e core
├── websocket/           # logs em tempo real
├── data/                # bancos iniciais (seed)
├── dist/                # frontend buildado (gerado pelo Vite)
└── frontend/            # código-fonte React
    └── docs/            # documentação das APIs
```

---

## Onde ficam os dados do usuário

| Modo | Local |
|------|-------|
| Desenvolvimento | `data/` na pasta do projeto |
| Instalado (.exe) | `%LOCALAPPDATA%\XYT\data\` |

Na primeira execução instalada, os arquivos de `data/seed/` são copiados automaticamente.

---

## Versão

A versão exibida no app vem de `pyproject.toml`:

```toml
[project]
version = "0.1.0"
```

Altere lá e rebuild o frontend + PyInstaller para refletir a mudança.

---

## Dicas

- **Erro ao buildar?** Mude `console=False` para `console=True` no `main.spec` para ver mensagens de erro no terminal.
- **Ícone não atualizou?** O Windows pode cachear ícones — renomeie a pasta `release` ou reinicie o Explorer.
- **Documentação das APIs** — veja `frontend/docs/` para detalhes de cada endpoint.

---

Criado por [Alexandre Silvestrin](https://github.com/AlexandreSilvestrin)
