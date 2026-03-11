import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getIntegrationSettings } from "@/lib/integrations";
import { syncMercadoPagoPayment } from "@/lib/mercado-pago";
import { sendOrderPaymentUpdateFromOrder, sendOrderRefundUpdateFromOrder } from "@/lib/email";
import { recordSystemEvent } from "@/lib/system-events";

function parseSignatureHeader(signatureHeader: string | null) {
  if (!signatureHeader) return null;

  const parts = signatureHeader.split(",");
  let ts = "";
  let v1 = "";

  for (const part of parts) {
    const [key, value] = part.split("=", 2).map((item) => item.trim());
    if (key === "ts") ts = value || "";
    if (key === "v1") v1 = value || "";
  }

  if (!ts || !v1) return null;

  return { ts, v1 };
}

function verifyMercadoPagoSignature(request: Request, secret: string) {
  const url = new URL(request.url);
  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id") || "";
  const signature = parseSignatureHeader(signatureHeader);
  const dataId = (url.searchParams.get("data.id") || url.searchParams.get("id") || "").toLowerCase();

  if (!signature || !requestId || !dataId) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${signature.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signature.v1, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const integration = await getIntegrationSettings("mercado_pago");

    if (integration?.webhookSecret) {
      const isValidSignature = verifyMercadoPagoSignature(request, integration.webhookSecret);
      if (!isValidSignature) {
        await recordSystemEvent({
          level: "warning",
          source: "mercado_pago_webhook",
          eventCode: "WEBHOOK_UNAUTHORIZED",
          message: "Tentativa de webhook com assinatura inválida.",
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
      const normalizedStatus = result.paymentStatus.toLowerCase();

      if (["refunded", "partially_refunded", "charged_back"].includes(normalizedStatus)) {
        await sendOrderRefundUpdateFromOrder(result.orderId);
      } else {
        await sendOrderPaymentUpdateFromOrder(result.orderId);
      }
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