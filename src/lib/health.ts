import { prisma } from "@/lib/prisma";

export type HealthState = "healthy" | "degraded" | "down";

export type HealthCheck = {
  key: string;
  label: string;
  status: HealthState;
  message: string;
  details?: Record<string, string | number | boolean | null | undefined>;
  actionLabel?: string;
  actionHref?: string;
};

export type HealthSnapshot = {
  status: HealthState;
  checkedAt: string;
  checks: HealthCheck[];
};

export type IntegrationRecord = {
  provider: string;
  name: string;
  isEnabled: boolean;
  publicKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  endpointUrl: string | null;
  extraConfig: string | null;
};

function statusWeight(status: HealthState) {
  switch (status) {
    case "down":
      return 3;
    case "degraded":
      return 2;
    default:
      return 1;
  }
}

export function resolveHealthStatus(statuses: HealthState[]) {
  return statuses.reduce<HealthState>((current, next) => {
    return statusWeight(next) > statusWeight(current) ? next : current;
  }, "healthy");
}

export function getIncidentHealthState(openIncidents: number): HealthState {
  if (openIncidents >= 10) return "down";
  if (openIncidents > 0) return "degraded";
  return "healthy";
}

export function isConfiguredSecret(value?: string | null) {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  return ![
    "troque-por-um-segredo-forte",
    "troque-por-uma-senha-forte-com-12-ou-mais-caracteres",
    "admin@minhaloja.com",
    "postgresql://user:password@localhost:5432/ecommerce?schema=public",
  ].includes(normalized);
}

function parseExtraConfig(raw: string | null) {
  if (!raw) return {} as Record<string, unknown>;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {} as Record<string, unknown>;
  }
}

