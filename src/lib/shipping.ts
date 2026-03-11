import { getIntegrationSettings } from "@/lib/integrations";
import { recordSystemEvent } from "@/lib/system-events";
import { getSiteUrl } from "@/lib/site-url";

export type ShippingQuote = {
  id: string;
  zipcode: string;
  region: string;
  service: string;
  amount: number;
  estimatedDays: number;
  isFree: boolean;
  freeThreshold: number;
  missingForFree: number;
};

export type ShippingOptionId = "standard" | "express" | "pickup";

type ShippingCalculationInput = {
  zipcode: string;
  subtotal: number;
  itemsCount: number;
};

type ShippingRule = {
  region: string;
  digits: number[];
  baseAmount: number;
  extraItemAmount: number;
  estimatedDays: number;
  freeThreshold: number;
};

type ShippingProviderConfig = {
  timeoutMs: number;
  fallbackToRules: boolean;
  allowPickup: boolean;
  originZipcode?: string;
  requestHeaders: Record<string, string>;
};

const SHIPPING_RULES: ShippingRule[] = [
  {
    region: "Sudeste",
    digits: [0, 1, 2, 3],
    baseAmount: 18.9,
    extraItemAmount: 2.5,
    estimatedDays: 3,
    freeThreshold: 199,
  },
  {
    region: "Nordeste",
    digits: [4],
    baseAmount: 24.9,
    extraItemAmount: 3.5,
    estimatedDays: 5,
    freeThreshold: 249,
  },
  {
    region: "Norte",
    digits: [5],
    baseAmount: 34.9,
    extraItemAmount: 4.5,
    estimatedDays: 7,
    freeThreshold: 349,
  },
  {
    region: "Centro-Oeste / Sul",
    digits: [6, 7, 8, 9],
    baseAmount: 22.9,
    extraItemAmount: 3,
    estimatedDays: 4,
    freeThreshold: 229,
  },
];

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function normalizeZipcode(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function getRuleByZipcode(zipcode: string) {
  const firstDigit = Number(zipcode[0] ?? 0);
  return SHIPPING_RULES.find((rule) => rule.digits.includes(firstDigit)) ?? SHIPPING_RULES[0];
}

export function buildRuleBasedShippingOptions(input: ShippingCalculationInput): ShippingQuote[] {
  const zipcode = normalizeZipcode(input.zipcode);

  if (zipcode.length !== 8) {
    throw new Error("CEP inválido para cálculo de frete.");
  }

  const subtotal = Math.max(0, input.subtotal);
  const itemsCount = Math.max(1, Math.floor(input.itemsCount));
  const rule = getRuleByZipcode(zipcode);
  const baseAmount = roundCurrency(rule.baseAmount + Math.max(0, itemsCount - 1) * rule.extraItemAmount);
  const standardIsFree = subtotal >= rule.freeThreshold;
  const standardAmount = standardIsFree ? 0 : baseAmount;
  const missingForFree = roundCurrency(Math.max(0, rule.freeThreshold - subtotal));

  const options: ShippingQuote[] = [
    {
      id: "standard",
      zipcode,
      region: rule.region,
      service: standardIsFree ? "Frete grátis" : "Entrega padrão",
      amount: standardAmount,
      estimatedDays: standardIsFree ? Math.max(2, rule.estimatedDays - 1) : rule.estimatedDays,
      isFree: standardIsFree,
      freeThreshold: rule.freeThreshold,
      missingForFree,
    },
    {
      id: "express",
      zipcode,
      region: rule.region,
      service: "Entrega expressa",
      amount: roundCurrency(baseAmount + 12.9),
      estimatedDays: Math.max(1, rule.estimatedDays - 2),
      isFree: false,
      freeThreshold: rule.freeThreshold,
      missingForFree,
    },
    {
      id: "pickup",
      zipcode,
      region: "Retirada local",
      service: "Retirar na loja",
      amount: 0,
      estimatedDays: 1,
      isFree: true,
      freeThreshold: 0,
      missingForFree: 0,
    },
  ];

  return options;
}

function normalizeShippingOptionId(value: unknown, index: number): ShippingOptionId {
  if (value === "standard" || value === "express" || value === "pickup") {
    return value;
  }

  return index === 1 ? "express" : index === 2 ? "pickup" : "standard";
}

function normalizeProviderOptions(input: ShippingCalculationInput, payload: unknown): ShippingQuote[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const zipcode = normalizeZipcode(input.zipcode);
  const subtotal = Math.max(0, input.subtotal);
  const rule = getRuleByZipcode(zipcode);
  const candidate = payload as { options?: unknown; quote?: unknown };
  const rawOptions = Array.isArray(candidate.options)
    ? candidate.options
    : candidate.quote && typeof candidate.quote === "object"
      ? [candidate.quote]
      : [];

  const normalizedOptions = rawOptions
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const item = entry as Record<string, unknown>;
      const amount = Number(item.amount ?? item.price ?? item.cost);
      const estimatedDays = Number(item.estimatedDays ?? item.deliveryDays ?? item.deadline);

      if (!Number.isFinite(amount) || !Number.isFinite(estimatedDays)) {
        return null;
      }

      const freeThreshold = Number(item.freeThreshold ?? rule.freeThreshold);
      const resolvedFreeThreshold = Number.isFinite(freeThreshold) ? freeThreshold : rule.freeThreshold;
      const missingForFree = Number(item.missingForFree ?? Math.max(0, resolvedFreeThreshold - subtotal));
      const normalizedAmount = roundCurrency(Math.max(0, amount));
      const isFree = typeof item.isFree === "boolean" ? item.isFree : normalizedAmount === 0;

      const normalizedOption: ShippingQuote = {
        id: normalizeShippingOptionId(item.id, index),
        zipcode,
        region: typeof item.region === "string" && item.region.trim() ? item.region.trim() : rule.region,
        service: typeof item.service === "string" && item.service.trim() ? item.service.trim() : `Entrega ${index + 1}`,
        amount: normalizedAmount,
        estimatedDays: Math.max(1, Math.round(estimatedDays)),
        isFree,
        freeThreshold: roundCurrency(Math.max(0, resolvedFreeThreshold)),
        missingForFree: roundCurrency(Math.max(0, Number.isFinite(missingForFree) ? missingForFree : 0)),
      };

      return normalizedOption;
    })
    .filter((option): option is ShippingQuote => option !== null);

  return normalizedOptions;
}

