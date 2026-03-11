# Planejamento Completo — JoJoias Ecommerce

## 1) Objetivo Macro
Construir e evoluir uma operação de ecommerce completa para JoJoias com foco em:
- Conversão alta (checkout e UX de compra)
- SEO técnico forte (indexação, metadata, sitemap, schema)
- Operação administrável (produtos, pedidos, clientes)
- Performance e confiabilidade em produção

---

## 2) Estado Atual (o que já existe)

### 2.1 Storefront
- Home com carrosséis e vitrine de produtos
- Header com barra superior, busca e menu de categorias
- Footer robusto com newsletter, links institucionais, contato, pagamentos e selos
- Listagem por categoria
- Página de produto com ações de compra, preço pix, frete e compartilhamento
- Carrinho e checkout estruturados

### 2.2 Conta e autenticação
- Login e cadastro
- Conta do usuário autenticado
- Sessão com NextAuth + credenciais

### 2.3 Backoffice (admin)
- Dashboard
- Gestão de produtos (listar, criar, editar, excluir)
- Gestão de pedidos e atualização de status

### 2.4 Dados e APIs
- Prisma + SQLite
- APIs para produtos, categorias, carrinho, auth, favoritos

### 2.5 SEO técnico já implementado
- Metadata global no layout
- `robots.txt` dinâmico
- `sitemap.xml` dinâmico
- `manifest.webmanifest`
- Metadata dinâmica + JSON-LD em produto e categoria

---

## 3) Gaps Prioritários (o que falta)

## P0 — Crítico para venda/produção
1. Checkout transacional completo
   - Persistência de pedido final sem inconsistência
   - Estratégia de confirmação de pagamento por método
   - E-mail/WhatsApp transacional pós-compra

2. Estoque e integridade
   - Trava de estoque por pedido
   - Reversão de estoque em cancelamento
   - Proteção contra overselling

3. Frete real
   - Integração com cálculo real por CEP
   - SLA e custo exibidos no checkout

4. Ambientes
   - Variáveis de produção
   - Banco de produção e backup
   - Rotina de migração segura

## P1 — Conversão e retenção
1. Melhorias avançadas no checkout
   - Progresso visual por etapa
   - Feedback de erro por campo
   - Salvar endereço preferido

2. Catálogo
   - Busca com sugestões
   - Filtros reais por preço/categoria/atributos
   - Ordenação por relevância/conversão

3. Favoritos e recuperação
   - Fluxo de recuperação de carrinho
   - Alertas de preço/estoque

## P2 — Escala e governança
1. Observabilidade
   - Logs estruturados
   - Monitor de erro (ex: Sentry)
   - Alertas para falhas em rotas críticas

2. Segurança e compliance
   - Hardening de cookies/session
   - Rate limit em endpoints críticos
   - Política LGPD e governança de dados

3. SEO de escala
   - Canonical e noindex inteligente por faceta/filtro
   - Open Graph por página de produto com imagem otimizada
   - Conteúdo editorial para cluster semântico

---

## 4) Roadmap por Fases

## Fase 1 — Estabilização de Base (1 semana)
- [ ] Revisar fluxo completo `cart -> checkout -> order/success`
- [ ] Garantir consistência de pedido e cálculo final
- [ ] Consolidar status e transições de pedidos
- [ ] Checklist de variáveis e ambiente de deploy
- [ ] Documentar runbook técnico

Entregável: compra ponta a ponta previsível e ambiente pronto para deploy controlado.

## Fase 2 — Conversão (1–2 semanas)
- [ ] Otimização UX de checkout mobile e desktop
- [ ] Melhorias de confiança (selos, mensagens, microcopy)
- [ ] Melhorias de performance visual e carregamento
- [ ] Rotina de recuperação de abandono (base técnica)

Entregável: aumento de taxa de conclusão de checkout.

## Fase 3 — Operação Comercial (1–2 semanas)
- [ ] Ajustes de catálogo e filtros reais
- [ ] Rotina de pedidos para operação (status, prazos, contato)
- [ ] Ajustes de painel admin para rotina diária

Entregável: operação comercial sustentável.

## Fase 4 — Escala SEO + Performance (contínuo)
- [ ] Core Web Vitals
- [ ] Estratégia de conteúdo e cluster por categoria
- [ ] Dados estruturados avançados (Product, Offer, FAQ, Breadcrumb)

Entregável: crescimento orgânico consistente + estabilidade técnica.

---

## 5) Backlog Técnico Detalhado

### 5.1 Checkout / Pedidos
- [ ] Validar schema de checkout no servidor
- [ ] Normalizar payload de pedido
- [ ] Implementar idempotência de criação de pedido
- [ ] Garantir cálculo final no backend (não só frontend)
- [ ] Salvar observação de pedido e método de pagamento
- [ ] Ajustar página de sucesso para dados reais e claros

### 5.2 Carrinho
- [ ] Sincronização client/server robusta
- [ ] Tratamento de produto indisponível no carrinho
- [ ] Revalidação inteligente por rota

### 5.3 Catálogo
- [ ] Filtro por preço funcional
- [ ] Filtro por marca/categoria funcional
- [ ] Busca por termo com fallback

### 5.4 Admin
- [ ] Controle de permissões por role (mais granular)
- [ ] Ações com feedback e logs de auditoria
- [ ] Exportação de pedidos

### 5.5 SEO
- [ ] Expandir metadata em rotas auxiliares
- [ ] Open Graph image por produto
- [ ] Estratégia de indexação por filtros

### 5.6 Segurança
- [ ] Rate limit em auth/api críticas
- [ ] Validação e sanitização centralizadas
- [ ] Revisão de headers de segurança

### 5.7 Performance
- [ ] Otimizar imagens (`next/image` onde aplicável)
- [ ] Evitar overfetch em listagens
- [ ] Revisar bundles de client component

---

## 6) Plano de Qualidade

### 6.1 Testes recomendados
- Unitários para utilitários e validações
- Integração para ações server (`actions/*`)
- E2E para fluxo principal de compra

### 6.2 Critérios de aceite mínimos
- Build e lint sempre verdes
- Fluxo de compra sem erro em desktop/mobile
- Dados de pedido consistentes no admin
- SEO técnico válido nas páginas críticas

---

## 7) KPI de Acompanhamento
- Conversão checkout (%)
- Abandono de carrinho (%)
- Ticket médio (R$)
- Tempo médio de carregamento (LCP)
- Páginas indexadas e tráfego orgânico

---

## 8) Plano de Execução Imediata (Próximos 7 dias)
- Dia 1: fechamento de integridade no checkout e pedido
- Dia 2: revisão de carrinho e fallback de estoque
- Dia 3: melhorias de UX checkout (mensagens/estados)
- Dia 4: filtros reais em categoria
- Dia 5: ajustes admin + relatório de pedidos
- Dia 6: performance + imagens
- Dia 7: validação final e checklist de deploy

---

## 9) Observações
- O arquivo original de planejamento extenso não está presente no workspace atual.
- Este documento foi reconstruído com base no estado real do projeto e no histórico de evolução recente.
- Recomenda-se versionar esse arquivo no Git para evitar perda futura.
