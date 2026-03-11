import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type IntegrationExtraConfigValue = string | number | boolean | null | IntegrationExtraConfigObject | IntegrationExtraConfigValue[];

export interface IntegrationExtraConfigObject {
  [key: string]: IntegrationExtraConfigValue;
}

export type IntegrationExtraConfig = IntegrationExtraConfigObject;

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

function parseExtraConfig(raw: string | null): IntegrationExtraConfig {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as IntegrationExtraConfig)
      : {};
  } catch {
    return {};
  }
}

export const getIntegrationSettings = cache(async (provider: string): Promise<RuntimeIntegration | null> => {
  const normalizedProvider = provider.trim().toLowerCase();
  const setting = await prisma.integrationSetting.findUnique({
    where: { provider: normalizedProvider },
  });

  if (!setting) return null;

  return {
    provider: setting.provider,
    name: setting.name,
    isEnabled: setting.isEnabled,
    environment: setting.environment,
    publicKey: setting.publicKey,
    secretKey: setting.secretKey,
    webhookSecret: setting.webhookSecret,
    endpointUrl: setting.endpointUrl,
    extraConfig: parseExtraConfig(setting.extraConfig),
  };
});