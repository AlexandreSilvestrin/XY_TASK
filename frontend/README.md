# XY Task — Frontend ETL Contábil

Interface web em React + Tailwind CSS para ferramentas de ETL contábil (preparada para empacotamento desktop futuro).

## Executar

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal (geralmente `http://localhost:5173`).

## Estrutura

- `src/components/layout/` — shell, sidebar retrátil, painel de logs, menu de configurações
- `src/pages/` — uma página por módulo (HOME, NOTAS/FATURAMENTO, etc.)
- `src/api/` — cliente HTTP para o backend Python
- `src/context/AppSettingsContext.tsx` — tema claro/escuro e escala de fonte
- `docs/NOTAS_FATURAMENTO_API.md` — guia de rotas da página Notas
- `docs/LOGS_API.md` — evento Socket.IO `log`
- `docs/EXCEL_PRN_API.md` — rotas da página Excel para PRN

## Scripts

| Comando        | Descrição              |
|----------------|------------------------|
| `npm run dev`  | Servidor de desenvolvimento |
| `npm run build`| Build de produção      |
| `npm run preview` | Preview do build   |
