import Link from "next/link";
import type { IntegrationSetting } from "@prisma/client";
import { BarChart3, Boxes, CreditCard, Mail, Search, ShieldCheck, Truck, Webhook } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { saveIntegrationSettings } from "@/actions/integrations";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { buildIntegrationChecks } from "@/lib/health";
import { getDefaultIntegrationHealthRecords, getIntegrationFormState, parseIntegrationExtraConfig } from "@/lib/integrations";

type TabId = "payments" | "communication" | "marketing" | "operations";

type EnvironmentOption = {
  value: string;
  label: string;
};

type IntegrationDefinition = {
  provider: string;
  name: string;
  description: string;
  tab: TabId;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
  environmentOptions?: EnvironmentOption[];
};

const tabs: Array<{ id: TabId; label: string; description: string }> = [
  { id: "payments", label: "Pagamentos e frete", description: "Gateway, webhook e frete externo" },
  { id: "communication", label: "Comunicação", description: "E-mail transacional e alertas" },
  { id: "marketing", label: "Marketing e SEO", description: "Analytics, tags e verificações" },
  { id: "operations", label: "Operação", description: "Rate limit e infraestrutura refletida no painel" },
];

const integrationDefinitions: IntegrationDefinition[] = [
  {
    provider: "mercado_pago",
    name: "Mercado Pago",
    description: "Gateway usado pelo checkout para Pix, boleto, cartão, consulta de pagamento e reembolso.",
    tab: "payments",
    note: "A URL de notificação é gerada automaticamente. Aqui você só mantém as credenciais reais de produção e homologação.",
    icon: CreditCard,
    environmentOptions: [
      { value: "production", label: "Produção" },
      { value: "sandbox", label: "Teste" },
    ],
  },
  {
    provider: "melhor_envio",
    name: "Provider de frete",
    description: "Integração usada pelo cálculo de frete externo. Se não responder, o sistema pode cair para as regras internas.",
    tab: "payments",
    note: "Pode apontar para endpoint real ou para o mock interno. Cada ambiente guarda URL, token e parâmetros próprios.",
    icon: Truck,
    environmentOptions: [
      { value: "production", label: "Produção" },
      { value: "sandbox", label: "Homologação" },
    ],
  },
  {
    provider: "resend",
    name: "Resend",
    description: "Usado pelos e-mails transacionais de pedido e recuperação de senha.",
    tab: "communication",
    note: "Para produção, o remetente precisa ser um domínio validado. O painel guarda produção e teste separadamente.",
    icon: Mail,
    environmentOptions: [
      { value: "production", label: "Produção" },
      { value: "sandbox", label: "Teste" },
    ],
  },
  {
    provider: "alerting",
    name: "Alertas externos",
    description: "Webhook opcional para encaminhar incidentes do painel para automação externa, Slack ou Discord.",
    tab: "communication",
    note: "Só existem os campos realmente usados: endpoint, bearer token e nível mínimo do alerta.",
    icon: Webhook,
    environmentOptions: [
      { value: "production", label: "Produção" },
      { value: "internal", label: "Interno" },
    ],
  },
  {
    provider: "google_analytics",
    name: "Google Analytics 4",
    description: "Measurement ID lido pelo frontend para pageview e eventos de ecommerce.",
    tab: "marketing",
    note: "Quando GTM estiver ativo junto, o frontend prioriza GTM para evitar duplicação de tracking.",
    icon: BarChart3,
  },
  {
    provider: "google_tag_manager",
    name: "Google Tag Manager",
    description: "Container principal de tags, usado como prioridade sobre GA4 direto quando ambos estiverem ativos.",
    tab: "marketing",
    note: "Só é necessário o Container ID.",
    icon: BarChart3,
  },
  {
    provider: "microsoft_clarity",
    name: "Microsoft Clarity",
    description: "Project ID usado para mapas de calor e gravações de sessão.",
    tab: "marketing",
    note: "O script só carrega após consentimento do usuário.",
    icon: BarChart3,
  },
  {
    provider: "google_search_console",
    name: "Google Search Console",
    description: "Token de verificação do domínio injetado no layout do site.",
    tab: "marketing",
    note: "Opcional. Se o domínio já foi validado por DNS no Google, pode deixar vazio e manter inativo. O campo só serve para meta tag de verificação.",
    icon: Search,
  },
  {
    provider: "bing_webmaster",
    name: "Bing Webmaster",
    description: "Token de verificação do site para o ecossistema Microsoft.",
    tab: "marketing",
    note: "Opcional. Se a verificação já foi feita fora do site, pode deixar vazio e manter inativo. O campo só serve para meta tag de validação.",
    icon: Search,
  },
  {
    provider: "upstash",
    name: "Upstash Redis",
    description: "Espelho das credenciais do deploy para rate limit distribuído e cache leve.",
    tab: "operations",
    note: "O runtime ainda lê do ambiente. Este painel serve para centralizar as referências operacionais reais.",
    icon: Boxes,
  },
];

