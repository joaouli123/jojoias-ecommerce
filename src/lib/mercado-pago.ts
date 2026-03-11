import { prisma } from "@/lib/prisma";
import { getIntegrationSettings } from "@/lib/integrations";
import { getSiteUrl } from "@/lib/site-url";

type MercadoPagoPreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: "BRL";
};

type MercadoPagoPreferenceResponse = {
  init_point?: string;
  sandbox_init_point?: string;
  id?: string;
};

type MercadoPagoPaymentResponse = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  payment_method_id?: string;
  transaction_amount?: number;
  transaction_amount_refunded?: number;
  date_of_expiration?: string;
  date_approved?: string;
  transaction_details?: {
    external_resource_url?: string;
  };
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  barcode?: {
    content?: string;
  };
};

type MercadoPagoCardTokenResponse = {
  id?: string;
  payment_method_id?: string;
  issuer_id?: string | number;
};

type MercadoPagoRefundResponse = {
  id?: number | string;
  amount?: number;
};

type PersistedOrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

function normalizePaymentStatus(payload: MercadoPagoPaymentResponse) {
  return payload.status || payload.status_detail || "pending";
}

function mapOrderStatusFromPayment(paymentStatus: string, currentStatus: PersistedOrderStatus): PersistedOrderStatus {
  if (paymentStatus === "approved") {
    return "PROCESSING";
  }

  if (["rejected", "cancelled", "refunded", "charged_back"].includes(paymentStatus)) {
    return "CANCELLED";
  }

  if (paymentStatus === "partially_refunded") {
    return currentStatus;
  }

  return "PENDING";
}

function resolveApiBase(endpointUrl: string | null) {
  return (endpointUrl || "https://api.mercadopago.com").replace(/\/$/, "");
}

function splitCustomerName(name: string | null | undefined) {
  const normalized = (name || "Cliente").trim();
  const [firstName, ...rest] = normalized.split(/\s+/);

  return {
    firstName: firstName || "Cliente",
    lastName: rest.join(" ") || "",
  };
}

export type TransparentPaymentMethod = "PIX" | "CARD" | "BOLETO";

export type MercadoPagoTransparentPaymentInput = {
  orderId: string;
  paymentMethod: TransparentPaymentMethod;
  payer: {
    name: string;
    email: string;
    document: string;
    zipcode?: string | null;
    street?: string | null;
    number?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
  };
  card?: {
    number: string;
    expiry: string;
    cvv: string;
    holderName: string;
    installments: number;
  };
};

export type MercadoPagoPaymentDetails = {
  paymentId: string | null;
  paymentMethodId: string | null;
  status: string;
  statusDetail: string | null;
  amount: number | null;
  expirationDate: string | null;
  approvedAt: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  barcodeContent: string | null;
};

async function createMercadoPagoCardToken(
  apiBase: string,
  publicKey: string,
  card: NonNullable<MercadoPagoTransparentPaymentInput["card"]>,
  payer: MercadoPagoTransparentPaymentInput["payer"],
) {
  const [expirationMonth, expirationYear] = card.expiry.split("/");

  const response = await fetch(`${apiBase}/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      card_number: card.number.replace(/\s+/g, ""),
      security_code: card.cvv,
      expiration_month: expirationMonth,
      expiration_year: expirationYear?.length === 2 ? `20${expirationYear}` : expirationYear,
      cardholder: {
        name: card.holderName,
        identification: {
          type: "CPF",
          number: payer.document.replace(/\D/g, ""),
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Não foi possível tokenizar o cartão: ${text}`);
  }

  const payload = (await response.json()) as MercadoPagoCardTokenResponse;

  if (!payload.id) {
    throw new Error("O Mercado Pago não retornou o token do cartão.");
  }

  return payload;
}

