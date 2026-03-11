import { NextResponse } from "next/server";
import { shippingCalculationSchema } from "@/lib/validators";
import { buildRuleBasedShippingOptions, normalizeZipcode } from "@/lib/shipping";
import { getIntegrationSettings } from "@/lib/integrations";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const integration = await getIntegrationSettings("melhor_envio");

  if (integration?.secretKey) {
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${integration.secretKey}`) {
      return unauthorized();
    }
  }

  const body = (await request.json()) as Record<string, unknown>;
  const parsed = shippingCalculationSchema.safeParse({
    zipcode: body.zipcode,
    subtotal: body.subtotal,
    itemsCount: body.itemsCount,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload inválido." }, { status: 400 });
  }

  const options = buildRuleBasedShippingOptions(parsed.data).map((option) => ({
    id: option.id,
    service:
      option.id === "standard"
        ? option.isFree
          ? "Frete grátis mock"
          : "PAC mock"
        : option.id === "express"
          ? "SEDEX mock"
          : "Retirada local mock",
    region: option.region,
    amount: option.amount,
    estimatedDays: option.estimatedDays,
    isFree: option.isFree,
    freeThreshold: option.freeThreshold,
    missingForFree: option.missingForFree,
    zipcode: normalizeZipcode(parsed.data.zipcode),
  }));

  return NextResponse.json({
    provider: "mock",
    environment: integration?.environment ?? "internal",
    options,
    diagnostics: {
      receivedAt: new Date().toISOString(),
      itemsCount: parsed.data.itemsCount,
      subtotal: parsed.data.subtotal,
    },
  });
}