function buildIntegrationMap(items: IntegrationSetting[]) {
  return new Map(items.map((item) => [item.provider, item]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readProfileValue(
  formState: ReturnType<typeof getIntegrationFormState>,
  extraConfig: Record<string, unknown>,
  environment: string,
  field: "publicKey" | "secretKey" | "webhookSecret" | "endpointUrl",
) {
  const profiles = isRecord(extraConfig.profiles) ? extraConfig.profiles : null;
  const selectedProfile = profiles && isRecord(profiles[environment]) ? profiles[environment] : null;
  const profileValue = selectedProfile?.[field];

  if (typeof profileValue === "string") {
    return profileValue;
  }

  if (formState.environment === environment) {
    return formState[field] ?? "";
  }

  return "";
}

function readProfileExtraValue(
  formState: ReturnType<typeof getIntegrationFormState>,
  extraConfig: Record<string, unknown>,
  environment: string,
  key: string,
  fallback = "",
) {
  const profiles = isRecord(extraConfig.profiles) ? extraConfig.profiles : null;
  const selectedProfile = profiles && isRecord(profiles[environment]) ? profiles[environment] : null;
  const selectedExtraConfig = selectedProfile && isRecord(selectedProfile.extraConfig) ? selectedProfile.extraConfig : null;
  const profileValue = selectedExtraConfig?.[key];

  if (typeof profileValue === "string") {
    return profileValue;
  }

  if (typeof profileValue === "number") {
    return String(profileValue);
  }

  if (formState.environment === environment) {
    const currentValue = extraConfig[key];
    if (typeof currentValue === "string") return currentValue;
    if (typeof currentValue === "number") return String(currentValue);
  }

  return fallback;
}

function readProfileExtraBoolean(
  formState: ReturnType<typeof getIntegrationFormState>,
  extraConfig: Record<string, unknown>,
  environment: string,
  key: string,
  fallback = false,
) {
  const profiles = isRecord(extraConfig.profiles) ? extraConfig.profiles : null;
  const selectedProfile = profiles && isRecord(profiles[environment]) ? profiles[environment] : null;
  const selectedExtraConfig = selectedProfile && isRecord(selectedProfile.extraConfig) ? selectedProfile.extraConfig : null;
  const profileValue = selectedExtraConfig?.[key];

  if (typeof profileValue === "boolean") {
    return profileValue;
  }

  if (formState.environment === environment && typeof extraConfig[key] === "boolean") {
    return Boolean(extraConfig[key]);
  }

  return fallback;
}

function readProfileExtraJson(
  formState: ReturnType<typeof getIntegrationFormState>,
  extraConfig: Record<string, unknown>,
  environment: string,
  key: string,
) {
  const profiles = isRecord(extraConfig.profiles) ? extraConfig.profiles : null;
  const selectedProfile = profiles && isRecord(profiles[environment]) ? profiles[environment] : null;
  const selectedExtraConfig = selectedProfile && isRecord(selectedProfile.extraConfig) ? selectedProfile.extraConfig : null;
  const profileValue = selectedExtraConfig?.[key];

  if (profileValue && typeof profileValue === "object" && !Array.isArray(profileValue)) {
    return JSON.stringify(profileValue, null, 2);
  }

  if (formState.environment === environment && extraConfig[key] && typeof extraConfig[key] === "object" && !Array.isArray(extraConfig[key])) {
    return JSON.stringify(extraConfig[key], null, 2);
  }

  return "";
}

function renderTextInput(props: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={props.id} className="text-sm font-medium text-gray-700">{props.label}</label>
      <input
        id={props.id}
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.defaultValue ?? ""}
        placeholder={props.placeholder}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      />
    </div>
  );
}

function renderProfilePanel(
  definition: IntegrationDefinition,
  formState: ReturnType<typeof getIntegrationFormState>,
  extraConfig: Record<string, unknown>,
  environment: EnvironmentOption,
) {
  const prefix = `profile_${environment.value}`;

  if (definition.provider === "mercado_pago") {
    return (
      <fieldset key={environment.value} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
        <legend className="px-2 text-sm font-semibold text-gray-900">{environment.label}</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderTextInput({ id: `${prefix}_publicKey`, name: `${prefix}_publicKey`, label: "Public Key / App ID", defaultValue: readProfileValue(formState, extraConfig, environment.value, "publicKey"), placeholder: "APP_USR-..." })}
          {renderTextInput({ id: `${prefix}_secretKey`, name: `${prefix}_secretKey`, label: "Access Token", type: "password", defaultValue: readProfileValue(formState, extraConfig, environment.value, "secretKey"), placeholder: "APP_USR-..." })}
          {renderTextInput({ id: `${prefix}_webhookSecret`, name: `${prefix}_webhookSecret`, label: "Segredo do webhook", type: "password", defaultValue: readProfileValue(formState, extraConfig, environment.value, "webhookSecret"), placeholder: "whsec ou hash informado pelo Mercado Pago" })}
          {renderTextInput({ id: `${prefix}_endpointUrl`, name: `${prefix}_endpointUrl`, label: "API Base URL", defaultValue: readProfileValue(formState, extraConfig, environment.value, "endpointUrl") || "https://api.mercadopago.com", placeholder: "https://api.mercadopago.com" })}
        </div>
      </fieldset>
    );
  }

  if (definition.provider === "resend") {
    return (
      <fieldset key={environment.value} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
        <legend className="px-2 text-sm font-semibold text-gray-900">{environment.label}</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderTextInput({ id: `${prefix}_secretKey`, name: `${prefix}_secretKey`, label: "API Key", type: "password", defaultValue: readProfileValue(formState, extraConfig, environment.value, "secretKey"), placeholder: "re_..." })}
          {renderTextInput({ id: `${prefix}_endpointUrl`, name: `${prefix}_endpointUrl`, label: "API Base URL", defaultValue: readProfileValue(formState, extraConfig, environment.value, "endpointUrl") || "https://api.resend.com", placeholder: "https://api.resend.com" })}
          {renderTextInput({ id: `${prefix}_fromEmail`, name: `${prefix}_fromEmail`, label: "From Email", defaultValue: readProfileExtraValue(formState, extraConfig, environment.value, "fromEmail"), placeholder: "Luxi Joias <contato@seudominio.com>" })}
          {renderTextInput({ id: `${prefix}_replyTo`, name: `${prefix}_replyTo`, label: "Reply-To", defaultValue: readProfileExtraValue(formState, extraConfig, environment.value, "replyTo"), placeholder: "suporte@seudominio.com" })}
        </div>
      </fieldset>
    );
  }

  if (definition.provider === "melhor_envio") {
    return (
      <fieldset key={environment.value} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
        <legend className="px-2 text-sm font-semibold text-gray-900">{environment.label}</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderTextInput({ id: `${prefix}_endpointUrl`, name: `${prefix}_endpointUrl`, label: "Endpoint do provider", defaultValue: readProfileValue(formState, extraConfig, environment.value, "endpointUrl"), placeholder: "https://api.seuprovider.com/shipping ou /api/shipping/providers/mock" })}
          {renderTextInput({ id: `${prefix}_secretKey`, name: `${prefix}_secretKey`, label: "Bearer token", type: "password", defaultValue: readProfileValue(formState, extraConfig, environment.value, "secretKey"), placeholder: "Token secreto opcional" })}
          {renderTextInput({ id: `${prefix}_publicKey`, name: `${prefix}_publicKey`, label: "Public key opcional", defaultValue: readProfileValue(formState, extraConfig, environment.value, "publicKey"), placeholder: "Chave pública opcional" })}
          {renderTextInput({ id: `${prefix}_originZipcode`, name: `${prefix}_originZipcode`, label: "CEP de origem", defaultValue: readProfileExtraValue(formState, extraConfig, environment.value, "originZipcode"), placeholder: "01310930" })}
          {renderTextInput({ id: `${prefix}_timeoutMs`, name: `${prefix}_timeoutMs`, label: "Timeout (ms)", defaultValue: readProfileExtraValue(formState, extraConfig, environment.value, "timeoutMs", "5000"), placeholder: "5000" })}
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-sm font-medium text-gray-900">Fallback para regras internas</p>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name={`${prefix}_fallbackToRules`} defaultChecked={readProfileExtraBoolean(formState, extraConfig, environment.value, "fallbackToRules", true)} className="h-4 w-4 rounded border-gray-300" />
              Ativar fallback se o provider falhar
            </label>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-sm font-medium text-gray-900">Permitir retirada local</p>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name={`${prefix}_allowPickup`} defaultChecked={readProfileExtraBoolean(formState, extraConfig, environment.value, "allowPickup", false)} className="h-4 w-4 rounded border-gray-300" />
              Incluir opção de retirada local
            </label>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <label htmlFor={`${prefix}_requestHeaders`} className="text-sm font-medium text-gray-700">Request headers extras</label>
          <textarea
            id={`${prefix}_requestHeaders`}
            name={`${prefix}_requestHeaders`}
            rows={4}
            defaultValue={readProfileExtraJson(formState, extraConfig, environment.value, "requestHeaders")}
            placeholder='{"x-store-id":"luxijoias"}'
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset key={environment.value} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
      <legend className="px-2 text-sm font-semibold text-gray-900">{environment.label}</legend>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderTextInput({ id: `${prefix}_endpointUrl`, name: `${prefix}_endpointUrl`, label: "Endpoint", defaultValue: readProfileValue(formState, extraConfig, environment.value, "endpointUrl"), placeholder: "https://hooks.seusistema.com/eventos" })}
        {renderTextInput({ id: `${prefix}_secretKey`, name: `${prefix}_secretKey`, label: "Bearer token", type: "password", defaultValue: readProfileValue(formState, extraConfig, environment.value, "secretKey"), placeholder: "Token secreto opcional" })}
      </div>
      <div className="mt-4 space-y-2">
        <label htmlFor={`${prefix}_minLevel`} className="text-sm font-medium text-gray-700">Nível mínimo</label>
        <select
          id={`${prefix}_minLevel`}
          name={`${prefix}_minLevel`}
          defaultValue={readProfileExtraValue(formState, extraConfig, environment.value, "minLevel", "ERROR")}
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
        >
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>
    </fieldset>
  );
}

