# Publicar o CARVION no Render

O projeto já tem um `render.yaml` na raiz. Ele cria:

- `carvion-app`: aplicação web do CARVION.
- `carvion-api`: API NestJS.
- `carvion-db`: PostgreSQL gerenciado.

## Passos

1. Acesse [Render Blueprints](https://dashboard.render.com/blueprints).
2. Clique em **New Blueprint Instance**.
3. Conecte o repositório `roniisilvaa-dotcom/CARVION`.
4. Confirme o arquivo `render.yaml`.
5. Clique em **Apply**.

Credenciais demo:

```txt
admin@carvion.com
Admin@123
```

## Observação

A versão visual funcional usa `localStorage` no navegador. A API e o banco já ficam publicados para a próxima etapa de integração completa.