function buildPaymentDetails(payload: MercadoPagoPaymentResponse): MercadoPagoPaymentDetails {
  return {
    paymentId: payload.id ? String(payload.id) : null,
    paymentMethodId: payload.payment_method_id ?? null,
    status: payload.status || "pending",
    statusDetail: payload.status_detail ?? null,
    amount: typeof payload.transaction_amount === "number" ? payload.transaction_amount : null,
    expirationDate: payload.date_of_expiration ?? null,
    approvedAt: payload.date_approved ?? null,
    qrCode: payload.point_of_interaction?.transaction_data?.qr_code ?? null,
    qrCodeBase64: payload.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
    ticketUrl: payload.point_of_interaction?.transaction_data?.ticket_url ?? payload.transaction_details?.external_resource_url ?? null,
    barcodeContent: payload.barcode?.content ?? null,
  };
}

export async function getMercadoPagoPaymentDetails(paymentId: string): Promise<MercadoPagoPaymentDetails> {
  const integration = await getIntegrationSettings("mercado_pago");

  if (!integration?.isEnabled || !integration.secretKey) {
    throw new Error("Mercado Pago não configurado.");
  }

  const apiBase = resolveApiBase(integration.endpointUrl);
  const response = await fetch(`${apiBase}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${integration.secretKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao consultar detalhes do pagamento: ${text}`);
  }

  return buildPaymentDetails((await response.json()) as MercadoPagoPaymentResponse);
}

