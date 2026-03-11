# JoJoias Ecommerce

Ecommerce completo em Next.js com storefront, checkout, backoffice, CMS, SEO técnico, integrações e operação administrativa.

## Stack principal

- Next.js 16 + App Router
- React 19 + TypeScript
- Prisma + SQLite local preparado para migração para PostgreSQL
- Auth.js / NextAuth
- Tailwind CSS 4

## Requisitos

- Node.js 20+
- npm 10+

## Setup local

1. Copie [.env.example](.env.example) para `.env`.
2. Ajuste as variáveis obrigatórias.
3. Instale dependências:

	`npm ci`

4. Gere o client Prisma:

	`npm run db:generate`

5. Sincronize o banco local:

	`npx prisma db push`

6. Garanta um admin inicial:

	`npm run admin:ensure`

### Variáveis mínimas obrigatórias

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `AUTH_SECRET` e/ou `NEXTAUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Observação: hoje o setup local padrão usa SQLite via `file:./prisma/dev.db`. A migração para PostgreSQL continua como próximo passo de infra/produção.

### Preparação de infra

- O schema Prisma agora lê `DATABASE_URL` do ambiente.
- Em desenvolvimento local, o valor padrão pode continuar em SQLite.
- Para produção, a troca recomendada é configurar `DATABASE_URL` para PostgreSQL e validar o fluxo com `prisma db push` ou migrations dedicadas.

## Rodando o projeto no Windows

Neste ambiente PowerShell, `npm` pode falhar com `Could not determine Node.js install directory`.

Use uma destas opções:

- VS Code task `dev`
- `npm.cmd run dev`
- `npm.cmd run build`
- `npm.cmd run lint`

## Scripts úteis

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — servidor de produção
- `npm run lint` — lint
- `npm run test` — testes automatizados de regras críticas
- `npm run db:generate` — gerar Prisma client
- `npm run db:migrate` — criar migration local
- `npm run admin:ensure` — garantir usuário admin
- `npm run coupon:ensure` — garantir cupom padrão

## Runbook técnico

### Fluxo mínimo antes de publicar

1. Atualize variáveis de ambiente.
2. Rode `npm.cmd run lint`.
3. Rode `npm.cmd run build`.
4. Rode `npx prisma db push` no ambiente alvo.
5. Valide login, checkout, admin e rotas de SEO.

### Caminho recomendado para migrar para PostgreSQL

1. Provisionar banco PostgreSQL persistente.
2. Duplicar o ambiente e ajustar `DATABASE_URL` para o novo banco.
3. Rodar `npx prisma db push` ou fluxo de migration no ambiente alvo.
4. Popular dados iniciais e admin com segredos seguros.
5. Validar autenticação, checkout, pedidos e admin antes do cutover.

### Contrato atual da integração de frete

O provider configurado em [src/app/admin/integrations/page.tsx](src/app/admin/integrations/page.tsx) para `melhor_envio` recebe um `POST` com:

- `zipcode`
- `subtotal`
- `itemsCount`
- `originZipcode` quando configurado
- `environment`
- `options` com o JSON salvo no painel

O retorno esperado pode ser:

- `{ "options": [{ "id": "standard", "service": "PAC", "amount": 19.9, "estimatedDays": 4 }] }`
- ou `{ "quote": { "id": "standard", "service": "PAC", "amount": 19.9, "estimatedDays": 4 } }`

Para validar o fluxo sem credenciais externas, configure `endpointUrl` como `/api/shipping/providers/mock`.

Esse endpoint interno já responde no contrato esperado e permite testar a integração ponta a ponta com a camada de provider habilitada.

Configurações extras úteis para o frete:

- `timeoutMs`
- `fallbackToRules`
- `allowPickup`
- `originZipcode`
- `requestHeaders`

Exemplo:

`{"timeoutMs":5000,"fallbackToRules":true,"allowPickup":true,"originZipcode":"01310930","requestHeaders":{"x-store-id":"jojoias"}}`

### Checklist de produção

- `DATABASE_URL` apontando para o banco configurado para o ambiente atual
- `DIRECT_URL` configurada se você for rodar migrations em PostgreSQL gerenciado
- `AUTH_SECRET` / `NEXTAUTH_SECRET` definidos com segredo forte
- `NEXTAUTH_URL` / `AUTH_URL` / `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` com `https://luxijoias.com.br`
- chaves de pagamento e webhooks configuradas
- política de backup do banco definida
- CI verde em [.github/workflows/ci.yml](.github/workflows/ci.yml)
- `ADMIN_PASSWORD` removido do ambiente após bootstrap inicial ou rotacionado em segredo seguro

