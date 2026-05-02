# CARVION Industrial - contrato de dados

Esta pasta concentra os dados e arquivos do módulo CARVION Industrial para backup, Power BI e integração com outros sistemas.

## Datasets principais

- `products`: produtos, códigos numéricos, modelos, custos, preços, estoque e ficha técnica/BOM.
- `productionOrders`: OPs planejadas ou em produção, prazo, lote, quantidade interna/externa e observações.
- `externalProduction`: controle do presídio/terceiros com enviado, retornado, saldo pendente e materiais.
- `sectors`: setores produtivos, metas, responsáveis e teto de bonificação.

## Power BI

Use os CSVs em `exports/` ou o JSON completo em `data/carvion-industrial-data.json`.

Relacionamentos sugeridos:

- `production_orders.codigo_produto` -> `products.codigo`
- `external_production.op_id` -> `production_orders.op_id`
- `external_production.lote_id` -> `production_orders.lote`

## Integração futura

Quando houver backend, estes arquivos viram endpoints REST:

- `GET /industrial/integrations/kpis`
- `GET /industrial/integrations/products`
- `GET /industrial/integrations/production-orders`
- `GET /industrial/integrations/external-production`
- `POST /industrial/webhooks/sync`

## Observação importante

No app estático atual, os dados alterados na tela ficam no navegador via `localStorage`. Para uso multiusuário real, o ideal é plugar PostgreSQL gratuito/inicial via Supabase ou Neon e manter esta pasta como backup/exportação.