export async function createMercadoPagoTransparentPayment(input: MercadoPagoTransparentPaymentInput) {
  const integration = await getIntegrationSettings("mercado_pago");

  if (!integration?.isEnabled || !integration.secretKey) {
    return null;
  }

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Pedido não encontrado para iniciar o pagamento.");
  }

  const siteUrl = getSiteUrl();
  const apiBase = resolveApiBase(integration.endpointUrl);
  const { firstName, lastName } = splitCustomerName(input.payer.name);
  const cleanDocument = input.payer.document.replace(/\D/g, "");
  const statementDescriptor = typeof integration.extraConfig.statementDescriptor === "string" ? integration.extraConfig.statementDescriptor : undefined;

  let token: string | undefined;
  let paymentMethodId: string;
  let issuerId: string | number | undefined;

  if (input.paymentMethod === "CARD") {
    if (!integration.publicKey) {
      throw new Error("A chave pública do Mercado Pago não está configurada para pagamentos com cartão.");
    }

    if (!input.card) {
      throw new Error("Dados do cartão não informados.");
    }

    const cardToken = await createMercadoPagoCardToken(apiBase, integration.publicKey, input.card, input.payer);
    token = cardToken.id;
    paymentMethodId = cardToken.payment_method_id || "visa";
    issuerId = cardToken.issuer_id;
  } else if (input.paymentMethod === "PIX") {
    paymentMethodId = "pix";
  } else {
    paymentMethodId = typeof integration.extraConfig.boletoPaymentMethodId === "string"
      ? integration.extraConfig.boletoPaymentMethodId
      : "bolbradesco";
  }

  const response = await fetch(`${apiBase}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${integration.secretKey}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": order.checkoutToken || crypto.randomUUID(),
    },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      transaction_amount: Number(order.total.toFixed(2)),
      description: `Pedido Luxijóias #${order.id.slice(-8).toUpperCase()}`,
      payment_method_id: paymentMethodId,
      ...(token ? { token } : {}),
      ...(issuerId ? { issuer_id: issuerId } : {}),
      ...(input.paymentMethod === "CARD" && input.card ? { installments: Math.max(1, input.card.installments) } : {}),
      payer: {
        email: input.payer.email,
        first_name: firstName,
        last_name: lastName,
        entity_type: "individual",
        identification: {
          type: "CPF",
          number: cleanDocument,
        },
        address: input.payer.zipcode ? {
          zip_code: input.payer.zipcode.replace(/\D/g, ""),
          street_name: input.payer.street || undefined,
          street_number: input.payer.number || undefined,
          neighborhood: input.payer.district || undefined,
          city: input.payer.city || undefined,
          federal_unit: input.payer.state || undefined,
        } : undefined,
      },
      date_of_expiration: order.paymentExpiresAt?.toISOString() ?? undefined,
      notification_url: `${siteUrl}/api/webhooks/mercado-pago?source_news=webhooks`,
      external_reference: order.id,
      statement_descriptor: statementDescriptor,
      metadata: {
        orderId: order.id,
        checkoutToken: order.checkoutToken,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao criar pagamento transparente no Mercado Pago: ${text}`);
  }

  const payload = (await response.json()) as MercadoPagoPaymentResponse;
  const details = buildPaymentDetails(payload);

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentId: details.paymentId,
      paymentStatus: details.status,
      paymentMethod: input.paymentMethod,
    },
  });

  return details;
}

export async function createMercadoPagoCheckout(orderId: string) {
  const integration = await getIntegrationSettings("mercado_pago");

  if (!integration?.isEnabled || !integration.secretKey) {
    return null;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true,
    },
  });

  if (!order) {
    throw new Error("Pedido não encontrado para iniciar pagamento.");
  }

  const siteUrl = getSiteUrl();
  const statusBase = `${siteUrl}/order/success/${order.id}?token=${encodeURIComponent(order.checkoutToken || "")}`;
  const apiBase = resolveApiBase(integration.endpointUrl);

  const items: MercadoPagoPreferenceItem[] = order.items.map((item) => ({
    title: item.product.name,
    quantity: item.quantity,
    unit_price: Number(item.price.toFixed(2)),
    currency_id: "BRL",
  }));

  if (order.shipping > 0) {
    items.push({
      title: "Frete",
      quantity: 1,
      unit_price: Number(order.shipping.toFixed(2)),
      currency_id: "BRL",
    });
  }

  if (order.discount > 0) {
    items.push({
      title: "Desconto promocional",
      quantity: 1,
      unit_price: Number((-order.discount).toFixed(2)),
      currency_id: "BRL",
    });
  }

  const extraConfig = integration.extraConfig;
  const statementDescriptor = typeof extraConfig.statementDescriptor === "string" ? extraConfig.statementDescriptor : undefined;

  const response = await fetch(`${apiBase}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${integration.secretKey}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": order.checkoutToken || crypto.randomUUID(),
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      items,
      payer: {
        name: order.user?.name || order.guestName || "Cliente",
        email: order.user?.email || order.guestEmail || undefined,
      },
      external_reference: order.id,
      notification_url: `${siteUrl}/api/webhooks/mercado-pago?source_news=webhooks`,
      back_urls: {
        success: `${statusBase}&payment=success`,
        pending: `${statusBase}&payment=pending`,
        failure: `${statusBase}&payment=failure`,
      },
      auto_return: "approved",
      statement_descriptor: statementDescriptor,
      metadata: {
        orderId: order.id,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao criar checkout do Mercado Pago: ${text}`);
  }

  const payload = (await response.json()) as MercadoPagoPreferenceResponse;
  const checkoutUrl = payload.init_point || payload.sandbox_init_point;

  if (!checkoutUrl) {
    throw new Error("Mercado Pago não retornou URL de checkout.");
  }

  return {
    checkoutUrl,
    preferenceId: payload.id ?? null,
  };
}

export async function syncMercadoPagoPayment(paymentId: string) {
  const integration = await getIntegrationSettings("mercado_pago");

  if (!integration?.isEnabled || !integration.secretKey) {
    throw new Error("Mercado Pago não configurado.");
  }

  const apiBase = resolveApiBase(integration.endpointUrl);
  const response = await fetch(`${apiBase}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${integration.secretKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao consultar pagamento no Mercado Pago: ${text}`);
  }

  const payload = (await response.json()) as MercadoPagoPaymentResponse;

  const orderId = payload.external_reference;

  if (!orderId) {
    throw new Error("Pagamento sem external_reference.");
  }

  const normalizedPaymentStatus = normalizePaymentStatus(payload);
  const previousOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      paymentId: true,
      paymentStatus: true,
      status: true,
      refundAmount: true,
      refundedAt: true,
      refundRequestedAt: true,
    },
  });

  if (!previousOrder) {
    throw new Error("Pedido não encontrado para sincronizar pagamento.");
  }

  const mappedOrderStatus = mapOrderStatusFromPayment(normalizedPaymentStatus, previousOrder.status as PersistedOrderStatus);
  const refundedAmount = typeof payload.transaction_amount_refunded === "number"
    ? Number(payload.transaction_amount_refunded.toFixed(2))
    : previousOrder.refundAmount;
  const hasRefund = refundedAmount != null && refundedAmount > 0;
  const nextRefundStatus = hasRefund ? "REFUNDED" : normalizedPaymentStatus === "charged_back" ? "DENIED" : previousOrder.paymentStatus === normalizedPaymentStatus ? undefined : previousOrder.paymentStatus;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentId,
      paymentStatus: normalizedPaymentStatus,
      paymentMethod: payload.payment_method_id || undefined,
      ...(hasRefund
        ? {
            refundStatus: "REFUNDED",
            refundAmount: refundedAmount,
            refundRequestedAt: previousOrder.refundRequestedAt ?? new Date(),
            refundedAt: previousOrder.refundedAt ?? new Date(),
          }
        : nextRefundStatus === "DENIED"
          ? {
              refundStatus: "DENIED",
            }
          : {}),
      ...(mappedOrderStatus === "PROCESSING" || mappedOrderStatus === "CANCELLED" || previousOrder?.status !== mappedOrderStatus
        ? { status: mappedOrderStatus }
        : {}),
    },
  });

  return {
    orderId,
    paymentStatus: normalizedPaymentStatus,
    statusChanged: previousOrder?.paymentStatus !== normalizedPaymentStatus,
    paymentIdChanged: previousOrder?.paymentId !== paymentId,
  };
}

export async function issueMercadoPagoRefund(orderId: string, amount?: number | null) {
  const integration = await getIntegrationSettings("mercado_pago");

  if (!integration?.isEnabled || !integration.secretKey) {
    throw new Error("Mercado Pago não configurado.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      total: true,
      paymentId: true,
      paymentStatus: true,
      refundStatus: true,
      refundAmount: true,
      refundRequestedAt: true,
    },
  });

  if (!order) {
    throw new Error("Pedido não encontrado.");
  }

  if (!order.paymentId) {
    throw new Error("Este pedido ainda não possui Payment ID vinculado.");
  }

  const normalizedPaymentStatus = order.paymentStatus?.toLowerCase() || "pending";
  if (!["approved", "partially_refunded"].includes(normalizedPaymentStatus)) {
    throw new Error("O pagamento precisa estar aprovado para permitir reembolso.");
  }

  if (!["REQUESTED", "APPROVED", "REFUNDED"].includes(order.refundStatus || "REQUESTED")) {
    throw new Error("Atualize o pós-venda para solicitado ou aprovado antes de executar o reembolso.");
  }

  const roundedAmount = amount == null ? null : Number(amount.toFixed(2));
  if (roundedAmount !== null && (!Number.isFinite(roundedAmount) || roundedAmount <= 0)) {
    throw new Error("Valor de reembolso inválido.");
  }

  const remainingRefundable = Number((order.total - (order.refundAmount ?? 0)).toFixed(2));
  if (remainingRefundable <= 0) {
    throw new Error("Este pedido já foi reembolsado integralmente.");
  }

  if (roundedAmount !== null && roundedAmount > remainingRefundable) {
    throw new Error("O valor solicitado excede o saldo reembolsável do pedido.");
  }

  const apiBase = resolveApiBase(integration.endpointUrl);
  const response = await fetch(`${apiBase}/v1/payments/${order.paymentId}/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${integration.secretKey}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(roundedAmount && roundedAmount < remainingRefundable ? { amount: roundedAmount } : {}),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao solicitar reembolso no Mercado Pago: ${text}`);
  }

  const refundPayload = (await response.json()) as MercadoPagoRefundResponse;
  const syncResult = await syncMercadoPagoPayment(order.paymentId);

  await prisma.order.update({
    where: { id: order.id },
    data: {
      refundStatus: "REFUNDED",
      refundRequestedAt: order.refundRequestedAt ?? new Date(),
      refundedAt: new Date(),
      ...(refundPayload.amount != null ? { refundAmount: Number(refundPayload.amount.toFixed(2)) } : {}),
    },
  });

  return {
    ...syncResult,
    refundId: refundPayload.id ? String(refundPayload.id) : null,
    refundAmount: refundPayload.amount ?? roundedAmount ?? remainingRefundable,
  };
}