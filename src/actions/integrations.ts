"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/audit-log";

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

function normalizeProviderExtraConfig(provider: string, raw: string | null) {
  if (!raw) return null;

  let parsed: Record<string, unknown>;

  try {
    const candidate = JSON.parse(raw) as unknown;

    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new Error();
    }

    parsed = candidate as Record<string, unknown>;
  } catch {
    throw new Error("Configuração extra deve ser um JSON simples válido.");
  }

  if (provider === "melhor_envio") {
    const timeoutMs = parsed.timeoutMs;
    if (timeoutMs !== undefined) {
      const normalizedTimeout = Number(timeoutMs);
      if (!Number.isFinite(normalizedTimeout) || normalizedTimeout < 500 || normalizedTimeout > 15000) {
        throw new Error("No frete, timeoutMs deve ficar entre 500 e 15000 ms.");
      }

      parsed.timeoutMs = Math.round(normalizedTimeout);
    }

    if (parsed.fallbackToRules !== undefined && typeof parsed.fallbackToRules !== "boolean") {
      throw new Error("No frete, fallbackToRules deve ser true ou false.");
    }

    if (parsed.allowPickup !== undefined && typeof parsed.allowPickup !== "boolean") {
      throw new Error("No frete, allowPickup deve ser true ou false.");
    }

    if (parsed.originZipcode !== undefined) {
      const originZipcode = String(parsed.originZipcode).replace(/\D/g, "").slice(0, 8);
      if (originZipcode.length !== 8) {
        throw new Error("No frete, originZipcode deve conter um CEP válido com 8 dígitos.");
      }

      parsed.originZipcode = originZipcode;
    }

    if (parsed.requestHeaders !== undefined) {
      parsed.requestHeaders = validateStringMap(parsed.requestHeaders, "No frete, requestHeaders");
    }
  }

  if (provider === "alerting" && parsed.minLevel !== undefined) {
    const minLevel = String(parsed.minLevel).toUpperCase();
    if (!["INFO", "WARNING", "ERROR"].includes(minLevel)) {
      throw new Error("Em alertas, minLevel deve ser INFO, WARNING ou ERROR.");
    }

    parsed.minLevel = minLevel;
  }

  return JSON.stringify(parsed);
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

export async function saveIntegrationSettings(provider: string, formData: FormData) {
  const actor = await checkAdmin();

  const normalizedProvider = provider.trim().toLowerCase();
  const name = readRequiredString(formData, "name", normalizedProvider);
  const environment = readRequiredString(formData, "environment", "sandbox");
  const isEnabled = formData.get("isEnabled") === "on";
  const publicKey = readOptionalString(formData, "publicKey");
  const secretKey = readOptionalString(formData, "secretKey");
  const webhookSecret = readOptionalString(formData, "webhookSecret");
  const endpointUrl = normalizeOptionalUrl(readOptionalString(formData, "endpointUrl"), "Endpoint / URL");
  const extraConfig = normalizeProviderExtraConfig(normalizedProvider, readOptionalString(formData, "extraConfig"));

  if (isEnabled && ["melhor_envio", "alerting"].includes(normalizedProvider) && !endpointUrl) {
    throw new Error("Essa integração precisa de um endpoint configurado antes de ser ativada.");
  }

  await prisma.integrationSetting.upsert({
    where: { provider: normalizedProvider },
    update: {
      name,
      isEnabled,
      environment,
      publicKey,
      secretKey,
      webhookSecret,
      endpointUrl,
      extraConfig,
    },
    create: {
      provider: normalizedProvider,
      name,
      isEnabled,
      environment,
      publicKey,
      secretKey,
      webhookSecret,
      endpointUrl,
      extraConfig,
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
      environment,
      isEnabled,
      hasPublicKey: Boolean(publicKey),
      hasSecretKey: Boolean(secretKey),
      hasWebhookSecret: Boolean(webhookSecret),
      hasEndpointUrl: Boolean(endpointUrl),
      hasExtraConfig: Boolean(extraConfig),
    },
  });

  revalidatePath("/admin/integrations");
}