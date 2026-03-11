import { NextResponse } from "next/server";
import { calculateShippingQuote, listShippingOptions } from "@/lib/shipping";
import { shippingCalculationSchema } from "@/lib/validators";
import { recordSystemEvent } from "@/lib/system-events";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = shippingCalculationSchema.safeParse(body);

    if (!parsed.success) {
      await recordSystemEvent({
        level: "warning",
        source: "shipping",
        eventCode: "SHIPPING_INVALID_REQUEST",
        message: parsed.error.issues[0]?.message ?? "Payload inválido para cálculo de frete.",
        payload: {
          zipcode: body?.zipcode,
          subtotal: body?.subtotal,
          itemsCount: body?.itemsCount,
        },
      });

      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos para cálculo de frete." },
        { status: 400 },
      );
    }

    const options = await listShippingOptions(parsed.data);
    const quote = await calculateShippingQuote(parsed.data);
    return NextResponse.json({ quote, options });
  } catch (error) {
    await recordSystemEvent({
      level: "error",
      source: "shipping",
      eventCode: "SHIPPING_CALCULATION_FAILED",
      message: error instanceof Error ? error.message : "Falha ao calcular frete.",
    });

    return NextResponse.json({ error: "Não foi possível calcular o frete agora." }, { status: 500 });
  }
}