# CARVION

Plataforma inteligente de gestão empresarial.

Protótipo SaaS multiempresa especializado em fábricas de bolas esportivas, adaptado a partir do visual original do projeto.

## O que foi nichado

- Dashboard industrial com produção, custo médio por bola, lucro por lote e eficiência.
- Ordens de produção por etapa: corte, costura, montagem e acabamento.
- Matéria-prima com estoque mínimo, custo por unidade e alerta.
- Cálculo de custo por bola e por lote.
- Vendas, pedidos, clientes, representantes, metas e comissões.
- Produtos com imagem, ficha técnica e BOM.
- Estoque de produto final por lote.
- Backend NestJS inicial com Prisma/PostgreSQL em `backend/`.

## Rodar o protótipo visual

```bash
npm install
npm run dev:prototype
```

Abra `http://localhost:3000/dashboard`.

O painel já é funcional no navegador: o botão **Novo Pedido** cria pedido, gera OP planejada, atualiza representante, comissão, cliente e KPIs. Os dados ficam salvos em `localStorage`; use **Resetar demo** para voltar aos dados iniciais.

## Rodar a API

```bash
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Endpoints iniciais:

- `GET /api/analytics/industrial`
- `GET /api/production-orders`
- `GET /api/materials`
- `GET /api/sales`
- `GET /api/representatives`

## Publicar no Render

O projeto está pronto para Render Blueprint com [render.yaml](render.yaml).

Resumo:

1. Acesse [Render Blueprints](https://dashboard.render.com/blueprints).
2. Conecte `roniisilvaa-dotcom/CARVION`.
3. Aplique o Blueprint.

Mais detalhes em [docs/render.md](docs/render.md).
