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

### Campos do body

| Campo | Tipo | Obrigatório | Valores | Descrição |
|-------|------|-------------|---------|-----------|
| `module` | string | sim | `excel-prn` | Identificador do módulo |
| `entrada` | string | sim | caminho | Pasta ou arquivo `.xlsx` de origem |
| `saida` | string | sim | caminho | Pasta de destino dos `.prn` |

O nome do `.prn` gerado usa o **nome do Excel de entrada** (sem `.xlsx`) + extensão **`.prn`**. Ex.: `FI02960296.xlsx` → `FI02960296.prn`.

### Resposta de sucesso (`200`)

```json
{
  "success": true,
  "message": "Processamento PRN concluído com sucesso."
}
```

### Resposta de erro (`400`)

```json
{
  "success": false,
  "message": "Os campos 'entrada' e 'saida' são obrigatórios."
}
```

---

## Logs

Eventos Socket.IO `log` com `"module": "excel-prn"` aparecem na área de logs (ver `LOGS_API.md`).
