# XY Task

> [!NOTE]
> **Este projeto é a evolução do Programa Automação.**
>
> Esta versão foi desenvolvida como uma continuação do sistema original, preservando suas principais funcionalidades e modernizando toda a aplicação.
>
> Principais melhorias:
>
> - Interface completamente redesenhada utilizando **React**;
> - Backend reestruturado em **Flask**;
> - Arquitetura mais organizada e preparada para futuras expansões;
> - Inclusão de novas funcionalidades solicitadas durante a utilização do sistema.
> - **Sistema de atualização automática (Auto Update)** para distribuição simplificada de novas versões.
>
> O repositório original permanece disponível apenas como histórico do desenvolvimento do projeto.
>
> ➜ **Versão anterior:** https://github.com/AlexandreSilvestrin/Programa-automacao

Aplicativo desktop para automação contábil (**Plantcont / Luiza Assessoria**). Une uma interface web moderna com processamento Python pesado (Excel, PDF, banco de dados, etc.).

Ao abrir, o programa:

1. Garante instância única (não abre duas vezes)
2. Sobe um servidor local (Flask) em `http://127.0.0.1:5000`
3. Abre uma janela nativa (pywebview) maximizada com a interface
4. Verifica atualizações no GitHub em segundo plano (quando instalado)

---

## O que o programa faz

| Módulo | Função |
|--------|--------|
| **Notas / Faturamento** | Processa notas fiscais, gera faturamento, pesquisa CNPJ, gerencia banco de CNPJs e adiciona porcentagem |
| **Excel para PRN** | Converte planilhas Excel para arquivos `.prn` |
| **Razão** | Gera relatórios de razão contábil (resumo ou DFC) |
| **Importação DIMOB** | Importa e processa arquivos DIMOB |
| **Provisões** | Transforma planilhas de provisões; códigos editáveis por consórcio |
| **Apuração PIS / COFINS** | Gera lançamentos de crédito PIS/COFINS a partir de planilhas Excel (LBR, SONDOTECNICA ou PLANSERVI) |

Na tela **Home** há explicações detalhadas de cada módulo.

Cada módulo (exceto Home) exige **licença** configurada em **Configurações**. Os logs do processamento aparecem em tempo real na parte inferior da tela, com colunas redimensionáveis.

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
   (janela nativa)                              models/ (JSON, SQLite)
                                                data/ (dados do usuário)
```

- **Frontend** (`frontend/`) — React + TypeScript + Tailwind
- **Backend** (`main.py`, `routes/`, `services/`, `core/`, `models/`) — Flask com WebSocket para logs em tempo real
- **Dados** — bancos SQLite e JSONs de configuração copiados do seed na primeira execução

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
├── config/              # caminhos, versão, instância única
├── core/                # lógica de processamento (notas, razão, dimob, PRN…)
├── models/              # persistência (CNPJ, códigos, apuração PIS/COFINS)
├── routes/              # rotas da API Flask
├── services/            # camada entre rotas e core
├── websocket/           # logs em tempo real
├── data/
│   └── seed/            # arquivos iniciais copiados na primeira execução
├── dist/                # frontend buildado (gerado pelo Vite)
└── frontend/            # código-fonte React
    └── docs/            # documentação de algumas APIs
```

### Arquivos de dados (seed)

| Arquivo | Uso |
|---------|-----|
| `BANCOCNPJ.db` | Banco de CNPJs pesquisados |
| `GUIANOMES.db` | Guia de nomes |
| `codigos.json` | Códigos contábeis por consórcio (provisões) |
| `DADOS_APURACAO.json` | Códigos PIS/COFINS por empresa e consórcio |

---

## Onde ficam os dados do usuário

| Modo | Local |
|------|-------|
| Desenvolvimento | `data/` na pasta do projeto |
| Instalado (.exe) | `%LOCALAPPDATA%\XY TASK\data\` |
| Tema e preferências (WebView) | `%LOCALAPPDATA%\XY TASK\webview\` |
| Atualizações baixadas | `%LOCALAPPDATA%\XY TASK\updates\` |

Na primeira execução instalada, os arquivos de `data/seed/` são copiados automaticamente (se ainda não existirem na pasta do usuário). O tema (claro/escuro), tamanho da fonte, intensidade de cor, caminhos de saída e larguras das colunas de log são salvos em `localStorage` e persistem entre aberturas graças ao `storage_path` do pywebview.

---

## Versão

A versão exibida no app vem de `pyproject.toml`:

```toml
[project]
version = "1.1.3"
```

Altere lá e rebuild o frontend + PyInstaller para refletir a mudança. O endpoint `GET /version` também informa se há atualização disponível no GitHub.

---

## Dicas

- **Erro ao buildar?** Mude `console=False` para `console=True` no `main.spec` para ver mensagens de erro no terminal.
- **Ícone não atualizou?** O Windows pode cachear ícones — renomeie a pasta `release` ou reinicie o Explorer.
- **Documentação das APIs** — veja `frontend/docs/` para detalhes de alguns endpoints (notas, PRN, CNPJ, logs).
- **Licenças** — cada módulo tem chave própria; configure em Configurações na sidebar.

---

Criado por [Alexandre Silvestrin](https://github.com/AlexandreSilvestrin)
