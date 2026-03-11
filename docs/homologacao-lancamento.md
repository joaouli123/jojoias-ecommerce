# Checklist de homologacao

## Ambiente

- Confirmar `NEXT_PUBLIC_SITE_URL`, `AUTH_URL`, `NEXTAUTH_URL` e dominio canonico em HTTPS
- Confirmar `DATABASE_URL` e `DIRECT_URL` corretos no ambiente alvo
- Confirmar `SENTRY_AUTH_TOKEN` presente no build de producao
- Confirmar dominio remetente validado no Resend e `fromEmail` configurado no painel

## Storefront

- Abrir home, categoria, marca, busca e PDP sem erro visual ou 500
- Validar busca por nome, SKU, marca e categoria
- Validar banner, imagens e links institucionais

## Carrinho e checkout

- Adicionar produto simples ao carrinho
- Adicionar produto com variacao ao carrinho
- Validar alteracao de quantidade e remocao
- Entrar no checkout e confirmar calculo de subtotal, frete, cupom e desconto Pix
- Concluir pedido com Mercado Pago e voltar corretamente para a pagina de sucesso

## Pos-venda

- Validar webhook do Mercado Pago atualizando status do pagamento
- Validar email transacional de pedido criado
- Validar pedido no painel admin
- Validar fluxo de estorno e atualizacao de status

## Admin

- Login de admin com credenciais do ambiente
- Acesso a pedidos, cupons, integracoes, health e configuracoes
- Criacao e edicao de banner ou pagina institucional

## Observabilidade e analytics

- Aceitar consentimento e confirmar carregamento de GTM ou GA4
- Confirmar disparo de `view_item`, `add_to_cart`, `view_cart`, `begin_checkout` e `purchase`
- Confirmar evento ou erro no Sentry apos um teste controlado

## Liberacao

- Rodar lint, testes e build sem regressao
- Registrar data, responsavel e evidencias da homologacao