function readShippingProviderConfig(raw: Record<string, unknown>): ShippingProviderConfig {
  const timeoutMs = Number(raw.timeoutMs ?? 3500);
  const normalizedTimeoutMs = Number.isFinite(timeoutMs) ? Math.min(Math.max(Math.round(timeoutMs), 500), 15000) : 3500;

  const fallbackToRules = typeof raw.fallbackToRules === "boolean" ? raw.fallbackToRules : true;
  const allowPickup = typeof raw.allowPickup === "boolean" ? raw.allowPickup : true;

  const requestHeaders = raw.requestHeaders;
  const normalizedHeaders: Record<string, string> = {};
  if (requestHeaders && typeof requestHeaders === "object" && !Array.isArray(requestHeaders)) {
    for (const [key, value] of Object.entries(requestHeaders as Record<string, unknown>)) {
      if (key.trim() && typeof value === "string" && value.trim()) {
        normalizedHeaders[key] = value;
      }
    }
  }

  const originZipcodeRaw = typeof raw.originZipcode === "string" ? raw.originZipcode : undefined;
  const originZipcode = originZipcodeRaw ? normalizeZipcode(originZipcodeRaw) : undefined;

  return {
    timeoutMs: normalizedTimeoutMs,
    fallbackToRules,
    allowPickup,
    originZipcode: originZipcode && originZipcode.length === 8 ? originZipcode : undefined,
    requestHeaders: normalizedHeaders,
  };
}

function applyProviderConfigToOptions(options: ShippingQuote[], config: ShippingProviderConfig) {
  if (config.allowPickup) {
    return options;
  }

  return options.filter((option) => option.id !== "pickup");
}

function resolveProviderEndpointUrl(endpointUrl: string) {
  if (endpointUrl.startsWith("/")) {
    return `${getSiteUrl()}${endpointUrl}`;
  }

  return endpointUrl;
}

async function fetchProviderShippingOptions(input: ShippingCalculationInput): Promise<ShippingQuote[] | null> {
  const integration = await getIntegrationSettings("melhor_envio");

  if (!integration?.isEnabled || !integration.endpointUrl) {
    return null;
  }

  const config = readShippingProviderConfig(integration.extraConfig as Record<string, unknown>);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(resolveProviderEndpointUrl(integration.endpointUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(integration.secretKey ? { Authorization: `Bearer ${integration.secretKey}` } : {}),
        ...(integration.publicKey ? { "X-Public-Key": integration.publicKey } : {}),
        ...config.requestHeaders,
      },
      body: JSON.stringify({
        zipcode: normalizeZipcode(input.zipcode),
        subtotal: input.subtotal,
        itemsCount: input.itemsCount,
        originZipcode: config.originZipcode,
        environment: integration.environment,
        options: integration.extraConfig,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Provider returned ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const options = applyProviderConfigToOptions(normalizeProviderOptions(input, payload), config);

    if (!options.length) {
      throw new Error("Provider returned no valid shipping options");
    }

    return options;
  } catch (error) {
    await recordSystemEvent({
      level: "warning",
      source: "shipping",
      eventCode: "SHIPPING_PROVIDER_FALLBACK",
      message: error instanceof Error ? error.message : "Falha ao consultar o provider de frete configurado.",
      payload: {
        provider: integration.provider,
        zipcode: normalizeZipcode(input.zipcode),
        environment: integration.environment,
        fallbackToRules: config.fallbackToRules,
      },
    });

    if (!config.fallbackToRules) {
      throw error instanceof Error ? error : new Error("Falha ao consultar o provider de frete configurado.");
    }

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function listShippingOptions(input: ShippingCalculationInput): Promise<ShippingQuote[]> {
  const providerOptions = await fetchProviderShippingOptions(input);
  return providerOptions ?? buildRuleBasedShippingOptions(input);
}

export async function getShippingOptionById(input: ShippingCalculationInput & { optionId?: string | null }) {
  const options = await listShippingOptions(input);
  return options.find((option) => option.id === input.optionId) ?? options[0];
}

export async function calculateShippingQuote(input: ShippingCalculationInput): Promise<ShippingQuote> {
  const options = await listShippingOptions(input);
  return options[0];
}