### Railway

- Defina o domínio principal como `luxijoias.com.br` e, se usar `www`, faça redirecionamento canônico para um único host.
- Configure no Railway as variáveis do arquivo [railway.env.json](railway.env.json).
- Em banco PostgreSQL com pooler, use `DATABASE_URL` para runtime e `DIRECT_URL` para migrations.
- Depois do primeiro deploy, rode `npm run db:generate`, `npx prisma db push` e `npm run admin:ensure` no ambiente alvo.

### Operação diária

- Pedidos em [src/app/admin/orders/page.tsx](src/app/admin/orders/page.tsx)
- Exportação CSV em [src/app/admin/orders/export/route.ts](src/app/admin/orders/export/route.ts)
- Auditoria administrativa em [src/app/admin/audit-logs/page.tsx](src/app/admin/audit-logs/page.tsx)
- Saúde operacional em [src/app/admin/health/page.tsx](src/app/admin/health/page.tsx)
- Configurações institucionais em [src/app/admin/settings/page.tsx](src/app/admin/settings/page.tsx)

### Health check operacional

- Endpoint público: [src/app/api/health/route.ts](src/app/api/health/route.ts)
- Painel administrativo: [src/app/admin/health/page.tsx](src/app/admin/health/page.tsx)
- Painel de integrações agora mostra diagnóstico resumido por provider em [src/app/admin/integrations/page.tsx](src/app/admin/integrations/page.tsx)

O health check resume banco, segredos de autenticação, incidentes recentes e integrações críticas sem expor chaves sensíveis.
No painel, cada card também aponta para a área de correção mais próxima, acelerando o diagnóstico operacional.

### Cobertura atual de testes automatizados

Hoje a suíte cobre regras críticas de:

- permissões admin
- auditoria
- frete por regra
- saúde operacional
- cupons
- validação de checkout
- filtros de incidentes
- facetas de catálogo para marca/categoria

### Navegação por marcas

- Índice público de marcas em [src/app/(store)/brands/page.tsx](src/app/(store)/brands/page.tsx)
- Página pública de marca em [src/app/(store)/brand/[slug]/page.tsx](src/app/(store)/brand/[slug]/page.tsx)
- Sitemap agora inclui URLs de marcas em [src/app/sitemap.ts](src/app/sitemap.ts)
- A busca rápida e a PDP passam a apontar para páginas dedicadas de marca

### UX de filtros mobile

- Painel compartilhado de filtros mobile em [src/components/catalog/mobile-filters.tsx](src/components/catalog/mobile-filters.tsx)
- Aplicado em busca, categorias e páginas de marca

### Relevância de busca

- Busca e sugestões agora consideram nome, SKU, descrição, categoria e marca
- Ranking textual centralizado em [src/lib/store-data.ts](src/lib/store-data.ts)
- Sinônimos comerciais como luxo/premium, dourado/ouro e anel/aro entram na expansão de busca

### Descoberta comercial no storefront

- Home agora destaca marcas públicas com CTA para [src/app/(store)/brands/page.tsx](src/app/(store)/brands/page.tsx)
- Estados vazios de busca passaram a sugerir marcas e categorias


## Áreas implementadas

- Storefront com banners e busca
- Checkout com persistência de pedido
- Frete por CEP
- Cupons e desconto Pix
- CMS de banners e páginas institucionais
- SEO com metadata, sitemap, robots e JSON-LD
- Hardening básico e rate limit
- Logs de auditoria para ações administrativas críticas

## Validação recomendada

Após qualquer alteração importante:

1. `npm.cmd run lint`
2. `npm.cmd run test`
3. `npm.cmd run build`
4. testar pedido, admin e busca
