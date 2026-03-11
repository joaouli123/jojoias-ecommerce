import { prisma } from "@/lib/prisma";
import { getIntegrationSettings } from "@/lib/integrations";
import { formatCurrency } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site-url";
import { recordSystemEvent } from "@/lib/system-events";

type OrderEmailPayload = {
  orderId: string;
  checkoutToken?: string | null;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
};

function buildOrderLink(orderId: string, checkoutToken?: string | null) {
  const tokenQuery = checkoutToken ? `?token=${encodeURIComponent(checkoutToken)}` : "";
  return `${getSiteUrl()}/order/success/${orderId}${tokenQuery}`;
}

function getPaymentLabel(status?: string | null) {
  switch (status?.toLowerCase()) {
    case "approved":
      return "Pagamento aprovado";
    case "partially_refunded":
      return "Pagamento parcialmente reembolsado";
    case "pending":
    case "in_process":
    case "in_mediation":
      return "Pagamento pendente";
    case "refunded":
      return "Pagamento reembolsado";
    case "rejected":
    case "cancelled":
    case "charged_back":
      return "Pagamento não aprovado";
    default:
      return "Pedido recebido";
  }
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = await getIntegrationSettings("resend");

  if (!resend?.isEnabled || !resend.secretKey) {
    return { sent: false, reason: "Resend desativado" };
  }

  const endpoint = (resend.endpointUrl || "https://api.resend.com").replace(/\/$/, "");
  const configuredFrom = typeof resend.extraConfig.fromEmail === "string" && resend.extraConfig.fromEmail
    ? resend.extraConfig.fromEmail
    : "";
  const from = configuredFrom || "JoJoias <onboarding@resend.dev>";
  const replyTo = typeof resend.extraConfig.replyTo === "string" ? resend.extraConfig.replyTo : undefined;

  if (process.env.NODE_ENV === "production" && (!configuredFrom || configuredFrom.includes("onboarding@resend.dev"))) {
    await recordSystemEvent({
      level: "error",
      source: "email",
      eventCode: "RESEND_FROM_EMAIL_INVALID",
      message: "Remetente do Resend nao configurado com dominio validado para producao.",
      payload: { to, subject },
    });
    throw new Error("Configure um remetente valido do Resend antes de enviar emails em producao.");
  }

  const response = await fetch(`${endpoint}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resend.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    await recordSystemEvent({
      level: "error",
      source: "email",
      eventCode: "EMAIL_SEND_FAILED",
      message: "Falha ao enviar e-mail transacional.",
      payload: { to, subject, response: text.slice(0, 500) },
    });
    throw new Error(`Falha ao enviar e-mail: ${text}`);
  }

  return { sent: true };
}

export async function sendOrderCreatedEmail(payload: OrderEmailPayload) {
  const orderLink = buildOrderLink(payload.orderId, payload.checkoutToken);
  const subject = `Recebemos seu pedido #${payload.orderId.slice(-8).toUpperCase()}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h1 style="margin-bottom:8px;">Olá, ${payload.customerName}!</h1>
      <p>Seu pedido foi registrado com sucesso na JoJoias.</p>
      <p><strong>Pedido:</strong> #${payload.orderId.slice(-8).toUpperCase()}<br />
      <strong>Total:</strong> ${formatCurrency(payload.total)}<br />
      <strong>Pagamento:</strong> ${payload.paymentMethod ?? "Não informado"}<br />
      <strong>Status:</strong> ${getPaymentLabel(payload.paymentStatus)}</p>
      <p>Você pode acompanhar o pedido neste link:</p>
      <p><a href="${orderLink}" style="display:inline-block;background:#111111;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">Acompanhar pedido</a></p>
    </div>
  `;

  try {
    await sendEmail({ to: payload.customerEmail, subject, html });
  } catch (error) {
    console.error("Erro ao enviar e-mail de pedido recebido:", error);
  }
}

export async function sendOrderPaymentUpdateEmail(payload: OrderEmailPayload) {
  const orderLink = buildOrderLink(payload.orderId, payload.checkoutToken);
  const subject = `Atualização do pagamento do pedido #${payload.orderId.slice(-8).toUpperCase()}`;
  const paymentLabel = getPaymentLabel(payload.paymentStatus);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h1 style="margin-bottom:8px;">Olá, ${payload.customerName}!</h1>
      <p>Temos uma atualização sobre o seu pedido.</p>
      <p><strong>Pedido:</strong> #${payload.orderId.slice(-8).toUpperCase()}<br />
      <strong>Status do pagamento:</strong> ${paymentLabel}<br />
      <strong>Total:</strong> ${formatCurrency(payload.total)}</p>
      <p>Confira os detalhes pelo link abaixo:</p>
      <p><a href="${orderLink}" style="display:inline-block;background:#111111;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">Ver pedido</a></p>
    </div>
  `;

  try {
    await sendEmail({ to: payload.customerEmail, subject, html });
  } catch (error) {
    console.error("Erro ao enviar e-mail de atualização de pagamento:", error);
  }
}

export async function sendOrderPaymentUpdateFromOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) return;

  const customerEmail = order.user?.email || order.guestEmail;
  const customerName = order.user?.name || order.guestName || "Cliente";

  if (!customerEmail) return;

  await sendOrderPaymentUpdateEmail({
    orderId: order.id,
    checkoutToken: order.checkoutToken,
    customerName,
    customerEmail,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  });
}