export function buildIntegrationChecks(integrations: IntegrationRecord[]): HealthCheck[] {
  const byProvider = new Map(integrations.map((item) => [item.provider, item]));
  const mercadoPago = byProvider.get("mercado_pago");
  const resend = byProvider.get("resend");
  const melhorEnvio = byProvider.get("melhor_envio");
  const alerting = byProvider.get("alerting");
  const upstash = byProvider.get("upstash");
  const googleAnalytics = byProvider.get("google_analytics");
  const googleTagManager = byProvider.get("google_tag_manager");
  const googleSearchConsole = byProvider.get("google_search_console");
  const bingWebmaster = byProvider.get("bing_webmaster");
  const microsoftClarity = byProvider.get("microsoft_clarity");
  const bling = byProvider.get("bling");

  const emailExtra = parseExtraConfig(resend?.extraConfig ?? null);
  const hasResendFromEmail = typeof emailExtra.fromEmail === "string" && emailExtra.fromEmail.trim().length > 3;

  const freightExtra = parseExtraConfig(melhorEnvio?.extraConfig ?? null);
  const mercadoPagoExtra = parseExtraConfig(mercadoPago?.extraConfig ?? null);
  const alertingExtra = parseExtraConfig(alerting?.extraConfig ?? null);
  const pixDiscountPercent = Number(mercadoPagoExtra.pixDiscountPercent ?? 10);
  const normalizedPixDiscountPercent = Number.isFinite(pixDiscountPercent) && pixDiscountPercent >= 0 ? pixDiscountPercent : 10;
  const alertingMinLevel = typeof alertingExtra.minLevel === "string" ? alertingExtra.minLevel : "ERROR";
  const upstashRuntimeReady = isConfiguredSecret(process.env.UPSTASH_REDIS_REST_URL) && isConfiguredSecret(process.env.UPSTASH_REDIS_REST_TOKEN);
  const upstashPanelReady = isConfiguredSecret(upstash?.publicKey) && isConfiguredSecret(upstash?.secretKey);

  return [
    {
      key: "mercado-pago",
      label: "Mercado Pago",
      status: mercadoPago?.isEnabled && isConfiguredSecret(mercadoPago.secretKey) ? "healthy" : "degraded",
      message:
        mercadoPago?.isEnabled && isConfiguredSecret(mercadoPago.secretKey)
          ? "Mercado Pago habilitado com credenciais principais prontas para checkout."
          : "Mercado Pago desativado ou sem token válido configurado.",
      details: {
        enabled: Boolean(mercadoPago?.isEnabled),
        hasSecretKey: isConfiguredSecret(mercadoPago?.secretKey),
        hasWebhookSecret: isConfiguredSecret(mercadoPago?.webhookSecret),
        pixDiscountPercent: normalizedPixDiscountPercent,
      },
      actionLabel: "Configurar Mercado Pago",
      actionHref: "/admin/integrations",
    },
    {
      key: "transactional-email",
      label: "E-mail transacional",
      status: resend?.isEnabled && isConfiguredSecret(resend.secretKey) && hasResendFromEmail ? "healthy" : "degraded",
      message:
        resend?.isEnabled && isConfiguredSecret(resend.secretKey) && hasResendFromEmail
          ? "E-mails transacionais estão configurados com remetente válido."
          : "Configure o Resend com chave e fromEmail para garantir e-mails transacionais.",
      details: {
        enabled: Boolean(resend?.isEnabled),
        hasSecretKey: isConfiguredSecret(resend?.secretKey),
        hasFromEmail: hasResendFromEmail,
      },
      actionLabel: "Revisar Resend",
      actionHref: "/admin/integrations",
    },
    {
      key: "shipping-provider",
      label: "Provider de frete",
      status:
        melhorEnvio?.isEnabled && melhorEnvio.endpointUrl
          ? "healthy"
          : freightExtra.fallbackToRules === false
            ? "down"
            : "degraded",
      message:
        melhorEnvio?.isEnabled && melhorEnvio.endpointUrl
          ? "Provider de frete habilitado e pronto para cotações externas."
          : freightExtra.fallbackToRules === false
            ? "O frete externo está obrigatório, mas ainda não há endpoint pronto."
            : "O frete segue com fallback interno; configure o provider para operação real.",
      details: {
        enabled: Boolean(melhorEnvio?.isEnabled),
        hasEndpoint: Boolean(melhorEnvio?.endpointUrl),
        fallbackToRules: freightExtra.fallbackToRules !== false,
      },
      actionLabel: "Configurar frete",
      actionHref: "/admin/integrations",
    },
    {
      key: "external-alerting",
      label: "Alertas externos",
      status: alerting?.isEnabled && Boolean(alerting.endpointUrl) ? "healthy" : "degraded",
      message:
        alerting?.isEnabled && Boolean(alerting.endpointUrl)
          ? "Alertas externos habilitados com endpoint configurado."
          : "Alertas externos ainda não estão configurados; incidentes ficam apenas no painel.",
      details: {
        enabled: Boolean(alerting?.isEnabled),
        hasEndpoint: Boolean(alerting?.endpointUrl),
        minLevel: String(alertingMinLevel).toUpperCase(),
      },
      actionLabel: "Revisar alertas",
      actionHref: "/admin/integrations",
    },
    {
      key: "upstash",
      label: "Upstash Redis",
      status: upstashRuntimeReady ? "healthy" : upstashPanelReady ? "degraded" : "degraded",
      message:
        upstashRuntimeReady
          ? "Upstash pronto para rate limiting distribuído e cache leve de rotas públicas."
          : upstashPanelReady
            ? "As credenciais do Upstash já estão salvas no painel, mas ainda faltam variáveis de ambiente no deploy."
            : "Upstash ainda não configurado; é a próxima melhoria barata para rate limit distribuído e cache leve.",
      details: {
        enabled: Boolean(upstash?.isEnabled),
        runtimeReady: upstashRuntimeReady,
        panelReady: upstashPanelReady,
      },
      actionLabel: "Configurar Upstash",
      actionHref: "/admin/integrations",
    },
    {
      key: "google-analytics",
      label: "Google Analytics 4",
      status: googleAnalytics?.isEnabled && isConfiguredSecret(googleAnalytics.publicKey) ? "healthy" : "degraded",
      message:
        googleAnalytics?.isEnabled && isConfiguredSecret(googleAnalytics.publicKey)
          ? "GA4 habilitado com Measurement ID pronto para coleta."
          : "GA4 ainda não configurado; deixe salvo no painel e ative quando quiser medir conversões.",
      details: {
        enabled: Boolean(googleAnalytics?.isEnabled),
        hasMeasurementId: isConfiguredSecret(googleAnalytics?.publicKey),
      },
      actionLabel: "Configurar GA4",
      actionHref: "/admin/integrations",
    },
    {
      key: "google-tag-manager",
      label: "Google Tag Manager",
      status: googleTagManager?.isEnabled && isConfiguredSecret(googleTagManager.publicKey) ? "healthy" : "degraded",
      message:
        googleTagManager?.isEnabled && isConfiguredSecret(googleTagManager.publicKey)
          ? "GTM habilitado com container pronto para publicação."
          : "GTM ainda não configurado; você poderá ativar sem alterar código depois.",
      details: {
        enabled: Boolean(googleTagManager?.isEnabled),
        hasContainerId: isConfiguredSecret(googleTagManager?.publicKey),
      },
      actionLabel: "Configurar GTM",
      actionHref: "/admin/integrations",
    },
    {
      key: "search-console",
      label: "Search Console / Webmaster",
      status:
        (googleSearchConsole?.isEnabled && isConfiguredSecret(googleSearchConsole.publicKey)) ||
        (bingWebmaster?.isEnabled && isConfiguredSecret(bingWebmaster.publicKey))
          ? "healthy"
          : "degraded",
      message:
        (googleSearchConsole?.isEnabled && isConfiguredSecret(googleSearchConsole.publicKey)) ||
        (bingWebmaster?.isEnabled && isConfiguredSecret(bingWebmaster.publicKey))
          ? "Tokens de verificação prontos para indexação e validação de domínio."
          : "Cadastre os tokens do Google Search Console e/ou Bing Webmaster no painel quando for a hora.",
      details: {
        googleEnabled: Boolean(googleSearchConsole?.isEnabled),
        googleVerified: isConfiguredSecret(googleSearchConsole?.publicKey),
        bingEnabled: Boolean(bingWebmaster?.isEnabled),
        bingVerified: isConfiguredSecret(bingWebmaster?.publicKey),
      },
      actionLabel: "Configurar verificações",
      actionHref: "/admin/integrations",
    },
    {
      key: "microsoft-clarity",
      label: "Microsoft Clarity",
      status: microsoftClarity?.isEnabled && isConfiguredSecret(microsoftClarity.publicKey) ? "healthy" : "degraded",
      message:
        microsoftClarity?.isEnabled && isConfiguredSecret(microsoftClarity.publicKey)
          ? "Clarity habilitado para mapas de calor e gravações de sessão."
          : "Clarity ainda não configurado; é uma melhoria gratuita recomendada para depois.",
      details: {
        enabled: Boolean(microsoftClarity?.isEnabled),
        hasProjectId: isConfiguredSecret(microsoftClarity?.publicKey),
      },
      actionLabel: "Configurar Clarity",
      actionHref: "/admin/integrations",
    },
    {
      key: "bling",
      label: "Bling ERP",
      status: bling?.isEnabled && (isConfiguredSecret(bling.publicKey) || isConfiguredSecret(bling.secretKey)) ? "healthy" : "degraded",
      message:
        bling?.isEnabled && (isConfiguredSecret(bling.publicKey) || isConfiguredSecret(bling.secretKey))
          ? "Credenciais do Bling já estão salvas; integração futura fica facilitada."
          : "Bling ainda não está configurado. Deixe os dados aqui no painel quando quiser integrar ERP depois.",
      details: {
        enabled: Boolean(bling?.isEnabled),
        hasPublicKey: isConfiguredSecret(bling?.publicKey),
        hasSecretKey: isConfiguredSecret(bling?.secretKey),
        hasEndpoint: Boolean(bling?.endpointUrl),
      },
      actionLabel: "Preparar Bling",
      actionHref: "/admin/integrations",
    },
  ];
}

