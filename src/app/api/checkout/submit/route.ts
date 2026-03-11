import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE, DEFAULT_COUNTRY } from "@/lib/constants";
import { hydrateCart, type CartLine } from "@/lib/store-data";
import { checkoutSubmissionSchema } from "@/lib/validators";
import { getShippingOptionById } from "@/lib/shipping";
import { normalizeCouponCode, validateCouponEntity } from "@/lib/coupons";
import { getIntegrationSettings } from "@/lib/integrations";
import { sendOrderCreatedEmail } from "@/lib/email";
import { recordSystemEvent } from "@/lib/system-events";
import { assertRecaptchaToken } from "@/lib/recaptcha";
import { createMercadoPagoTransparentPayment } from "@/lib/mercado-pago";

const terminalFailedStatuses = new Set(["rejected", "cancelled", "failure", "charged_back"]);

function parseCart(value: string | undefined): CartLine[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const productId = (item as { productId?: unknown }).productId;
      const variantId = (item as { variantId?: unknown }).variantId;
      const quantity = (item as { quantity?: unknown }).quantity;

      if (typeof productId !== "string") return [];
      if (variantId !== undefined && typeof variantId !== "string") return [];
      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) return [];

      return [{ productId, variantId: variantId || undefined, quantity }];
    });
  } catch {
    return [];
  }
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

function formatPaymentFailureMessage(status: string, statusDetail: string | null) {
  if (status === "rejected") {
    return "O cartão não foi aprovado. Revise os dados informados ou tente outro cartão.";
  }

  if (status === "cancelled") {
    return "O pagamento foi cancelado pelo gateway. Tente novamente.";
  }

  return statusDetail || "Não foi possível processar o pagamento agora. Tente novamente.";
}

async function restoreOrderInventory(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  });
}

const cardFieldsSchema = z.object({
  cardNumber: z.string().trim().min(13, "Número do cartão inválido."),
  cardHolder: z.string().trim().min(2, "Nome do titular do cartão é obrigatório."),
  cardExpiry: z.string().trim().regex(/^\d{2}\/\d{2}$/, "Validade do cartão inválida."),
  cardCvv: z.string().trim().min(3, "CVV inválido.").max(4, "CVV inválido."),
  cardInstallments: z.coerce.number().int().min(1).max(24),
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const checkoutToken = readField(formData, "checkoutToken");
  const paymentMethod = (readField(formData, "paymentMethod") || "PIX") as "PIX" | "CARD" | "BOLETO";
  const rawCart = parseCart(request.cookies.get(CART_COOKIE)?.value);
  const cartItems = await hydrateCart(rawCart);
  const cart = {
    items: cartItems,
    subtotal: cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
  };

  let createdOrderId: string | null = null;

  try {
    await assertRecaptchaToken({
      token: readField(formData, "recaptchaToken"),
      action: "checkout_submit",
      minScore: 0.4,
    });

    if (readField(formData, "recaptchaAction") !== "checkout_submit") {
      throw new Error("A validação de segurança do checkout falhou.");
    }

    const parsed = checkoutSubmissionSchema.safeParse({
      checkoutToken,
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
      paymentMethod,
      couponCode: readField(formData, "couponCode") || readField(formData, "couponCodeMobile") || readField(formData, "couponCodeDesktop"),
      notes: readField(formData, "notes"),
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || "Dados inválidos para concluir o pedido.");
    }

    if (!cart.items.length) {
      throw new Error("Carrinho vazio.");
    }

    const cardFields = paymentMethod === "CARD"
      ? cardFieldsSchema.parse({
          cardNumber: readField(formData, "cardNumber"),
          cardHolder: readField(formData, "cardHolder"),
          cardExpiry: readField(formData, "cardExpiry"),
          cardCvv: readField(formData, "cardCvv"),
          cardInstallments: readField(formData, "cardInstallments") || "1",
        })
      : null;

    const {
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
      couponCode,
      notes,
    } = parsed.data;
    const customerDocument = document || "";

    if (!customerDocument) {
      throw new Error("CPF inválido.");
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
      select: { id: true, checkoutToken: true },
    });

    if (existingOrder) {
      return NextResponse.json({ nextUrl: buildOrderSuccessUrl(existingOrder.id, existingOrder.checkoutToken) });
    }

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
          brand: { select: { slug: true } },
          category: { select: { slug: true } },
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
          data: { usageCount: { increment: 1 } },
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
          customerDocument: customerDocument || null,
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

    createdOrderId = order.id;

    const paymentDetails = mercadoPago?.isEnabled && mercadoPago.secretKey && ["PIX", "CARD", "BOLETO"].includes(paymentMethod)
      ? await createMercadoPagoTransparentPayment({
          orderId: order.id,
          paymentMethod,
          payer: {
            name,
            email,
            document: customerDocument,
            zipcode,
            street,
            number,
            district,
            city,
            state,
          },
          card: cardFields
            ? {
                number: cardFields.cardNumber,
                holderName: cardFields.cardHolder,
                expiry: cardFields.cardExpiry,
                cvv: cardFields.cardCvv,
                installments: cardFields.cardInstallments,
              }
            : undefined,
        })
      : null;

    if (paymentDetails && paymentMethod === "CARD" && terminalFailedStatuses.has(paymentDetails.status)) {
      await restoreOrderInventory(order.id);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: paymentDetails.status,
          status: "CANCELLED",
        },
      });

      return NextResponse.json({
        error: formatPaymentFailureMessage(paymentDetails.status, paymentDetails.statusDetail),
      }, { status: 400 });
    }

    revalidatePath("/cart");
    revalidatePath("/admin/orders");
    revalidatePath("/account");
    revalidatePath("/");

    if (email) {
      await sendOrderCreatedEmail({
        orderId: order.id,
        checkoutToken: order.checkoutToken,
        customerName: name,
        customerEmail: email,
        total: order.total,
        paymentMethod,
        paymentStatus: paymentDetails?.status || "pending",
      });
    }

    const response = NextResponse.json({
      nextUrl: buildOrderSuccessUrl(order.id, order.checkoutToken),
    });

    response.cookies.set(CART_COOKIE, JSON.stringify([]), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    if (createdOrderId) {
      await restoreOrderInventory(createdOrderId).catch(() => undefined);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const duplicatedOrder = await prisma.order.findUnique({
        where: { checkoutToken },
        select: { id: true, checkoutToken: true },
      });

      if (duplicatedOrder) {
        return NextResponse.json({ nextUrl: buildOrderSuccessUrl(duplicatedOrder.id, duplicatedOrder.checkoutToken) });
      }
    }

    await recordSystemEvent({
      level: "error",
      source: "checkout",
      eventCode: "TRANSPARENT_ORDER_CREATE_FAILED",
      message: error instanceof Error ? error.message : "Falha desconhecida ao criar pedido transparente.",
      payload: {
        checkoutToken,
        paymentMethod,
        customerEmail: readField(formData, "email"),
        itemCount: cart.items.length,
      },
    });

    return NextResponse.json({
      error: error instanceof Error ? error.message : "Não foi possível concluir o pedido.",
    }, { status: 400 });
  }
}