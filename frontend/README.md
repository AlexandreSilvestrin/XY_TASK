# XY Task — Frontend

Interface web em **React + TypeScript + Tailwind CSS** para o aplicativo desktop **XY Task** (Plantcont / Luiza Assessoria). Em produção, é servida pelo Flask e exibida dentro do pywebview; em desenvolvimento, roda no Vite com proxy para o backend.

---

## Executar

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal (geralmente `http://localhost:5173`).

O backend Python (`python main.py` na raiz do projeto) precisa estar rodando para as APIs e os logs via Socket.IO funcionarem.

Para testar como usuário final, build o frontend e rode só o `main.py`:

```bash
npm run build
```

O output vai para `../dist/`, que o Flask serve em `http://127.0.0.1:5000`.

---

## Páginas

| Página | Arquivo | Descrição |
|--------|---------|-----------|
| Home | `HomePage.tsx` | Explicações de cada módulo e versão do app |
| Notas / Faturamento | `NotasFaturamentoPage.tsx` | Processamento de notas e faturamento |
| Excel para PRN | `ExcelParaPrnPage.tsx` | Conversão Excel → PRN |
| Razão | `RazaoPage.tsx` | Relatórios de razão (resumo ou DFC) |
| Importação DIMOB | `ImportacaoDimobPage.tsx` | Importação DIMOB |
| Provisões | `ProvisoesPage.tsx` | Transformação de provisões + editar códigos |
| Apuração PIS / COFINS | `ApuracaoPisCofinsPage.tsx` | Apuração PIS/COFINS + editar códigos |

**Overlays** (sem item na sidebar):

- `PesquisarCNPJPage.tsx` — pesquisa e banco de CNPJs
- `AdicionarPorcentagemPage.tsx` — adicionar porcentagem nas notas

---

## Estrutura

```
frontend/
├── src/
│   ├── api/              # clientes HTTP (rotas Flask)
│   ├── components/
│   │   ├── layout/       # AppShell, Sidebar, LogsPanel, licenças
│   │   ├── home/         # explicações na Home
│   │   ├── provisoes/    # painel de editar códigos
│   │   ├── apuracao/     # painel de editar códigos PIS/COFINS
│   │   ├── notas/        # editar CNPJ, campos de pasta
│   │   ├── cnpj/         # tabela e diálogos de CNPJ
│   │   ├── logs/         # tabela de logs (colunas redimensionáveis)
│   │   └── shared/       # PathField e componentes reutilizáveis
│   ├── context/          # tema, licenças, logs, socket, overlays
│   ├── hooks/            # useSaidaPath, etc.
│   ├── lib/              # licenças, validação, storage de caminhos
│   ├── pages/            # uma página por módulo
│   └── types/            # tipos TypeScript compartilhados
└── docs/                 # documentação de algumas APIs
```

### Contextos principais

| Contexto | Função |
|----------|--------|
| `AppSettingsContext` | Tema claro/escuro, escala de fonte, intensidade de cor |
| `LicenseContext` | Licenças por módulo (bloqueio de abas) |
| `LogsContext` | Entradas de log via Socket.IO |
| `LogsPanelVisibilityContext` | Ocultar painel de logs em telas específicas |
| `PageOverlayContext` | Overlays (CNPJ, porcentagem) |
| `AppSocketContext` | Conexão Socket.IO com o Flask |

### Clientes API (`src/api/`)

| Arquivo | Módulo |
|---------|--------|
| `notas.ts` | Notas / faturamento |
| `excelPrn.ts` | Excel para PRN |
| `razao.ts` | Razão |
| `dimob.ts` | DIMOB |
| `provisoes.ts` | Provisões |
| `codigosProvisoes.ts` | CRUD códigos de provisões |
| `apuracao.ts` | Apuração PIS/COFINS + códigos |
| `cnpjPesquisa.ts`, `cnpjBanco.ts` | Pesquisa e banco CNPJ |
| `porcentagem.ts` | Adicionar porcentagem |
| `select.ts` | Seletor nativo de pasta/arquivo |
| `version.ts` | Versão e status de atualização |
| `logs.ts` | Normalização de eventos de log |
| `socket.ts` | Cliente Socket.IO |

---

## Licenças

Cada módulo (exceto Home) exige chave em **Configurações**. As chaves ficam em `src/lib/licenses.ts` e devem coincidir com o backend/distribuição do cliente.

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção → `../dist/` |
| `npm run preview` | Preview do build |

---

## Documentação de APIs

Arquivos em `docs/`:

| Arquivo | Conteúdo |
|---------|----------|
| `NOTAS_FATURAMENTO_API.md` | Rotas de notas e faturamento |
| `EXCEL_PRN_API.md` | Rotas Excel → PRN |
| `PESQUISAR_CNPJ_API.md` | Pesquisa e banco de CNPJ |
| `LOGS_API.md` | Evento Socket.IO `log` |

Outras rotas (provisões, apuração, razão, dimob) estão definidas em `routes/` e `services/` na raiz do projeto.

---

## Persistência no navegador

Salvo em `localStorage` (persiste no pywebview via `storage_path`):

- Tema, fonte e intensidade de cor
- Caminhos de saída por módulo (`lib/saidaPathStorage.ts`)
- Licenças (`LicenseContext`)
- Altura do painel de logs e larguras das colunas da tabela de logs

---

Criado por [Alexandre Silvestrin](https://github.com/AlexandreSilvestrin)
