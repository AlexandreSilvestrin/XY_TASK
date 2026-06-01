# Guia de API — Excel para PRN

## Seleção (`POST /select`)

### Local dos arquivos — pasta

```json
{
  "type": "pasta",
  "module": "excel-prn",
  "target": "entrada"
}
```

### Local dos arquivos — arquivo

```json
{
  "type": "arquivos",
  "module": "excel-prn",
  "target": "entrada"
}
```

### Local para salvar — pasta

```json
{
  "type": "pasta",
  "module": "excel-prn",
  "target": "saida"
}
```

**Resposta esperada:** `{ "path": "C:\\caminho\\escolhido" }`

| Campo | Valores nesta página |
|-------|----------------------|
| `type` | `pasta` ou `arquivos` |
| `module` | `excel-prn` |
| `target` | `entrada` ou `saida` |

---

## Ação — Geral PRN

| Item | Valor |
|------|-------|
| **Botão** | Geral PRN |
| **Endpoint** | `POST /geral_prn` |

```json
{
  "module": "excel-prn",
  "entrada": "C:\\origem\\planilha.xlsx",
  "saida": "C:\\destino\\saida"
}
```

---

## Logs

Eventos Socket.IO `log` com `"module": "excel-prn"` aparecem na área de logs (ver `LOGS_API.md`).
