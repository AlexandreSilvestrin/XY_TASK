# Pesquisar CNPJ — API e WebSocket

## Abrir tela (Notas)

`POST /pesquisar_cnpj` com payload de Notas pode retornar lista inicial:

```json
{
  "data": [
    { "cnpj": "123", "nome": "" }
  ]
}
```

---

## Iniciar pesquisa

`POST /iniciar_pesquisa_cnpj`

```json
{
  "data": [
    { "cnpj": "123", "nome": "" }
  ]
}
```

Envia a **tabela completa** (índices do websocket = linha na UI).

---

## WebSocket `cnpj_progress`

```json
{
  "index": 0,
  "cnpj": "123",
  "nome": "EMPRESA LTDA"
}
```

---

## Parar

`POST /parar_pesquisa_cnpj`

---

## Salvar

`POST /salvar_cnpj`

```json
{
  "data": [
    { "cnpj": "123", "nome": "EMPRESA LTDA" }
  ]
}
```

Apenas linhas com `cnpj` e `nome` preenchidos.
