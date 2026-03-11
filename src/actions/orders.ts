"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clearCartAction, getCartAction } from "@/actions/cart";
import { checkoutSubmissionSchema } from "@/lib/validators";
import { DEFAULT_COUNTRY } from "@/lib/constants";
import { getShippingOptionById } from "@/lib/shipping";
import { normalizeCouponCode, validateCouponEntity } from "@/lib/coupons";
import { createMercadoPagoCheckout } from "@/lib/mercado-pago";
import { getIntegrationSettings } from "@/lib/integrations";
import { sendOrderCreatedEmail } from "@/lib/email";
import { recordSystemEvent } from "@/lib/system-events";

function formatCustomerPostSaleReason(previousReason: string | null, nextReason: string) {
  const customerEntry = `[Cliente ${new Date().toLocaleString("pt-BR")}] ${nextReason}`;
  return previousReason ? `${previousReason}\n\n${customerEntry}` : customerEntry;
}

function canCustomerRequestPostSale(order: {
  status: string;
  paymentStatus: string | null;
  refundStatus: string | null;
}) {
  const normalizedPaymentStatus = (order.paymentStatus || "").toLowerCase();

  if (!["SHIPPED", "DELIVERED"].includes(order.status)) {
    return false;
  }

  if (!["approved", "partially_refunded"].includes(normalizedPaymentStatus)) {
    return false;
  }

  return !["REQUESTED", "APPROVED", "REFUNDED"].includes(order.refundStatus || "");
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildOrderSuccessUrl(orderId: string, checkoutToken?: string | null) {
  const params = new URLSearchParams();

  if (checkoutToken) {
    params.set("token", checkoutToken);
  }

  const query = params.toString();
  return query ? `/order/success/${orderId}?${query}` : `/order/success/${orderId}`;
}

function resolvePixDiscountPercent(integration: Awaited<ReturnType<typeof getIntegrationSettings>>) {
  const raw = Number(integration?.extraConfig.pixDiscountPercent ?? 10);
  if (!Number.isFinite(raw) || raw < 0) return 10;
  return raw;
}

function resolvePaymentExpiry(paymentMethod: "PIX" | "CARD" | "BOLETO") {
  const now = new Date();

  if (paymentMethod === "PIX") {
    return new Date(now.getTime() + 30 * 60 * 1000);
  }

  if (paymentMethod === "BOLETO") {
    return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  }

  return null;
}

export async function createOrderAction(formData: FormData) {
  const parsed = checkoutSubmissionSchema.safeParse({
    checkoutToken: readField(formData, "checkoutToken"),
    name: readField(formData, "name"),
    email: readField(formData, "email"),
    document: readField(formData, "document"),
    phone: readField(formData, "phone"),
    zipcode: readField(formData, "zipcode"),
    street: readField(formData, "street"),
    number: readField(formData, "number"),
    district: readField(formData, "district"),
    city: readField(formData, "city"),
    state: readField(formData, "state").toUpperCase(),
    complement: readField(formData, "complement"),
    shippingOptionId: readField(formData, "shippingOptionId") || "standard",
    paymentMethod: readField(formData, "paymentMethod") || "PIX",
    couponCode: readField(formData, "couponCode") || readField(formData, "couponCodeMobile") || readField(formData, "couponCodeDesktop"),
    notes: readField(formData, "notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados inválidos para concluir o pedido.");
  }

  const {
    checkoutToken,
    name,
    email,
    document,
    phone,
    zipcode,
    street,
    number,
    district,
    city,
    state,
    complement,
    shippingOptionId,
    paymentMethod,
    couponCode,
    notes,
  } = parsed.data;

  const cart = await getCartAction();
  if (!cart.items.length) {
    throw new Error("Carrinho vazio.");
  }

  const itemsCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  const shippingQuote = await getShippingOptionById({
    zipcode,
    subtotal: cart.subtotal,
    itemsCount,
    optionId: shippingOptionId,
  });
  const normalizedCouponCode = couponCode ? normalizeCouponCode(couponCode) : undefined;

  const session = await auth();
  const mercadoPago = await getIntegrationSettings("mercado_pago");
  const pixDiscountPercent = resolvePixDiscountPercent(mercadoPago);

  const existingOrder = await prisma.order.findUnique({
    where: { checkoutToken },
    select: {
      id: true,
      checkoutToken: true,
    },
  });

  if (existingOrder) {
    redirect(buildOrderSuccessUrl(existingOrder.id, existingOrder.checkoutToken));
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: cart.items.map((item) => item.productId) },
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          quantity: true,
          brand: {
            select: {
              slug: true,
            },
          },
          category: {
            select: {
              slug: true,
            },
          },
          variants: {
            select: {
              id: true,
              name: true,
              quantity: true,
              isActive: true,
            },
          },
        },
      });

      const productMap = new Map(products.map((product) => [product.id, product]));

      for (const item of cart.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error("Um ou mais produtos do carrinho não estão mais disponíveis.");
        }

        if (item.variantId) {
          const variant = product.variants.find((entry) => entry.id === item.variantId && entry.isActive);

          if (!variant) {
            throw new Error(`A variação selecionada de ${product.name} não está mais disponível.`);
          }

          if (variant.quantity < item.quantity) {
            throw new Error(`Estoque insuficiente para ${product.name} - ${variant.name}. Disponível: ${variant.quantity}.`);
          }
          continue;
        }

        if (product.quantity < item.quantity) {
          throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${product.quantity}.`);
        }
      }

      let appliedDiscount = 0;
      let allowWithPixDiscount = true;

      if (normalizedCouponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: normalizedCouponCode } });
        const brandSlugs = Array.from(new Set(products.map((product) => product.brand?.slug).filter(Boolean))) as string[];
        const categorySlugs = Array.from(new Set(products.map((product) => product.category.slug)));
        const customerOrderCount = await tx.order.count({
          where: {
            OR: [
              ...(session?.user?.id ? [{ userId: session.user.id }] : []),
              ...(email ? [{ guestEmail: email }] : []),
            ],
          },
        });
        const couponValidation = validateCouponEntity(coupon, cart.subtotal, {
          brandSlugs,
          categorySlugs,
          customerOrderCount,
        });

        if (!couponValidation.isValid) {
          throw new Error(couponValidation.error);
        }

        if (!coupon) {
          throw new Error("Cupom não encontrado.");
        }

        appliedDiscount = couponValidation.coupon.discount;
        allowWithPixDiscount = couponValidation.coupon.allowWithPixDiscount;

        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            usageCount: {
              increment: 1,
            },
          },
        });
      }

      const paymentDiscount = paymentMethod === "PIX" && allowWithPixDiscount
        ? Number((((cart.subtotal + shippingQuote.amount - appliedDiscount) * pixDiscountPercent) / 100).toFixed(2))
        : 0;

      const totalDiscount = Number((appliedDiscount + paymentDiscount).toFixed(2));
      const orderTotal = Math.max(0, cart.subtotal + shippingQuote.amount - totalDiscount);
      const paymentExpiresAt = resolvePaymentExpiry(paymentMethod);

      const created = await tx.order.create({
        data: {
          userId: session?.user?.id ?? null,
          isGuest: !session?.user?.id,
          guestName: name,
          guestEmail: email,
          guestPhone: phone || null,
          customerDocument: document || null,
          addressZipcode: zipcode,
          addressStreet: street,
          addressNumber: number,
          addressDistrict: district,
          addressCity: city,
          addressState: state,
          addressCountry: DEFAULT_COUNTRY,
          addressComplement: complement || null,
          paymentMethod,
          paymentStatus: "PENDING",
          paymentExpiresAt,
          shippingService: shippingQuote.service,
          shippingRegion: shippingQuote.region,
          shippingOption: shippingQuote.id,
          shippingEstimatedDays: shippingQuote.estimatedDays,
          notes: notes || null,
          couponCode: normalizedCouponCode || null,
          checkoutToken,
          subtotal: cart.subtotal,
          shipping: shippingQuote.amount,
          discount: totalDiscount,
          total: orderTotal,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.unitPrice,
            })),
          },
        },
        select: { id: true, checkoutToken: true, total: true },
      });

      for (const item of cart.items) {
        const updated = item.variantId
          ? await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                productId: item.productId,
                quantity: { gte: item.quantity },
                isActive: true,
              },
              data: { quantity: { decrement: item.quantity } },
            })
          : await tx.product.updateMany({
              where: {
                id: item.productId,
                quantity: { gte: item.quantity },
              },
              data: { quantity: { decrement: item.quantity } },
            });

        if (updated.count === 0) {
          throw new Error("Não foi possível reservar o estoque do pedido. Atualize o carrinho e tente novamente.");
        }
      }

      if (session?.user?.id) {
        await tx.address.create({
          data: {
            userId: session.user.id,
            label: "Entrega",
            recipient: name,
            zipcode,
            street,
            number,
            district,
            city,
            state,
            country: DEFAULT_COUNTRY,
            complement: complement || null,
          },
        });
      }

      return created;
    });

    await clearCartAction();

    revalidatePath("/cart");
    revalidatePath("/admin/orders");
    revalidatePath("/account");
    revalidatePath("/");

    const customerEmail = session?.user?.email || email;
    const customerName = session?.user?.name || name;

    if (customerEmail) {
      void sendOrderCreatedEmail({
        orderId: order.id,
        checkoutToken: order.checkoutToken,
        customerName,
        customerEmail,
        total: order.total,
        paymentMethod,
        paymentStatus: "pending",
      });
    }

    if (mercadoPago?.isEnabled && mercadoPago.secretKey && ["PIX", "CARD", "BOLETO"].includes(paymentMethod)) {
      const checkout = await createMercadoPagoCheckout(order.id);

      if (checkout?.checkoutUrl) {
        redirect(checkout.checkoutUrl);
      }
    }

    redirect(buildOrderSuccessUrl(order.id, order.checkoutToken));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const duplicatedOrder = await prisma.order.findUnique({
        where: { checkoutToken },
        select: { id: true, checkoutToken: true },
      });

      if (duplicatedOrder) {
        redirect(buildOrderSuccessUrl(duplicatedOrder.id, duplicatedOrder.checkoutToken));
      }
    }

    await recordSystemEvent({
      level: "error",
      source: "checkout",
      eventCode: "ORDER_CREATE_FAILED",
      message: error instanceof Error ? error.message : "Falha desconhecida ao criar pedido.",
      payload: {
        checkoutToken,
        paymentMethod,
        zipcode,
        customerEmail: email,
        itemCount: cart.items.length,
      },
    });

    throw error instanceof Error ? error : new Error("Não foi possível concluir o pedido.");
  }
}

export async function requestOrderPostSaleAction(orderId: string, formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Você precisa estar logado para solicitar atendimento de pós-venda.");
  }

  const requestReason = readField(formData, "requestReason");
  const requestedAmountRaw = readField(formData, "requestedAmount");
  const requestedAmount = requestedAmountRaw ? Number(requestedAmountRaw.replace(",", ".")) : null;

  if (requestReason.length < 10) {
    throw new Error("Descreva o motivo com pelo menos 10 caracteres.");
  }

  if (requestedAmount !== null && (!Number.isFinite(requestedAmount) || requestedAmount <= 0)) {
    throw new Error("Informe um valor de reembolso válido.");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: session.user.id,
    },
    select: {
      id: true,
      total: true,
      status: true,
      paymentStatus: true,
      refundStatus: true,
      refundRequestedAt: true,
      returnReason: true,
    },
  });

  if (!order) {
    throw new Error("Pedido não encontrado.");
  }

  if (!canCustomerRequestPostSale(order)) {
    throw new Error("Este pedido não está elegível para uma nova solicitação de pós-venda.");
  }

  if (requestedAmount !== null && requestedAmount > order.total) {
    throw new Error("O valor solicitado não pode ser maior que o total do pedido.");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      refundStatus: "REQUESTED",
      refundAmount: requestedAmount,
      refundRequestedAt: order.refundRequestedAt ?? new Date(),
      returnReason: formatCustomerPostSaleReason(order.returnReason, requestReason),
    },
  });

  await recordSystemEvent({
    level: "info",
    source: "customer_post_sale",
    eventCode: "POST_SALE_REQUESTED",
    message: `Cliente solicitou atendimento de pós-venda para o pedido ${orderId}.`,
    payload: {
      orderId,
      userId: session.user.id,
      requestedAmount,
      status: order.status,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");

  return { success: true };
}
