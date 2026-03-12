"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/audit-log";
import { getSiteUrl } from "@/lib/site-url";
import { parseIntegrationExtraConfig, type IntegrationExtraConfig } from "@/lib/integrations";
import { redirect } from "next/navigation";

async function checkAdmin() {
  return requireAdminPermission("settings:manage");
}

function validateStringMap(value: unknown, fieldLabel: string) {
  if (!value) return undefined;

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${fieldLabel} deve ser um objeto JSON simples.`);
  }

  const entries = Object.entries(value as Record<string, unknown>);
  for (const [key, entryValue] of entries) {
    if (!key.trim() || typeof entryValue !== "string") {
      throw new Error(`${fieldLabel} deve conter apenas pares chave/valor em texto.`);
    }
  }

  return value as Record<string, string>;
}

function normalizeOptionalUrl(value: string | null, fieldLabel: string) {
  if (!value) return null;

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    throw new Error(`${fieldLabel} inválido.`);
  }
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function readRequiredString(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readBoolean(formData: FormData, key: string, defaultValue = false) {
  const value = formData.get(key);
  if (value === null) return defaultValue;
  return value === "on" || value === "true";
}

function readOptionalJsonObject(formData: FormData, key: string, fieldLabel: string) {
  const raw = readOptionalString(formData, key);
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error();
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`${fieldLabel} deve ser um JSON simples válido.`);
  }
}

type ProfileFields = {
  publicKey?: string | null;
  secretKey?: string | null;
  webhookSecret?: string | null;
  endpointUrl?: string | null;
  extraConfig?: IntegrationExtraConfig;
};

type PersistableIntegrationPayload = {
  environment: string;
  publicKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  endpointUrl: string | null;
  extraConfig: IntegrationExtraConfig;
};

function cleanObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => {
      if (entryValue == null) return false;
      if (typeof entryValue === "string") return entryValue.trim().length > 0;
      if (typeof entryValue === "object") return Object.keys(entryValue).length > 0;
      return true;
    }),
  );
}

function cleanExtraConfig(value: Record<string, unknown>) {
  return cleanObject(value) as IntegrationExtraConfig;
}

function readProfileString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readProfileExtraConfig(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as IntegrationExtraConfig)
    : {};
}

function buildProfileFields(formData: FormData, environment: string, options?: { includePublicKey?: boolean; includeWebhookSecret?: boolean }) {
  const profileKey = `profile_${environment}`;

  const publicKey = options?.includePublicKey === false ? null : readOptionalString(formData, `${profileKey}_publicKey`);
  const secretKey = readOptionalString(formData, `${profileKey}_secretKey`);
  const webhookSecret = options?.includeWebhookSecret === false ? null : readOptionalString(formData, `${profileKey}_webhookSecret`);
  const endpointUrl = normalizeOptionalUrl(readOptionalString(formData, `${profileKey}_endpointUrl`), "Endpoint / URL");

  return cleanObject({
    publicKey,
    secretKey,
    webhookSecret,
    endpointUrl,
  }) as ProfileFields;
}

function buildMercadoPagoPayload(formData: FormData, existingExtraConfig: IntegrationExtraConfig): PersistableIntegrationPayload {
  const environment = readRequiredString(formData, "environment", "production");
  const statementDescriptor = readOptionalString(formData, "statementDescriptor");
  const pixDiscountPercentRaw = readOptionalString(formData, "pixDiscountPercent");
  const pixDiscountPercent = pixDiscountPercentRaw ? Number(pixDiscountPercentRaw.replace(",", ".")) : Number(existingExtraConfig.pixDiscountPercent ?? 10);

  if (!Number.isFinite(pixDiscountPercent) || pixDiscountPercent < 0) {
    throw new Error("No Mercado Pago, o desconto Pix deve ser um número maior ou igual a zero.");
  }

  const profiles = {
    production: buildProfileFields(formData, "production"),
    sandbox: buildProfileFields(formData, "sandbox"),
  };
  const activeProfile = profiles[environment as keyof typeof profiles] ?? profiles.production;
  const siteUrl = getSiteUrl();

  return {
    environment,
    publicKey: readProfileString(activeProfile.publicKey),
    secretKey: readProfileString(activeProfile.secretKey),
    webhookSecret: readProfileString(activeProfile.webhookSecret),
    endpointUrl: readProfileString(activeProfile.endpointUrl) ?? "https://api.mercadopago.com",
    extraConfig: cleanExtraConfig({
      ...existingExtraConfig,
      statementDescriptor,
      pixDiscountPercent: Number(pixDiscountPercent.toFixed(2)),
      notificationMode: "webhooks",
      notificationUrl: `${siteUrl}/api/webhooks/mercado-pago`,
      sourceNews: "webhooks",
      profiles: cleanObject(profiles),
    }),
  };
}

function buildResendPayload(formData: FormData, existingExtraConfig: IntegrationExtraConfig): PersistableIntegrationPayload {
  const environment = readRequiredString(formData, "environment", "production");
  const baseProfiles = {
    production: buildProfileFields(formData, "production", { includePublicKey: false, includeWebhookSecret: false }),
    sandbox: buildProfileFields(formData, "sandbox", { includePublicKey: false, includeWebhookSecret: false }),
  };

  const productionExtraConfig = cleanObject({
    fromEmail: readOptionalString(formData, "profile_production_fromEmail"),
    replyTo: readOptionalString(formData, "profile_production_replyTo"),
  });
  const sandboxExtraConfig = cleanObject({
    fromEmail: readOptionalString(formData, "profile_sandbox_fromEmail"),
    replyTo: readOptionalString(formData, "profile_sandbox_replyTo"),
  });

  const profiles = {
    production: cleanObject({ ...baseProfiles.production, extraConfig: productionExtraConfig }),
    sandbox: cleanObject({ ...baseProfiles.sandbox, extraConfig: sandboxExtraConfig }),
  };
  const activeProfile = profiles[environment as keyof typeof profiles] ?? profiles.production;
  const activeExtraConfig = readProfileExtraConfig(activeProfile.extraConfig);

  return {
    environment,
    publicKey: null,
    secretKey: readProfileString(activeProfile.secretKey),
    webhookSecret: null,
    endpointUrl: readProfileString(activeProfile.endpointUrl) ?? "https://api.resend.com",
    extraConfig: cleanExtraConfig({
      ...existingExtraConfig,
      ...activeExtraConfig,
      profiles: cleanObject(profiles),
    }),
  };
}

function buildShippingPayload(formData: FormData, existingExtraConfig: IntegrationExtraConfig): PersistableIntegrationPayload {
  const environment = readRequiredString(formData, "environment", "production");
  const productionHeaders = validateStringMap(readOptionalJsonObject(formData, "profile_production_requestHeaders", "No frete, requestHeaders de produção"), "No frete, requestHeaders de produção");
  const sandboxHeaders = validateStringMap(readOptionalJsonObject(formData, "profile_sandbox_requestHeaders", "No frete, requestHeaders de homologação"), "No frete, requestHeaders de homologação");

  const buildShippingExtraConfig = (prefix: "production" | "sandbox") => {
    const timeoutMsRaw = readOptionalString(formData, `profile_${prefix}_timeoutMs`);
    const timeoutMs = timeoutMsRaw ? Number(timeoutMsRaw) : undefined;
    if (timeoutMs !== undefined && (!Number.isFinite(timeoutMs) || timeoutMs < 500 || timeoutMs > 15000)) {
      throw new Error("No frete, timeoutMs deve ficar entre 500 e 15000 ms.");
    }

    const originZipcodeRaw = readOptionalString(formData, `profile_${prefix}_originZipcode`);
    const originZipcode = originZipcodeRaw ? originZipcodeRaw.replace(/\D/g, "").slice(0, 8) : undefined;
    if (originZipcodeRaw && originZipcode?.length !== 8) {
      throw new Error("No frete, originZipcode deve conter um CEP válido com 8 dígitos.");
    }

    return cleanObject({
      timeoutMs: timeoutMs ? Math.round(timeoutMs) : undefined,
      fallbackToRules: readBoolean(formData, `profile_${prefix}_fallbackToRules`, true),
      allowPickup: readBoolean(formData, `profile_${prefix}_allowPickup`, false),
      originZipcode,
      requestHeaders: prefix === "production" ? productionHeaders : sandboxHeaders,
    });
  };

  const profiles = {
    production: cleanObject({ ...buildProfileFields(formData, "production"), extraConfig: buildShippingExtraConfig("production") }),
    sandbox: cleanObject({ ...buildProfileFields(formData, "sandbox"), extraConfig: buildShippingExtraConfig("sandbox") }),
  };
  const activeProfile = profiles[environment as keyof typeof profiles] ?? profiles.production;
  const activeExtraConfig = readProfileExtraConfig(activeProfile.extraConfig);

  return {
    environment,
    publicKey: readProfileString(activeProfile.publicKey),
    secretKey: readProfileString(activeProfile.secretKey),
    webhookSecret: null,
    endpointUrl: readProfileString(activeProfile.endpointUrl),
    extraConfig: cleanExtraConfig({
      ...existingExtraConfig,
      ...activeExtraConfig,
      profiles: cleanObject(profiles),
    }),
  };
}

function buildAlertingPayload(formData: FormData, existingExtraConfig: IntegrationExtraConfig): PersistableIntegrationPayload {
  const environment = readRequiredString(formData, "environment", "production");
  const buildAlertExtraConfig = (prefix: "production" | "internal") => {
    const minLevel = readRequiredString(formData, `profile_${prefix}_minLevel`, String(existingExtraConfig.minLevel ?? "ERROR")).toUpperCase();
    if (!["INFO", "WARNING", "ERROR"].includes(minLevel)) {
      throw new Error("Em alertas, minLevel deve ser INFO, WARNING ou ERROR.");
    }

    return { minLevel };
  };

  const profiles = {
    production: cleanObject({ ...buildProfileFields(formData, "production", { includePublicKey: false, includeWebhookSecret: false }), extraConfig: buildAlertExtraConfig("production") }),
    internal: cleanObject({ ...buildProfileFields(formData, "internal", { includePublicKey: false, includeWebhookSecret: false }), extraConfig: buildAlertExtraConfig("internal") }),
  };
  const activeProfile = profiles[environment as keyof typeof profiles] ?? profiles.production;
  const activeExtraConfig = readProfileExtraConfig(activeProfile.extraConfig);

  return {
    environment,
    publicKey: null,
    secretKey: readProfileString(activeProfile.secretKey),
    webhookSecret: null,
    endpointUrl: readProfileString(activeProfile.endpointUrl),
    extraConfig: cleanExtraConfig({
      ...existingExtraConfig,
      ...activeExtraConfig,
      profiles: cleanObject(profiles),
    }),
  };
}

function buildSingleProviderPayload(formData: FormData, existingExtraConfig: IntegrationExtraConfig, provider: string): PersistableIntegrationPayload {
  if (provider === "google_analytics") {
    const measurementId = readOptionalString(formData, "publicKey");
    return {
      environment: "production",
      publicKey: measurementId,
      secretKey: null,
      webhookSecret: null,
      endpointUrl: null,
      extraConfig: cleanExtraConfig({ ...existingExtraConfig, measurementId }),
    };
  }

  if (provider === "google_tag_manager") {
    const containerId = readOptionalString(formData, "publicKey");
    return {
      environment: "production",
      publicKey: containerId,
      secretKey: null,
      webhookSecret: null,
      endpointUrl: null,
      extraConfig: cleanExtraConfig({ ...existingExtraConfig, containerId }),
    };
  }

  if (provider === "google_search_console") {
    const verificationToken = readOptionalString(formData, "publicKey");
    return {
      environment: "production",
      publicKey: verificationToken,
      secretKey: null,
      webhookSecret: null,
      endpointUrl: null,
      extraConfig: cleanExtraConfig({ ...existingExtraConfig, verificationToken }),
    };
  }

  if (provider === "bing_webmaster") {
    const verificationToken = readOptionalString(formData, "publicKey");
    return {
      environment: "production",
      publicKey: verificationToken,
      secretKey: null,
      webhookSecret: null,
      endpointUrl: null,
      extraConfig: cleanExtraConfig({ ...existingExtraConfig, verificationToken }),
    };
  }

  if (provider === "microsoft_clarity") {
    const projectId = readOptionalString(formData, "publicKey");
    return {
      environment: "production",
      publicKey: projectId,
      secretKey: null,
      webhookSecret: null,
      endpointUrl: null,
      extraConfig: cleanExtraConfig({ ...existingExtraConfig, projectId }),
    };
  }

  if (provider === "upstash") {
    const restUrl = normalizeOptionalUrl(readOptionalString(formData, "publicKey"), "URL REST do Upstash");
    const restToken = readOptionalString(formData, "secretKey");
    return {
      environment: "production",
      publicKey: restUrl,
      secretKey: restToken,
      webhookSecret: null,
      endpointUrl: restUrl,
      extraConfig: cleanExtraConfig({
        ...existingExtraConfig,
        purpose: ["rate_limit", "search_cache"],
      }),
    };
  }

  return {
    environment: "production",
    publicKey: readOptionalString(formData, "publicKey"),
    secretKey: readOptionalString(formData, "secretKey"),
    webhookSecret: readOptionalString(formData, "webhookSecret"),
    endpointUrl: normalizeOptionalUrl(readOptionalString(formData, "endpointUrl"), "Endpoint / URL"),
    extraConfig: existingExtraConfig,
  };
}

export async function saveIntegrationSettings(provider: string, formData: FormData) {
  const actor = await checkAdmin();
  const normalizedProvider = provider.trim().toLowerCase();
  const currentTab = readRequiredString(formData, "tab", "payments");
  const redirectBase = `/admin/integrations?tab=${encodeURIComponent(currentTab)}`;

  try {
    const name = readRequiredString(formData, "name", normalizedProvider);
    const isEnabled = formData.get("isEnabled") === "on";
    const existing = await prisma.integrationSetting.findUnique({ where: { provider: normalizedProvider } });
    const existingExtraConfig = parseIntegrationExtraConfig(existing?.extraConfig ?? null);

    const payload = normalizedProvider === "mercado_pago"
      ? buildMercadoPagoPayload(formData, existingExtraConfig)
      : normalizedProvider === "resend"
        ? buildResendPayload(formData, existingExtraConfig)
        : normalizedProvider === "melhor_envio"
          ? buildShippingPayload(formData, existingExtraConfig)
          : normalizedProvider === "alerting"
            ? buildAlertingPayload(formData, existingExtraConfig)
            : buildSingleProviderPayload(formData, existingExtraConfig, normalizedProvider);

    const serializedExtraConfig = Object.keys(payload.extraConfig).length
      ? JSON.stringify(payload.extraConfig, null, 2)
      : null;

    if (isEnabled && ["melhor_envio", "alerting"].includes(normalizedProvider) && !payload.endpointUrl) {
      throw new Error("Essa integração precisa de um endpoint configurado antes de ser ativada.");
    }

    if (isEnabled && normalizedProvider === "mercado_pago" && !payload.secretKey) {
      throw new Error("No Mercado Pago, preencha o access token do ambiente ativo antes de ativar.");
    }

    if (isEnabled && normalizedProvider === "resend" && !payload.secretKey) {
      throw new Error("No Resend, preencha a API key do ambiente ativo antes de ativar.");
    }

    await prisma.integrationSetting.upsert({
      where: { provider: normalizedProvider },
      update: {
        name,
        isEnabled,
        environment: payload.environment,
        publicKey: payload.publicKey,
        secretKey: payload.secretKey,
        webhookSecret: payload.webhookSecret,
        endpointUrl: payload.endpointUrl,
        extraConfig: serializedExtraConfig,
      },
      create: {
        provider: normalizedProvider,
        name,
        isEnabled,
        environment: payload.environment,
        publicKey: payload.publicKey,
        secretKey: payload.secretKey,
        webhookSecret: payload.webhookSecret,
        endpointUrl: payload.endpointUrl,
        extraConfig: serializedExtraConfig,
      },
    });

    await logAdminAudit({
      actor,
      action: "integration.save",
      entityType: "integration",
      entityId: normalizedProvider,
      summary: `Integração ${name} atualizada.`,
      metadata: {
        provider: normalizedProvider,
        environment: payload.environment,
        isEnabled,
        hasPublicKey: Boolean(payload.publicKey),
        hasSecretKey: Boolean(payload.secretKey),
        hasWebhookSecret: Boolean(payload.webhookSecret),
        hasEndpointUrl: Boolean(payload.endpointUrl),
        hasExtraConfig: Boolean(serializedExtraConfig),
      },
    });

    revalidatePath("/admin/integrations");
    revalidatePath("/", "layout");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar a integração.";
    redirect(`${redirectBase}&error=${encodeURIComponent(message)}`);
  }

  redirect(`${redirectBase}&saved=${encodeURIComponent(normalizedProvider)}`);
}