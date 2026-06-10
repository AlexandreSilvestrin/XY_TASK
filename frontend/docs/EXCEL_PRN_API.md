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
  "saida": "C:\\destino\\saida",
  "tipo_centro_custo": "sem-cc",
  "nome_arquivo": "FI02960296"
}
```

### Campos do body

| Campo | Tipo | Obrigatório | Valores | Descrição |
|-------|------|-------------|---------|-----------|
| `module` | string | sim | `excel-prn` | Identificador do módulo |
| `entrada` | string | sim | caminho | Pasta ou arquivo `.xlsx` de origem |
| `saida` | string | sim | caminho | Pasta de destino dos `.prn` |
| `tipo_centro_custo` | string | sim | `sem-cc`, `com-cc` | Tipo de tratamento (com ou sem centro de custo) |
| `nome_arquivo` | string | sim | texto livre | Nome base do arquivo PRN gerado |

### Exemplo — Com centro de custo

```json
{
  "module": "excel-prn",
  "entrada": "C:\\origem\\pasta_excel",
  "saida": "C:\\destino\\saida",
  "tipo_centro_custo": "com-cc",
  "nome_arquivo": "FI02960296"
}
```

> `tipo_centro_custo` define apenas o tipo de tratamento no backend. `nome_arquivo` é sempre enviado.

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
  "message": "O campo 'nome_arquivo' é obrigatório."
}
```

---

## Logs

Eventos Socket.IO `log` com `"module": "excel-prn"` aparecem na área de logs (ver `LOGS_API.md`).
