import { NextResponse } from "next/server";
import { getIntegrationSettings } from "@/lib/integrations";
import { syncMercadoPagoPayment } from "@/lib/mercado-pago";
import { sendOrderPaymentUpdateFromOrder } from "@/lib/email";
import { recordSystemEvent } from "@/lib/system-events";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const integration = await getIntegrationSettings("mercado_pago");

    if (integration?.webhookSecret) {
      const secret = url.searchParams.get("secret");
      if (secret !== integration.webhookSecret) {
        await recordSystemEvent({
          level: "warning",
          source: "mercado_pago_webhook",
          eventCode: "WEBHOOK_UNAUTHORIZED",
          message: "Tentativa de webhook com segredo inválido.",
          payload: {
            topic: url.searchParams.get("type") || url.searchParams.get("topic"),
            id: url.searchParams.get("id") || url.searchParams.get("data.id"),
          },
        });

        return NextResponse.json({ error: "Webhook não autorizado." }, { status: 401 });
      }
    }

    const body = (await request.json().catch(() => ({}))) as {
      type?: string;
      data?: { id?: string | number };
      action?: string;
    };

    const topic = body.type || url.searchParams.get("type") || url.searchParams.get("topic");
    const dataId = body.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id");

    if (!dataId || topic !== "payment") {
      return NextResponse.json({ received: true, ignored: true });
    }

    const result = await syncMercadoPagoPayment(String(dataId));

    if (result.statusChanged) {
      await sendOrderPaymentUpdateFromOrder(result.orderId);
    }

    return NextResponse.json({
      received: true,
      orderId: result.orderId,
      paymentStatus: result.paymentStatus,
      statusChanged: result.statusChanged,
    });
  } catch (error) {
    console.error("Erro no webhook do Mercado Pago:", error);
    await recordSystemEvent({
      level: "error",
      source: "mercado_pago_webhook",
      eventCode: "WEBHOOK_PROCESSING_FAILED",
      message: error instanceof Error ? error.message : "Falha ao processar webhook do Mercado Pago.",
    });
    return NextResponse.json({ error: "Falha ao processar webhook." }, { status: 500 });
  }
}