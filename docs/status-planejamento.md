# Status real do projeto

## Escopo concluido para lancamento

- Storefront, busca, categorias, marcas, PDP e carrinho
- Checkout com pedido persistido e Mercado Pago como gateway unico
- Backoffice com pedidos, banners, paginas institucionais, cupons e integracoes
- Autenticacao com bootstrap de admin por ambiente
- Cloudinary, Upstash, SEO tecnico, sitemap, robots e JSON-LD
- Observabilidade com Sentry em runtime e upload de sourcemaps via token
- Analytics com consentimento, GTM como prioridade quando coexistir com GA4 e eventos base de ecommerce

## Escopo pendente ou operacional

- Homologacao completa de compra real, webhook, estorno e confirmacao por email em producao
- Configuracao final de tags no GTM quando ele for o canal principal de medicao
- Validacao final do dominio remetente no Resend para producao

## Decisoes atuais

- Deploy principal: Railway
- Banco principal: PostgreSQL/Neon
- Gateway de pagamento: Mercado Pago
- Desenvolvimento local: `next dev --webpack`
- `DATABASE_URL` para runtime e `DIRECT_URL` para migration em banco gerenciado

## Fora do escopo imediato

- Algolia ou Meilisearch
- Novos gateways de pagamento
- Automacoes comerciais nao essenciais para o lancamento