function renderSingleProviderFields(
  definition: IntegrationDefinition,
  formState: ReturnType<typeof getIntegrationFormState>,
  extraConfig: Record<string, unknown>,
) {
  if (definition.provider === "google_analytics") {
    return renderTextInput({ id: `${definition.provider}-publicKey`, name: "publicKey", label: "Measurement ID", defaultValue: formState.publicKey || String(extraConfig.measurementId ?? ""), placeholder: "G-XXXXXXXXXX" });
  }

  if (definition.provider === "google_tag_manager") {
    return renderTextInput({ id: `${definition.provider}-publicKey`, name: "publicKey", label: "Container ID", defaultValue: formState.publicKey || String(extraConfig.containerId ?? ""), placeholder: "GTM-XXXXXXX" });
  }

  if (definition.provider === "microsoft_clarity") {
    return renderTextInput({ id: `${definition.provider}-publicKey`, name: "publicKey", label: "Project ID", defaultValue: formState.publicKey || String(extraConfig.projectId ?? ""), placeholder: "vtspz8dhj1" });
  }

  if (definition.provider === "google_search_console") {
    return renderTextInput({ id: `${definition.provider}-publicKey`, name: "publicKey", label: "Token de verificação", defaultValue: formState.publicKey || String(extraConfig.verificationToken ?? ""), placeholder: "google-site-verification=..." });
  }

  if (definition.provider === "bing_webmaster") {
    return renderTextInput({ id: `${definition.provider}-publicKey`, name: "publicKey", label: "Token de verificação", defaultValue: formState.publicKey || String(extraConfig.verificationToken ?? ""), placeholder: "Token do Bing Webmaster" });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {renderTextInput({ id: `${definition.provider}-publicKey`, name: "publicKey", label: "REST URL", defaultValue: formState.publicKey, placeholder: "https://seu-endpoint.upstash.io" })}
      {renderTextInput({ id: `${definition.provider}-secretKey`, name: "secretKey", label: "REST Token", type: "password", defaultValue: formState.secretKey, placeholder: "Token REST do Upstash" })}
    </div>
  );
}