export async function getOperationalHealthSnapshot(): Promise<HealthSnapshot> {
  const checkedAt = new Date().toISOString();
  const checks: HealthCheck[] = [];

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.push({
      key: "database",
      label: "Banco de dados",
      status: "healthy",
      message: "Banco respondeu corretamente ao health check.",
      actionLabel: "Ver relatórios",
      actionHref: "/admin/reports",
    });
  } catch (error) {
    checks.push({
      key: "database",
      label: "Banco de dados",
      status: "down",
      message: error instanceof Error ? error.message : "Falha ao validar o banco de dados.",
        actionLabel: "Ver relatórios",
        actionHref: "/admin/reports",
    });
  }

  checks.push({
    key: "auth-secrets",
    label: "Segredos de autenticação",
    status: isConfiguredSecret(process.env.AUTH_SECRET) || isConfiguredSecret(process.env.NEXTAUTH_SECRET) ? "healthy" : "degraded",
    message:
      isConfiguredSecret(process.env.AUTH_SECRET) || isConfiguredSecret(process.env.NEXTAUTH_SECRET)
        ? "Pelo menos um segredo de autenticação está configurado."
        : "Configure AUTH_SECRET ou NEXTAUTH_SECRET com valor forte fora dos placeholders.",
    actionLabel: "Abrir documentação",
    actionHref: "/api/health",
  });

  const [openIncidents, integrations, storeSettings] = await Promise.all([
    prisma.systemEventLog.count({
      where: {
        status: "OPEN",
        level: { in: ["ERROR", "WARNING"] },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.integrationSetting.findMany({
      where: { provider: { in: ["mercado_pago", "resend", "melhor_envio", "alerting", "google_analytics", "google_tag_manager", "google_search_console", "bing_webmaster", "microsoft_clarity", "bling"] } },
      select: {
        provider: true,
        name: true,
        isEnabled: true,
        publicKey: true,
        secretKey: true,
        webhookSecret: true,
        endpointUrl: true,
        extraConfig: true,
      },
    }),
    prisma.integrationSetting.findUnique({
      where: { provider: "store_settings" },
      select: { id: true },
    }),
  ]);

  checks.push({
    key: "incidents",
    label: "Incidentes operacionais",
    status: getIncidentHealthState(openIncidents),
    message:
      openIncidents === 0
        ? "Nenhum incidente aberto nos últimos 7 dias."
        : `${openIncidents} incidente(s) aberto(s) nos últimos 7 dias.`,
    details: { openIncidents },
    actionLabel: "Ver incidentes",
    actionHref: "/admin/incidents",
  });

  checks.push({
    key: "store-settings",
    label: "Configurações institucionais",
    status: storeSettings ? "healthy" : "degraded",
    message: storeSettings
      ? "Configurações institucionais da loja estão salvas no painel."
      : "As configurações institucionais ainda não foram persistidas no painel administrativo.",
    actionLabel: "Abrir configurações",
    actionHref: "/admin/settings",
  });

  checks.push(...buildIntegrationChecks(integrations));

  return {
    status: resolveHealthStatus(checks.map((item) => item.status)),
    checkedAt,
    checks,
  };
}