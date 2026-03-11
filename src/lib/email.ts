import { prisma } from "@/lib/prisma";
import { getIntegrationSettings } from "@/lib/integrations";
import { formatCurrency } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site-url";
import { recordSystemEvent } from "@/lib/system-events";
import { STORE_NAME } from "@/lib/constants";
import { formatOrderCode, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/admin-display";

type OrderEmailPayload = {
  orderId: string;
  checkoutToken?: string | null;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  orderStatus?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  refundStatus?: string | null;
  refundAmount?: number | null;
  returnReason?: string | null;
};

type AccountEmailPayload = {
  customerName: string;
  customerEmail: string;
};

type EmailSummaryItem = {
  label: string;
  value: string;
};

function buildOrderLink(orderId: string, checkoutToken?: string | null) {
  const tokenQuery = checkoutToken ? `?token=${encodeURIComponent(checkoutToken)}` : "";
  return `${getSiteUrl()}/order/success/${orderId}${tokenQuery}`;
}

function buildResetPasswordLink(token: string) {
  return `${getSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getOrderCode(orderId: string) {
  return formatOrderCode(orderId);
}

function getPaymentLabel(status?: string | null) {
  if (!status) {
    return "Pedido recebido";
  }

  const label = getPaymentStatusLabel(status);
  if (status.toLowerCase() === "approved") {
    return "Pagamento aprovado";
  }

  return `Pagamento ${label.toLowerCase()}`;
}

function getRefundStatusLabel(status?: string | null) {
  switch (status) {
    case "REQUESTED":
      return "Solicitação recebida";
    case "APPROVED":
      return "Solicitação aprovada";
    case "REFUNDED":
      return "Reembolso concluído";
    case "DENIED":
      return "Solicitação não aprovada";
    default:
      return "Atualização de pós-venda";
  }
}

function renderSummary(items: EmailSummaryItem[]) {
  if (!items.length) return "";

  const rows = items
    .map((item) => `
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;vertical-align:top;">${escapeHtml(item.label)}</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;vertical-align:top;">${escapeHtml(item.value)}</td>
      </tr>
    `)
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;border-collapse:collapse;">
      ${rows}
    </table>
  `;
}

function renderParagraphs(paragraphs: string[]) {
  return paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">${escapeHtml(paragraph)}</p>`)
    .join("");
}

function renderEmailTemplate({
  eyebrow,
  title,
  paragraphs,
  summary = [],
  ctaLabel,
  ctaUrl,
  footer,
}: {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  summary?: EmailSummaryItem[];
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}) {
  return `
    <div style="margin:0;padding:32px 16px;background:#f5f1eb;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:1px solid #eadfce;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 28px;background:linear-gradient(135deg,#171717 0%,#3f3222 100%);">
            <p style="margin:0 0 10px;color:#d6c1a0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
            <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.25;">${escapeHtml(title)}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${renderParagraphs(paragraphs)}
            ${renderSummary(summary)}
            ${ctaLabel && ctaUrl ? `
              <p style="margin:28px 0 0;">
                <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#171717;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">${escapeHtml(ctaLabel)}</a>
              </p>
            ` : ""}
            <p style="margin:28px 0 0;color:#6b7280;font-size:13px;line-height:1.7;">${escapeHtml(footer || `Esta é uma mensagem automática da ${STORE_NAME}.`)}</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function buildOrderSummary(payload: OrderEmailPayload) {
  const items: EmailSummaryItem[] = [
    { label: "Pedido", value: getOrderCode(payload.orderId) },
    { label: "Total", value: formatCurrency(payload.total) },
  ];

  if (payload.paymentMethod) {
    items.push({ label: "Pagamento", value: payload.paymentMethod });
  }

  if (payload.paymentStatus) {
    items.push({ label: "Status do pagamento", value: getPaymentStatusLabel(payload.paymentStatus) });
  }

  if (payload.orderStatus) {
    items.push({ label: "Status do pedido", value: getOrderStatusLabel(payload.orderStatus) });
  }

  if (payload.trackingCode) {
    items.push({ label: "Rastreio", value: payload.trackingCode });
  }

  if (payload.refundStatus) {
    items.push({ label: "Pós-venda", value: getRefundStatusLabel(payload.refundStatus) });
  }

  if (typeof payload.refundAmount === "number") {
    items.push({ label: "Valor", value: formatCurrency(payload.refundAmount) });
  }

  return items;
}

function getStatusEmailCopy(status?: string | null) {
  switch (status) {
    case "PROCESSING":
      return {
        title: "Seu pedido está em preparação",
        paragraphs: [
          "Recebemos a confirmação interna do seu pedido e nossa equipe iniciou a separação dos itens.",
          "Assim que houver avanço no envio, você receberá um novo aviso com os próximos detalhes.",
        ],
      };
    case "SHIPPED":
      return {
        title: "Seu pedido foi enviado",
        paragraphs: [
          "Seu pedido já está em trânsito para o endereço informado no checkout.",
          "Se o código de rastreio já estiver disponível, ele aparece no resumo abaixo.",
        ],
      };
    case "DELIVERED":
      return {
        title: "Seu pedido foi entregue",
        paragraphs: [
          "O pedido foi marcado como entregue pela transportadora ou método logístico utilizado.",
          "Se precisar de suporte após a entrega, responda este e-mail ou fale com nossa equipe pelos canais da loja.",
        ],
      };
    case "CANCELLED":
      return {
        title: "Seu pedido foi cancelado",
        paragraphs: [
          "O pedido foi cancelado em nosso sistema.",
          "Se houver pagamento aprovado, a atualização financeira correspondente será tratada conforme o método de pagamento utilizado.",
        ],
      };
    default:
      return {
        title: "Atualização do seu pedido",
        paragraphs: [
          "Houve uma atualização importante no seu pedido.",
        ],
      };
  }
}

function getRefundEmailCopy(status?: string | null) {
  switch (status) {
    case "REQUESTED":
      return {
        title: "Recebemos sua solicitação de pós-venda",
        paragraphs: [
          "Sua solicitação foi registrada e será analisada pela nossa equipe.",
          "Assim que houver uma decisão, você receberá uma nova atualização por e-mail.",
        ],
      };
    case "APPROVED":
      return {
        title: "Sua solicitação foi aprovada",
        paragraphs: [
          "A análise do pós-venda foi concluída e sua solicitação foi aprovada.",
          "Se houver reembolso, o andamento financeiro aparecerá nas próximas atualizações.",
        ],
      };
    case "REFUNDED":
      return {
        title: "Seu reembolso foi concluído",
        paragraphs: [
          "O reembolso vinculado ao seu pedido foi processado com sucesso.",
          "O prazo de visualização do crédito pode variar conforme o método de pagamento e a instituição financeira.",
        ],
      };
    case "DENIED":
      return {
        title: "Sua solicitação não foi aprovada",
        paragraphs: [
          "Concluímos a análise do pós-venda e, neste momento, a solicitação não pôde ser aprovada.",
          "Se precisar de mais detalhes, nossa equipe de atendimento pode orientar os próximos passos.",
        ],
      };
    default:
      return {
        title: "Atualização de pós-venda",
        paragraphs: ["Houve uma atualização no atendimento pós-venda do seu pedido."],
      };
  }
}

function getCustomerIdentity(order: {
  user?: { name: string; email: string } | null;
  guestName?: string | null;
  guestEmail?: string | null;
}) {
  const customerEmail = order.user?.email || order.guestEmail;
  const customerName = order.user?.name || order.guestName || "Cliente";

  if (!customerEmail) {
    return null;
  }

  return { customerName, customerEmail };
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
  const from = configuredFrom || "Luxijóias <onboarding@resend.dev>";
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
  const orderCode = getOrderCode(payload.orderId);
  const subject = `Recebemos seu pedido ${orderCode}`;
  const html = renderEmailTemplate({
    eyebrow: STORE_NAME,
    title: `Olá, ${payload.customerName}`,
    paragraphs: [
      "Seu pedido foi registrado com sucesso e já está em nosso sistema.",
      "Você pode acompanhar o andamento da compra pelo link abaixo sempre que precisar.",
    ],
    summary: buildOrderSummary(payload),
    ctaLabel: "Acompanhar pedido",
    ctaUrl: orderLink,
  });

  try {
    await sendEmail({ to: payload.customerEmail, subject, html });
  } catch (error) {
    console.error("Erro ao enviar e-mail de pedido recebido:", error);
  }
}

export async function sendOrderPaymentUpdateEmail(payload: OrderEmailPayload) {
  const orderLink = buildOrderLink(payload.orderId, payload.checkoutToken);
  const orderCode = getOrderCode(payload.orderId);
  const subject = `Pagamento do pedido ${orderCode} atualizado`;
  const html = renderEmailTemplate({
    eyebrow: "Pagamento",
    title: `Olá, ${payload.customerName}`,
    paragraphs: [
      `Temos uma atualização financeira sobre o pedido ${orderCode}.`,
      getPaymentLabel(payload.paymentStatus),
    ],
    summary: buildOrderSummary(payload),
    ctaLabel: "Ver pedido",
    ctaUrl: orderLink,
  });

  try {
    await sendEmail({ to: payload.customerEmail, subject, html });
  } catch (error) {
    console.error("Erro ao enviar e-mail de atualização de pagamento:", error);
  }
}

export async function sendOrderStatusUpdateEmail(payload: OrderEmailPayload) {
  const orderLink = buildOrderLink(payload.orderId, payload.checkoutToken);
  const orderCode = getOrderCode(payload.orderId);
  const copy = getStatusEmailCopy(payload.orderStatus);
  const html = renderEmailTemplate({
    eyebrow: "Pedido",
    title: `${payload.customerName}, ${copy.title.toLowerCase()}`,
    paragraphs: copy.paragraphs,
    summary: buildOrderSummary(payload),
    ctaLabel: payload.trackingUrl ? "Abrir rastreio" : "Ver pedido",
    ctaUrl: payload.trackingUrl || orderLink,
  });

  try {
    await sendEmail({
      to: payload.customerEmail,
      subject: `${copy.title} ${orderCode}`,
      html,
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de status do pedido:", error);
  }
}

export async function sendOrderTrackingUpdateEmail(payload: OrderEmailPayload) {
  const orderLink = buildOrderLink(payload.orderId, payload.checkoutToken);
  const orderCode = getOrderCode(payload.orderId);
  const html = renderEmailTemplate({
    eyebrow: "Rastreamento",
    title: `Atualizamos o rastreio do pedido ${orderCode}`,
    paragraphs: [
      "Os dados de acompanhamento do envio foram atualizados.",
      "Use o link abaixo para consultar a transportadora ou acompanhe o pedido completo na loja.",
    ],
    summary: buildOrderSummary(payload),
    ctaLabel: payload.trackingUrl ? "Consultar rastreio" : "Ver pedido",
    ctaUrl: payload.trackingUrl || orderLink,
  });

  try {
    await sendEmail({
      to: payload.customerEmail,
      subject: `Rastreamento do pedido ${orderCode} atualizado`,
      html,
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de rastreamento:", error);
  }
}

export async function sendOrderRefundUpdateEmail(payload: OrderEmailPayload) {
  const orderLink = buildOrderLink(payload.orderId, payload.checkoutToken);
  const orderCode = getOrderCode(payload.orderId);
  const copy = getRefundEmailCopy(payload.refundStatus);
  const extraParagraphs = payload.returnReason
    ? [...copy.paragraphs, `Motivo registrado: ${payload.returnReason}`]
    : copy.paragraphs;
  const html = renderEmailTemplate({
    eyebrow: "Pós-venda",
    title: copy.title,
    paragraphs: extraParagraphs,
    summary: buildOrderSummary(payload),
    ctaLabel: "Ver pedido",
    ctaUrl: orderLink,
  });

  try {
    await sendEmail({
      to: payload.customerEmail,
      subject: `${getRefundStatusLabel(payload.refundStatus)} do pedido ${orderCode}`,
      html,
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de pós-venda:", error);
  }
}

export async function sendPasswordResetEmail({ customerEmail, customerName, token }: AccountEmailPayload & { token: string }) {
  const link = buildResetPasswordLink(token);
  const html = renderEmailTemplate({
    eyebrow: "Conta",
    title: `Olá, ${customerName}`,
    paragraphs: [
      "Recebemos uma solicitação para redefinir a senha da sua conta.",
      "Se o pedido partiu de você, use o botão abaixo para cadastrar uma nova senha. Caso contrário, ignore esta mensagem.",
    ],
    ctaLabel: "Redefinir senha",
    ctaUrl: link,
    footer: `Por segurança, este link expira automaticamente. Mensagem enviada por ${STORE_NAME}.`,
  });

  try {
    await sendEmail({
      to: customerEmail,
      subject: `Recuperação de senha - ${STORE_NAME}`,
      html,
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de recuperação:", error);
  }
}

export async function sendWelcomeEmail(payload: AccountEmailPayload) {
  const html = renderEmailTemplate({
    eyebrow: STORE_NAME,
    title: `Bem-vindo, ${payload.customerName}`,
    paragraphs: [
      "Sua conta foi criada com sucesso e já está pronta para uso.",
      "Quando quiser, acesse a loja para acompanhar pedidos, salvar favoritos e finalizar compras com mais agilidade.",
    ],
    ctaLabel: "Acessar minha conta",
    ctaUrl: `${getSiteUrl()}/account`,
  });

  try {
    await sendEmail({
      to: payload.customerEmail,
      subject: `Sua conta na ${STORE_NAME} foi criada`,
      html,
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de boas-vindas:", error);
  }
}

export async function sendOrderPaymentUpdateFromOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) return;

  const customer = getCustomerIdentity(order);

  if (!customer) return;

  await sendOrderPaymentUpdateEmail({
    orderId: order.id,
    checkoutToken: order.checkoutToken,
    customerName: customer.customerName,
    customerEmail: customer.customerEmail,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    refundStatus: order.refundStatus,
    refundAmount: order.refundAmount,
  });
}

export async function sendOrderStatusUpdateFromOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) return;

  const customer = getCustomerIdentity(order);

  if (!customer) return;

  await sendOrderStatusUpdateEmail({
    orderId: order.id,
    checkoutToken: order.checkoutToken,
    customerName: customer.customerName,
    customerEmail: customer.customerEmail,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    trackingCode: order.trackingCode,
    trackingUrl: order.trackingUrl,
  });
}

export async function sendOrderTrackingUpdateFromOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) return;

  const customer = getCustomerIdentity(order);

  if (!customer) return;

  await sendOrderTrackingUpdateEmail({
    orderId: order.id,
    checkoutToken: order.checkoutToken,
    customerName: customer.customerName,
    customerEmail: customer.customerEmail,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    trackingCode: order.trackingCode,
    trackingUrl: order.trackingUrl,
  });
}

export async function sendOrderRefundUpdateFromOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) return;

  const customer = getCustomerIdentity(order);

  if (!customer) return;

  await sendOrderRefundUpdateEmail({
    orderId: order.id,
    checkoutToken: order.checkoutToken,
    customerName: customer.customerName,
    customerEmail: customer.customerEmail,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    refundStatus: order.refundStatus,
    refundAmount: order.refundAmount,
    returnReason: order.returnReason,
  });
}