function renderStatsCard(title: string, value: string | number, description: string) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </section>
  );
}

export default async function AdminIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminPagePermission("settings:manage");

  const { tab } = await searchParams;
  const activeTab = tabs.some((entry) => entry.id === tab) ? (tab as TabId) : "payments";
  const relevantProviders = integrationDefinitions.map((definition) => definition.provider);

  const integrations = await prisma.integrationSetting.findMany({
    where: {
      provider: { in: relevantProviders },
    },
    orderBy: { name: "asc" },
  });

  const integrationMap = buildIntegrationMap(integrations);
  const mergedIntegrations = new Map(getDefaultIntegrationHealthRecords().map((item) => [item.provider, item]));
  for (const integration of integrations) {
    mergedIntegrations.set(integration.provider, integration);
  }

  const integrationChecks = buildIntegrationChecks([...mergedIntegrations.values()]);
  const definitionsForTab = integrationDefinitions.filter((definition) => definition.tab === activeTab);
  const enabledCount = integrationDefinitions.filter((definition) => getIntegrationFormState(definition.provider, integrationMap.get(definition.provider)).isEnabled).length;
  const configuredCount = integrationDefinitions.filter((definition) => {
    const state = getIntegrationFormState(definition.provider, integrationMap.get(definition.provider));
    return Boolean(state.publicKey || state.secretKey || state.endpointUrl || state.webhookSecret || state.extraConfigRaw);
  }).length;
  const degradedCount = integrationChecks.filter((check) => check.status !== "healthy").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Integrações</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            A página foi reduzida para os providers que o runtime realmente consome. Cada card agora pede só os campos reais e, quando existir, separa produção e teste no mesmo lugar.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:max-w-md">
          Sentry, Cloudinary, banco e autenticação continuam em variáveis de ambiente do deploy. Eles não aparecem aqui como formulário para evitar falsa sensação de que o painel controla tudo.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {renderStatsCard("Integrações ativas", enabledCount, "Providers marcados como ativos no painel.")}
        {renderStatsCard("Com dados salvos", configuredCount, "Providers com credencial, token, URL ou configuração real preenchida.")}
        {renderStatsCard("Pontos pendentes", degradedCount, "Checks operacionais ainda degradados segundo a análise atual do sistema.")}
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
          {tabs.map((entry) => {
            const isActive = entry.id === activeTab;
            return (
              <Link
                key={entry.id}
                href={`/admin/integrations?tab=${entry.id}`}
                className={`min-w-[220px] rounded-2xl px-4 py-3 text-left transition-colors ${isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <p className="text-sm font-semibold">{entry.label}</p>
                <p className={`mt-1 text-xs ${isActive ? "text-gray-200" : "text-gray-500"}`}>{entry.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {definitionsForTab.map((definition) => {
          const saved = integrationMap.get(definition.provider);
          const formState = getIntegrationFormState(definition.provider, saved);
          const extraConfig = parseIntegrationExtraConfig(formState.extraConfigRaw || null) as Record<string, unknown>;
          const saveAction = saveIntegrationSettings.bind(null, definition.provider);
          const Icon = definition.icon;

          return (
            <section key={definition.provider} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-gray-900 p-2 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-gray-900">{definition.name}</h2>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${formState.isEnabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700"}`}>
                        {formState.isEnabled ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{definition.description}</p>
                    <p className="mt-2 text-xs font-medium text-gray-500">{definition.note}</p>
                  </div>
                </div>
              </div>

              <form action={saveAction} className="space-y-5 p-6">
                <input type="hidden" name="name" value={definition.name} />

                <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Ativar integração</p>
                    <p className="text-xs text-gray-500">O runtime só passa a usá-la quando ela estiver marcada como ativa.</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {definition.environmentOptions?.length ? (
                      <div className="space-y-2">
                        <label htmlFor={`${definition.provider}-environment`} className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ambiente ativo</label>
                        <select
                          id={`${definition.provider}-environment`}
                          name="environment"
                          defaultValue={formState.environment ?? definition.environmentOptions[0]?.value ?? "production"}
                          className="h-11 min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                        >
                          {definition.environmentOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input type="checkbox" name="isEnabled" defaultChecked={formState.isEnabled} className="h-4 w-4 rounded border-gray-300" />
                      Ativo
                    </label>
                  </div>
                </div>

                {definition.environmentOptions?.length ? (
                  <div className="space-y-4">
                    {definition.environmentOptions.map((environment) => renderProfilePanel(definition, formState, extraConfig, environment))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {renderSingleProviderFields(definition, formState, extraConfig)}
                  </div>
                )}

                {definition.provider === "mercado_pago" ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {renderTextInput({ id: `${definition.provider}-statementDescriptor`, name: "statementDescriptor", label: "Statement descriptor", defaultValue: String(extraConfig.statementDescriptor ?? ""), placeholder: "LUXIJOIAS" })}
                    {renderTextInput({ id: `${definition.provider}-pixDiscountPercent`, name: "pixDiscountPercent", label: "Desconto Pix (%)", defaultValue: String(extraConfig.pixDiscountPercent ?? "10"), placeholder: "10" })}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    Última atualização: {formState.updatedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(formState.updatedAt) : "ainda não salva no banco"}
                  </div>
                  <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
                    Salvar integração
                  </button>
                </div>
              </form>
            </section>
          );
        })}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-gray-700" />
          <div>
            <h2 className="text-base font-semibold text-gray-900">O que saiu da tela</h2>
            <p className="mt-2 text-sm text-gray-600">
              Os blocos de Bling, Webhooks Gerais e Cupons foram removidos porque não têm consumo real no runtime desta versão. A página agora mostra só o que o código efetivamente lê e usa.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}