# Guia de API — Notas / Faturamento

Este documento descreve as requisições que o frontend envia ao backend Python (Flask) na página **Notas / Faturamento**.

## Configuração

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_API_BASE_URL` | `""` (mesma origem) | URL base do servidor Python |

Em desenvolvimento, o Vite pode encaminhar as rotas para `http://127.0.0.1:5000` (ver `vite.config.ts`).

Todas as requisições usam:

- **Método:** `POST`
- **Header:** `Content-Type: application/json`

---

## Seleção de pasta (`/select`)

Os botões **Selecionar pasta** não abrem o seletor nativo do navegador. Eles pedem ao Python que abra o diálogo do sistema e devolvam o caminho escolhido.

### Local dos arquivos (entrada)

```http
POST /select
```

```json
{
  "type": "pasta",
  "module": "notas",
  "target": "entrada"
}
```

### Local para salvar (saída)

```http
POST /select
```

```json
{
  "type": "pasta",
  "module": "notas",
  "target": "saida"
}
```

### Campos do body

| Campo | Tipo | Valores | Descrição |
|-------|------|---------|-----------|
| `type` | string | `pasta`, `arquivos` | Tipo de seleção no diálogo |
| `module` | string | `notas`, `excel-prn`, … | Módulo/página ativa |
| `target` | string | `entrada`, `saida` | Origem dos arquivos ou destino de gravação |

### Resposta esperada

```json
{
  "path": "C:\\Users\\empresa\\notas\\entrada"
}
```

| Status | Significado |
|--------|-------------|
| `200` | Pasta selecionada; `path` preenche o campo no frontend |
| `4xx` / `5xx` | Erro; corpo pode conter `{ "message": "texto" }` |

---

## Payload comum das ações

Todos os botões de ação abaixo enviam o mesmo corpo, montado com os campos da tela:

```json
{
  "module": "notas",
  "entrada": "C:\\caminho\\dos\\arquivos",
  "saida": "C:\\caminho\\para\\salvar",
  "mes": 5,
  "ano": 2026
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `module` | string | Sempre `"notas"` nesta página |
| `entrada` | string | Caminho em **Local dos arquivos** |
| `saida` | string | Caminho em **Local para salvar** |
| `mes` | number | `1` (Janeiro) a `12` (Dezembro) |
| `ano` | number | Ano selecionado (atual ± 3 anos) |

---

## Botões de ação

### 1. Pesquisar CNPJ

| Item | Valor |
|------|-------|
| **Botão na UI** | Pesquisar CNPJ |
| **Endpoint** | `POST /pesquisar_cnpj` |
| **Body** | Payload comum (acima) |

---

### 2. Exportar banco

| Item | Valor |
|------|-------|
| **Botão na UI** | Exportar banco |
| **Endpoint** | `POST /exportar_banco` |
| **Body** | Payload comum |

---

### 3. Importar banco

| Item | Valor |
|------|-------|
| **Botão na UI** | Importar banco |
| **Endpoint** | `POST /importar_banco` |
| **Body** | Payload comum |

---

### 4. Adicionar porcentagem (modal)

O botão **Adicionar porcentagem** abre o modal no frontend (sem payload obrigatório). As ações do modal usam:

#### Pesquisar guia

| Item | Valor |
|------|-------|
| **Botão na UI** | Pesquisar (no modal) |
| **Endpoint** | `POST /pesquisar_guia_porcentagem` |
| **Body** | Somente CNPJ |

```json
{
  "cnpj": "31.599.507/0001-37"
}
```

Resposta de sucesso (`data`): `contrato`, `razao_social`, `cnpj`, `porcentagens` (lista `{ nome, percentual }` para preencher a tabela), `retencoes` (lista de strings).

#### Salvar guia

| Item | Valor |
|------|-------|
| **Botão na UI** | Salvar (no modal) |
| **Endpoint** | `POST /salvar_guia_porcentagem` |
| **Body** | Formulário completo |

```json
{
  "contrato": "123",
  "razao_social": "EMPRESA LTDA",
  "cnpj": "31.599.507/0001-37",
  "porcentagens": {
    "CONSORCIO A": 50,
    "CONSORCIO B": 50
  },
  "retencoes": ["IR", "PIS", "COFINS", "CSLL"]
}
```

`porcentagens` é um objeto (dict): chave = nome da consorciada, valor = percentual numérico. `retencoes` é uma lista, ex.: `["IR", "PIS"]`.

---

### 5. Geral notas

| Item | Valor |
|------|-------|
| **Botão na UI** | Geral notas |
| **Endpoint** | `POST /geral_notas` |
| **Body** | Payload comum |

---

### 6. Gerar faturamento

| Item | Valor |
|------|-------|
| **Botão na UI** | Gerar faturamento |
| **Endpoint** | `POST /gerar_faturamento` |
| **Body** | Payload comum |

---

## Respostas das ações

O frontend aceita qualquer JSON em sucesso (`200`). Em erro, espera:

```json
{
  "message": "Descrição do erro para o usuário"
}
```

Recomenda-se que o backend também registre logs no painel **Logs** da aplicação (integração futura).

---

## Referência rápida

| Ação | Método | Rota |
|------|--------|------|
| Selecionar pasta (entrada) | POST | `/select` |
| Selecionar pasta (saída) | POST | `/select` |
| Pesquisar CNPJ | POST | `/pesquisar_cnpj` |
| Exportar banco | POST | `/exportar_banco` |
| Importar banco | POST | `/importar_banco` |
| Pesquisar guia porcentagem | POST | `/pesquisar_guia_porcentagem` |
| Salvar guia porcentagem | POST | `/salvar_guia_porcentagem` |
| Geral notas | POST | `/geral_notas` |
| Gerar faturamento | POST | `/gerar_faturamento` |

---

## Uso em outras páginas

Para **Excel para PRN**, **Importação DIMOB**, **Razão**, etc.:

1. Troque `"module"` no `/select` e no payload das ações.
2. Use `"type": "pasta"` ou `"arquivos"` conforme o caso.
3. Mantenha `"target": "entrada"` ou `"saida"` para distinguir origem e destino.

Exemplo (módulo futuro):

```json
{
  "type": "arquivos",
  "module": "excel-prn",
  "target": "entrada"
}
```
