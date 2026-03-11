import type { IntegrationSetting } from "@prisma/client";
import { PlugZap, ShieldCheck, Webhook } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { saveIntegrationSettings } from "@/actions/integrations";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { buildIntegrationChecks } from "@/lib/health";

const statusClasses = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  degraded: "border-amber-200 bg-amber-50 text-amber-700",
  down: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

type IntegrationDefinition = {
  provider: string;
  name: string;
  description: string;
  hint: string;
  environmentOptions: Array<{ value: string; label: string }>;
};

const integrationDefinitions: IntegrationDefinition[] = [
  {
    provider: "alerting",
    name: "Alertas Externos",
    description: "Dispara alertas operacionais para webhook externo, Slack, Discord ou automação interna.",
    hint: "Informe a URL do webhook. Em JSON extra, opcionalmente use {\"minLevel\":\"ERROR\"}.",
    environmentOptions: [
      { value: "internal", label: "Interno" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "resend",
    name: "Resend",
    description: "Envio de e-mails transacionais como pedido recebido e atualização de pagamento.",
    hint: "Use a chave da API e informe no JSON extra o remetente, ex.: {\"fromEmail\":\"JoJoias <onboarding@resend.dev>\"}.",
    environmentOptions: [
      { value: "sandbox", label: "Teste" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "mercado_pago",
    name: "Mercado Pago",
    description: "Gateway principal da operação para Pix, boleto, cartão e notificações automáticas.",
    hint: "Configure o token, segredo do webhook e parâmetros extras. O checkout usa apenas Mercado Pago.",
    environmentOptions: [
      { value: "sandbox", label: "Teste" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "upstash",
    name: "Upstash Redis",
    description: "Rate limiting distribuído e cache leve para rotas públicas com custo baixo e setup rápido.",
    hint: "Use a REST URL em Chave pública e o REST Token em Chave secreta. Para o proxy usar em runtime, replique as mesmas credenciais nas variáveis de ambiente do deploy.",
    environmentOptions: [
      { value: "draft", label: "Rascunho" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "google_analytics",
    name: "Google Analytics 4",
    description: "Medição de tráfego, eventos de ecommerce e conversões com GA4.",
    hint: "Informe o Measurement ID em Chave pública, ex.: G-XXXXXXXXXX. Pode ficar desativado até você preencher depois.",
    environmentOptions: [
      { value: "draft", label: "Rascunho" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "google_tag_manager",
    name: "Google Tag Manager",
    description: "Gerenciamento central de tags de marketing e analytics sem novo deploy.",
    hint: "Informe o Container ID em Chave pública, ex.: GTM-XXXXXXX.",
    environmentOptions: [
      { value: "draft", label: "Rascunho" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "google_search_console",
    name: "Google Search Console",
    description: "Verificação do domínio e acompanhamento de indexação e SEO técnico.",
    hint: "Informe o token de verificação em Chave pública ou no JSON extra como {\"verificationToken\":\"...\"}.",
    environmentOptions: [
      { value: "draft", label: "Rascunho" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "bing_webmaster",
    name: "Bing Webmaster",
    description: "Verificação do site no Bing e visibilidade adicional em buscas da Microsoft.",
    hint: "Informe o token de verificação em Chave pública.",
    environmentOptions: [
      { value: "draft", label: "Rascunho" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "microsoft_clarity",
    name: "Microsoft Clarity",
    description: "Mapas de calor e gravações de sessão gratuitos para entender comportamento do usuário.",
    hint: "Informe o Project ID em Chave pública.",
    environmentOptions: [
      { value: "draft", label: "Rascunho" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "bling",
    name: "Bling ERP",
    description: "Preparação para integração futura com ERP, pedidos, estoque e faturamento.",
    hint: "Deixe salvo aqui Client ID, Client Secret, endpoint e JSON extra. A ativação pode ficar para depois.",
    environmentOptions: [
      { value: "sandbox", label: "Teste" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "melhor_envio",
    name: "Melhor Envio",
    description: "Integração de frete para cálculo, etiquetas e rastreamento.",
    hint: "Informe endpoint absoluto ou relativo. Para validar localmente, use /api/shipping/providers/mock. O endpoint recebe zipcode, subtotal, itemsCount e pode usar JSON extra como {\"timeoutMs\":5000,\"fallbackToRules\":true,\"allowPickup\":true,\"originZipcode\":\"01310930\",\"requestHeaders\":{\"x-store-id\":\"jojoias\"}}.",
    environmentOptions: [
      { value: "sandbox", label: "Homologação" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "webhooks",
    name: "Webhooks Gerais",
    description: "Central para segredos e URLs de retorno das automações.",
    hint: "Concentre aqui a URL base e segredos compartilhados entre integrações.",
    environmentOptions: [
      { value: "internal", label: "Interno" },
      { value: "production", label: "Produção" },
    ],
  },
  {
    provider: "cupons",
    name: "Cupons e Promoções",
    description: "Parâmetros comerciais para cupons automáticos e campanhas.",
    hint: "Ex.: código de primeira compra, percentual padrão e regras extras em JSON simples.",
    environmentOptions: [
      { value: "draft", label: "Rascunho" },
      { value: "active", label: "Ativo" },
    ],
  },
];

function buildIntegrationMap(items: IntegrationSetting[]) {
  return new Map(items.map((item) => [item.provider, item]));
}

export default async function AdminIntegrationsPage() {
  await requireAdminPagePermission("settings:manage");

  const integrations = await prisma.integrationSetting.findMany({
    orderBy: { name: "asc" },
  });

  const integrationMap = buildIntegrationMap(integrations);
  const integrationChecks = buildIntegrationChecks(integrations);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Integrações</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Centralize aqui as variáveis operacionais do ecommerce: gateways de pagamento, webhooks, frete e regras de cupons.
          </p>
        </div>

        <div className="hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 lg:block">
          Ajuste tudo no painel sem depender de editar arquivos manualmente.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrationChecks.map((check) => (
          <section key={check.key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{check.label}</h2>
                <p className="mt-2 text-sm text-gray-600">{check.message}</p>
              </div>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[check.status]}`}>
                {check.status}
              </span>
            </div>

            {check.details && Object.keys(check.details).length > 0 ? (
              <dl className="mt-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600">
                {Object.entries(check.details).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <dt className="font-medium text-gray-500">{key}</dt>
                    <dd className="font-semibold text-gray-800">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {integrationDefinitions.map((definition) => {
          const saved = integrationMap.get(definition.provider);
          const saveAction = saveIntegrationSettings.bind(null, definition.provider);

          return (
            <section key={definition.provider} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-gray-900 p-2 text-white">
                    {definition.provider === "webhooks" ? <Webhook className="h-5 w-5" /> : definition.provider === "cupons" ? <ShieldCheck className="h-5 w-5" /> : <PlugZap className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{definition.name}</h2>
                    <p className="mt-1 text-sm text-gray-600">{definition.description}</p>
                    <p className="mt-2 text-xs font-medium text-gray-500">{definition.hint}</p>
                  </div>
                </div>
              </div>

              <form action={saveAction} className="space-y-5 p-6">
                <input type="hidden" name="name" value={definition.name} />

                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Ativar integração</p>
                    <p className="text-xs text-gray-500">Habilite quando as credenciais estiverem prontas.</p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" name="isEnabled" defaultChecked={saved?.isEnabled ?? false} className="h-4 w-4 rounded border-gray-300" />
                    Ativo
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor={`${definition.provider}-environment`} className="text-sm font-medium text-gray-700">Ambiente</label>
                    <select
                      id={`${definition.provider}-environment`}
                      name="environment"
                      defaultValue={saved?.environment ?? definition.environmentOptions[0]?.value ?? "sandbox"}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    >
                      {definition.environmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`${definition.provider}-endpoint`} className="text-sm font-medium text-gray-700">Endpoint / URL</label>
                    <input
                      id={`${definition.provider}-endpoint`}
                      name="endpointUrl"
                      type="text"
                      defaultValue={saved?.endpointUrl ?? ""}
                      placeholder="https://api.seu-servico.com"
                      className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor={`${definition.provider}-public`} className="text-sm font-medium text-gray-700">Chave pública / identificador</label>
                    <input
                      id={`${definition.provider}-public`}
                      name="publicKey"
                      type="text"
                      defaultValue={saved?.publicKey ?? ""}
                      placeholder="pk_live_xxx ou identificador"
                      className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`${definition.provider}-secret`} className="text-sm font-medium text-gray-700">Chave secreta</label>
                    <input
                      id={`${definition.provider}-secret`}
                      name="secretKey"
                      type="password"
                      defaultValue={saved?.secretKey ?? ""}
                      placeholder="sk_live_xxx"
                      className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor={`${definition.provider}-webhook`} className="text-sm font-medium text-gray-700">Segredo do webhook</label>
                  <input
                    id={`${definition.provider}-webhook`}
                    name="webhookSecret"
                    type="password"
                    defaultValue={saved?.webhookSecret ?? ""}
                    placeholder="whsec_xxx"
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor={`${definition.provider}-extra`} className="text-sm font-medium text-gray-700">Configuração extra</label>
                  <textarea
                    id={`${definition.provider}-extra`}
                    name="extraConfig"
                    rows={4}
                    defaultValue={saved?.extraConfig ?? ""}
                    placeholder='JSON simples, observações técnicas ou parâmetros adicionais.'
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="text-xs text-gray-500">
                    Última atualização: {saved ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(saved.updatedAt) : "ainda não configurado"}
                  </div>

                  <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
                    Salvar integração
                  </button>
                </div>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}