import { cache } from "react";
import type { IntegrationSetting } from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export type IntegrationExtraConfigValue = string | number | boolean | null | IntegrationExtraConfigObject | IntegrationExtraConfigValue[];

export interface IntegrationExtraConfigObject {
  [key: string]: IntegrationExtraConfigValue;
}

export type IntegrationExtraConfig = IntegrationExtraConfigObject;

type IntegrationProfiledFields = {
  publicKey?: string | null;
  secretKey?: string | null;
  webhookSecret?: string | null;
  endpointUrl?: string | null;
  extraConfig?: IntegrationExtraConfig;
};

export type RuntimeIntegration = {
  provider: string;
  name: string;
  isEnabled: boolean;
  environment: string;
  publicKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  endpointUrl: string | null;
  extraConfig: IntegrationExtraConfig;
};

type IntegrationPreset = RuntimeIntegration;

type IntegrationHealthRecord = {
  provider: string;
  name: string;
  isEnabled: boolean;
  publicKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  endpointUrl: string | null;
  extraConfig: string | null;
};

type IntegrationFormState = {
  isEnabled: boolean;
  environment: string | null;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  endpointUrl: string;
  extraConfigRaw: string;
  updatedAt: Date | null;
};

const DEFAULT_INTEGRATION_PRESETS: Record<string, IntegrationPreset> = {
  google_analytics: {
    provider: "google_analytics",
    name: "Google Analytics 4",
    isEnabled: true,
    environment: "production",
    publicKey: "G-JX0K9554KQ",
    secretKey: null,
    webhookSecret: null,
    endpointUrl: null,
    extraConfig: {
      measurementId: "G-JX0K9554KQ",
    },
  },
  resend: {
    provider: "resend",
    name: "Resend",
    isEnabled: Boolean(process.env.RESEND_API_KEY),
    environment: "production",
    publicKey: null,
    secretKey: process.env.RESEND_API_KEY ?? null,
    webhookSecret: null,
    endpointUrl: "https://api.resend.com",
    extraConfig: {},
  },
  upstash: {
    provider: "upstash",
    name: "Upstash Redis",
    isEnabled: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    environment: "production",
    publicKey: process.env.UPSTASH_REDIS_REST_URL ?? null,
    secretKey: process.env.UPSTASH_REDIS_REST_TOKEN ?? null,
    webhookSecret: null,
    endpointUrl: process.env.UPSTASH_REDIS_REST_URL ?? null,
    extraConfig: {},
  },
};

function isIntegrationExtraConfigObject(value: unknown): value is IntegrationExtraConfigObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseIntegrationExtraConfig(raw: string | null): IntegrationExtraConfig {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isIntegrationExtraConfigObject(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function readProfiledFields(extraConfig: IntegrationExtraConfig, environment: string): IntegrationProfiledFields | null {
  const profiles = extraConfig.profiles;

  if (!isIntegrationExtraConfigObject(profiles)) {
    return null;
  }

  const selectedProfile = profiles[environment];
  if (!isIntegrationExtraConfigObject(selectedProfile)) {
    return null;
  }

  const extra = isIntegrationExtraConfigObject(selectedProfile.extraConfig)
    ? selectedProfile.extraConfig
    : undefined;

  return {
    publicKey: typeof selectedProfile.publicKey === "string" ? selectedProfile.publicKey : null,
    secretKey: typeof selectedProfile.secretKey === "string" ? selectedProfile.secretKey : null,
    webhookSecret: typeof selectedProfile.webhookSecret === "string" ? selectedProfile.webhookSecret : null,
    endpointUrl: typeof selectedProfile.endpointUrl === "string" ? selectedProfile.endpointUrl : null,
    extraConfig: extra,
  };
}

function stripProfilesFromExtraConfig(extraConfig: IntegrationExtraConfig) {
  const rest = { ...extraConfig };
  delete rest.profiles;
  return rest;
}

function serializeExtraConfig(extraConfig: IntegrationExtraConfig) {
  return Object.keys(extraConfig).length ? JSON.stringify(extraConfig, null, 2) : null;
}

export function getDefaultIntegrationPreset(provider: string): IntegrationPreset | null {
  const normalizedProvider = provider.trim().toLowerCase();
  const preset = DEFAULT_INTEGRATION_PRESETS[normalizedProvider];

  if (!preset) return null;

  return {
    ...preset,
    extraConfig: { ...preset.extraConfig },
  };
}

export function getDefaultIntegrationHealthRecords(): IntegrationHealthRecord[] {
  return Object.values(DEFAULT_INTEGRATION_PRESETS).map((preset) => ({
    provider: preset.provider,
    name: preset.name,
    isEnabled: preset.isEnabled,
    publicKey: preset.publicKey,
    secretKey: preset.secretKey,
    webhookSecret: preset.webhookSecret,
    endpointUrl: preset.endpointUrl,
    extraConfig: serializeExtraConfig(preset.extraConfig),
  }));
}

export function getIntegrationFormState(provider: string, saved?: IntegrationSetting | null): IntegrationFormState {
  const preset = getDefaultIntegrationPreset(provider);

  return {
    isEnabled: saved?.isEnabled ?? preset?.isEnabled ?? false,
    environment: saved?.environment ?? preset?.environment ?? null,
    publicKey: saved?.publicKey ?? preset?.publicKey ?? "",
    secretKey: saved?.secretKey ?? preset?.secretKey ?? "",
    webhookSecret: saved?.webhookSecret ?? preset?.webhookSecret ?? "",
    endpointUrl: saved?.endpointUrl ?? preset?.endpointUrl ?? "",
    extraConfigRaw: saved?.extraConfig ?? serializeExtraConfig(preset?.extraConfig ?? {}) ?? "",
    updatedAt: saved?.updatedAt ?? null,
  };
}

export const getIntegrationSettings = cache(async (provider: string): Promise<RuntimeIntegration | null> => {
  const normalizedProvider = provider.trim().toLowerCase();
  const preset = getDefaultIntegrationPreset(normalizedProvider);

  if (!hasDatabaseUrl()) {
    return preset;
  }

  const setting = await prisma.integrationSetting.findUnique({
    where: { provider: normalizedProvider },
  });

  if (!setting) return preset;

  const parsedExtraConfig = parseIntegrationExtraConfig(setting.extraConfig);
  const baseExtraConfig = stripProfilesFromExtraConfig(parsedExtraConfig);
  const profiledFields = readProfiledFields(parsedExtraConfig, setting.environment || preset?.environment || "sandbox");

  return {
    provider: setting.provider,
    name: setting.name || preset?.name || setting.provider,
    isEnabled: setting.isEnabled,
    environment: setting.environment || preset?.environment || "sandbox",
    publicKey: profiledFields?.publicKey ?? setting.publicKey ?? preset?.publicKey ?? null,
    secretKey: profiledFields?.secretKey ?? setting.secretKey ?? preset?.secretKey ?? null,
    webhookSecret: profiledFields?.webhookSecret ?? setting.webhookSecret ?? preset?.webhookSecret ?? null,
    endpointUrl: profiledFields?.endpointUrl ?? setting.endpointUrl ?? preset?.endpointUrl ?? null,
    extraConfig: {
      ...(preset?.extraConfig ?? {}),
      ...baseExtraConfig,
      ...(profiledFields?.extraConfig ?? {}),
    },
  };
});