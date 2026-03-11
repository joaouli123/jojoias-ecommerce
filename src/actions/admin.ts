"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { generateSlug } from "@/lib/utils";
import { normalizeInputText, parseCurrencyInput } from "@/lib/admin-display";
import { bannerSchema, pageSchema, productSchema, productVariantSchema } from "@/lib/validators";
import { ORDER_STATUS_TRANSITIONS, type OrderStatusKey } from "@/lib/constants";
import type { AdminPermission } from "@/lib/admin-permissions";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/audit-log";
import { issueMercadoPagoRefund } from "@/lib/mercado-pago";
import { sendOrderPaymentUpdateFromOrder } from "@/lib/email";
import { recordSystemEvent } from "@/lib/system-events";

async function getAdminActor(permission: AdminPermission = "dashboard:view") {
  return requireAdminPermission(permission);
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = normalizeInputText(value);
  return trimmed ? trimmed : undefined;
}

function parseVariantsJson(formData: FormData) {
  const raw = readOptionalString(formData, "variantsJson");
  if (!raw) return null;

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Estrutura de variações inválida.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Estrutura de variações inválida.");
  }

  return parsed.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Estrutura de variações inválida.");
    }

    const record = item as Record<string, unknown>;
    const parsedVariant = productVariantSchema.safeParse({
      name: normalizeInputText(typeof record.name === "string" ? record.name : ""),
      price: typeof record.price === "number" ? record.price : Number(record.price),
      quantity: typeof record.quantity === "number" ? record.quantity : Number(record.quantity),
      sku: normalizeInputText(typeof record.sku === "string" ? record.sku : "") || undefined,
      image: normalizeInputText(typeof record.image === "string" ? record.image : ""),
      isActive: typeof record.isActive === "boolean" ? record.isActive : true,
    });

    if (!parsedVariant.success) {
      throw new Error(parsedVariant.error.issues[0]?.message || "Dados de variação inválidos.");
    }

    return parsedVariant.data;
  });
}

function parseProductFormData(formData: FormData) {
  const galleryImages = (readOptionalString(formData, "galleryImages") ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const variants = parseVariantsJson(formData) ?? (readOptionalString(formData, "variants") ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", price = "", quantity = "", sku = "", image = ""] = line.split("|").map((part) => part.trim());

      const parsedVariant = productVariantSchema.safeParse({
        name: normalizeInputText(name),
        price: parseCurrencyInput(price),
        quantity: Number(quantity),
        sku: normalizeInputText(sku) || undefined,
        image: normalizeInputText(image) || "",
        isActive: true,
      });

      if (!parsedVariant.success) {
        throw new Error(parsedVariant.error.issues[0]?.message || "Dados de variação inválidos.");
      }

      return parsedVariant.data;
    });

  const raw = {
    name: readOptionalString(formData, "name") ?? "",
    slug: generateSlug(readOptionalString(formData, "slug") || readOptionalString(formData, "name") || ""),
    description: readOptionalString(formData, "description"),
    image: readOptionalString(formData, "image") ?? "",
    galleryImages,
    price: parseCurrencyInput(formData.get("price")),
    comparePrice: readOptionalString(formData, "comparePrice") ? parseCurrencyInput(formData.get("comparePrice")) : undefined,
    sku: readOptionalString(formData, "sku"),
    quantity: Number(formData.get("quantity")),
    categoryId: readOptionalString(formData, "categoryId") ?? "",
    brandId: readOptionalString(formData, "brandId") ?? "",
    status: readOptionalString(formData, "status") ?? "DRAFT",
    variants,
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados do produto inválidos.");
  }

  return parsed.data;
}

function canTransitionOrderStatus(currentStatus: OrderStatusKey, nextStatus: OrderStatusKey) {
  if (currentStatus === nextStatus) return true;
  return (ORDER_STATUS_TRANSITIONS[currentStatus] as readonly OrderStatusKey[]).includes(nextStatus);
}

export async function createProduct(formData: FormData) {
  const actor = await getAdminActor("products:manage");

  const { name, slug, description, image, galleryImages, price, comparePrice, sku, quantity, categoryId, brandId, status, variants } = parseProductFormData(formData);

  let createdProductId: string | null = null;

  try {
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        image: image || null,
        price,
        comparePrice,
        sku,
        quantity,
        categoryId,
        brandId: brandId || null,
        status,
        galleryImages: {
          create: (galleryImages ?? []).map((url, index) => ({
            url,
            position: index,
          })),
        },
        variants: {
          create: (variants ?? []).map((variant) => ({
            name: variant.name,
            price: variant.price,
            quantity: variant.quantity,
            sku: variant.sku,
            image: variant.image || null,
            isActive: variant.isActive,
          })),
        },
      },
    });
    createdProductId = product.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Slug ou SKU já cadastrados. Revise os dados do produto.");
    }
    console.error("Error creating product:", error);
    throw new Error("Erro ao criar produto. Verifique se o slug ou SKU já existem.");
  }

  await logAdminAudit({
    actor,
    action: "product.create",
    entityType: "product",
    entityId: createdProductId,
    summary: `Produto ${name} criado.`,
    metadata: { slug, status, categoryId, brandId, quantity, price },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const actor = await getAdminActor("products:manage");

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID não fornecido");

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    await prisma.product.delete({
      where: { id },
    });

    await logAdminAudit({
      actor,
      action: "product.delete",
      entityType: "product",
      entityId: id,
      summary: `Produto ${existing?.name || id} removido.`,
      metadata: { slug: existing?.slug || null },
    });

    revalidatePath("/admin/products");
  } catch (error) {
    console.error(error);
    throw new Error("Erro ao excluir produto");
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const actor = await getAdminActor("products:manage");

  const { name, slug, description, image, galleryImages, price, comparePrice, sku, quantity, categoryId, brandId, status, variants } = parseProductFormData(formData);

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        image: image || null,
        price,
        comparePrice,
        sku,
        quantity,
        categoryId,
        brandId: brandId || null,
        status,
        galleryImages: {
          deleteMany: {},
          create: (galleryImages ?? []).map((url, index) => ({
            url,
            position: index,
          })),
        },
        variants: {
          deleteMany: {},
          create: (variants ?? []).map((variant) => ({
            name: variant.name,
            price: variant.price,
            quantity: variant.quantity,
            sku: variant.sku,
            image: variant.image || null,
            isActive: variant.isActive,
          })),
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Slug ou SKU já cadastrados. Revise os dados do produto.");
    }
    console.error("Error updating product:", error);
    throw new Error("Erro ao atualizar produto.");
  }

  await logAdminAudit({
    actor,
    action: "product.update",
    entityType: "product",
    entityId: id,
    summary: `Produto ${name} atualizado.`,
    metadata: { slug, status, categoryId, brandId, quantity, price },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateOrderStatus(id: string, formData: FormData) {
  const actor = await getAdminActor("orders:manage");
  
  const statusValue = readOptionalString(formData, "status") ?? "";
  const status = statusValue as OrderStatusKey;

  if (!(status in ORDER_STATUS_TRANSITIONS)) {
    throw new Error("Status de pedido inválido.");
  }
  
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        select: {
          status: true,
          items: {
            select: {
              productId: true,
              variantId: true,
              quantity: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("Pedido não encontrado.");
      }

      const currentStatus = order.status as OrderStatusKey;
      if (!canTransitionOrderStatus(currentStatus, status)) {
        throw new Error(`Transição inválida: ${currentStatus} → ${status}.`);
      }

      await tx.order.update({
        where: { id },
        data: { status },
      });

      if (status === "CANCELLED" && currentStatus !== "CANCELLED") {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                quantity: {
                  increment: item.quantity,
                },
              },
            });
            continue;
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error(error instanceof Error ? error.message : "Erro ao atualizar status do pedido.");
  }

  await logAdminAudit({
    actor,
    action: "order.status.update",
    entityType: "order",
    entityId: id,
    summary: `Status do pedido atualizado para ${status}.`,
    metadata: { status },
  });

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

const REFUND_STATUS_OPTIONS = ["NONE", "REQUESTED", "APPROVED", "REFUNDED", "DENIED"] as const;

export async function updateOrderPostSale(id: string, formData: FormData) {
  const actor = await getAdminActor("orders:manage");

  const refundStatusRaw = readOptionalString(formData, "refundStatus") ?? "NONE";
  const refundStatus = REFUND_STATUS_OPTIONS.includes(refundStatusRaw as (typeof REFUND_STATUS_OPTIONS)[number])
    ? refundStatusRaw as (typeof REFUND_STATUS_OPTIONS)[number]
    : "NONE";
  const returnReason = readOptionalString(formData, "returnReason") ?? null;
  const refundAmountRaw = readOptionalString(formData, "refundAmount");
  const refundAmount = refundAmountRaw ? Number(refundAmountRaw.replace(",", ".")) : null;

  if (refundAmount !== null && (!Number.isFinite(refundAmount) || refundAmount < 0)) {
    throw new Error("Valor de reembolso inválido.");
  }

  const current = await prisma.order.findUnique({
    where: { id },
    select: {
      total: true,
      refundStatus: true,
      refundRequestedAt: true,
      refundedAt: true,
    },
  });

  if (!current) {
    throw new Error("Pedido não encontrado.");
  }

  if (refundAmount !== null && refundAmount > current.total) {
    throw new Error("O reembolso não pode ser maior que o total do pedido.");
  }

  const now = new Date();
  const shouldStampRequestedAt = refundStatus === "REQUESTED" && !current.refundRequestedAt;
  const shouldStampRefundedAt = refundStatus === "REFUNDED" && !current.refundedAt;

  await prisma.order.update({
    where: { id },
    data: {
      refundStatus: refundStatus === "NONE" ? null : refundStatus,
      refundAmount,
      returnReason,
      refundRequestedAt: shouldStampRequestedAt ? now : refundStatus === "NONE" ? null : undefined,
      refundedAt: shouldStampRefundedAt ? now : refundStatus === "NONE" ? null : undefined,
    },
  });

  await logAdminAudit({
    actor,
    action: "order.postsale.update",
    entityType: "order",
    entityId: id,
    summary: `Pós-venda do pedido atualizado para ${refundStatus}.`,
    metadata: {
      refundStatus,
      refundAmount,
      returnReason,
    },
  });

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function executeOrderRefund(id: string, formData: FormData) {
  const actor = await getAdminActor("orders:manage");
  const refundAmountRaw = readOptionalString(formData, "refundAmount");
  const refundAmount = refundAmountRaw ? Number(refundAmountRaw.replace(",", ".")) : null;

  if (refundAmount !== null && (!Number.isFinite(refundAmount) || refundAmount <= 0)) {
    throw new Error("Valor de reembolso inválido.");
  }

  try {
    const result = await issueMercadoPagoRefund(id, refundAmount);

    await logAdminAudit({
      actor,
      action: "order.refund.execute",
      entityType: "order",
      entityId: id,
      summary: `Reembolso executado no Mercado Pago para o pedido ${id}.`,
      metadata: {
        refundAmount: result.refundAmount,
        refundId: result.refundId,
        paymentStatus: result.paymentStatus,
      },
    });

    await sendOrderPaymentUpdateFromOrder(id);
  } catch (error) {
    await recordSystemEvent({
      level: "error",
      source: "mercado_pago_refund",
      eventCode: "REFUND_EXECUTION_FAILED",
      message: error instanceof Error ? error.message : "Falha ao executar reembolso no Mercado Pago.",
      payload: {
        orderId: id,
        refundAmount,
      },
    });
    throw error;
  }

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

function parseBannerFormData(formData: FormData) {
  const startsAtRaw = readOptionalString(formData, "startsAt");
  const endsAtRaw = readOptionalString(formData, "endsAt");

  const raw = {
    title: readOptionalString(formData, "title") ?? "",
    subtitle: readOptionalString(formData, "subtitle") ?? "",
    imageUrl: readOptionalString(formData, "imageUrl") ?? "",
    mobileUrl: readOptionalString(formData, "mobileUrl") ?? "",
    href: readOptionalString(formData, "href") ?? "",
    placement: (readOptionalString(formData, "placement") ?? "hero") as "hero" | "secondary" | "sidebar",
    isActive: formData.get("isActive") === "on",
    position: Number(formData.get("position") ?? 0),
    startsAt: startsAtRaw ? new Date(startsAtRaw) : undefined,
    endsAt: endsAtRaw ? new Date(endsAtRaw) : undefined,
  };

  const parsed = bannerSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados do banner inválidos.");
  }

  return parsed.data;
}

export async function createBanner(formData: FormData) {
  const actor = await getAdminActor("marketing:manage");
  const data = parseBannerFormData(formData);

  const banner = await prisma.banner.create({
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      imageUrl: data.imageUrl,
      mobileUrl: data.mobileUrl || null,
      href: data.href || null,
      placement: data.placement,
      isActive: data.isActive,
      position: data.position,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    },
  });

  await logAdminAudit({
    actor,
    action: "banner.create",
    entityType: "banner",
    entityId: banner.id,
    summary: `Banner ${data.title} criado.`,
    metadata: { placement: data.placement, isActive: data.isActive, href: data.href || null },
  });

  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function updateBanner(id: string, formData: FormData) {
  const actor = await getAdminActor("marketing:manage");
  const data = parseBannerFormData(formData);

  await prisma.banner.update({
    where: { id },
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      imageUrl: data.imageUrl,
      mobileUrl: data.mobileUrl || null,
      href: data.href || null,
      placement: data.placement,
      isActive: data.isActive,
      position: data.position,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    },
  });

  await logAdminAudit({
    actor,
    action: "banner.update",
    entityType: "banner",
    entityId: id,
    summary: `Banner ${data.title} atualizado.`,
    metadata: { placement: data.placement, isActive: data.isActive, href: data.href || null },
  });

  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function deleteBanner(formData: FormData) {
  const actor = await getAdminActor("marketing:manage");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Banner inválido");

  const banner = await prisma.banner.delete({
    where: { id },
    select: { id: true, title: true, placement: true },
  });

  await logAdminAudit({
    actor,
    action: "banner.delete",
    entityType: "banner",
    entityId: banner.id,
    summary: `Banner ${banner.title} removido.`,
    metadata: { placement: banner.placement },
  });

  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function reorderBanners(formData: FormData) {
  const actor = await getAdminActor("marketing:manage");

  const orderedIdsRaw = readOptionalString(formData, "orderedIds") ?? "[]";
  const orderedIds = JSON.parse(orderedIdsRaw) as string[];

  if (!Array.isArray(orderedIds) || !orderedIds.length) {
    throw new Error("Ordenação inválida.");
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.banner.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  await logAdminAudit({
    actor,
    action: "banner.reorder",
    entityType: "banner",
    summary: "Ordem dos banners atualizada.",
    metadata: { orderedIds },
  });

  revalidatePath("/admin/banners");
  revalidatePath("/");
}

function parsePageFormData(formData: FormData) {
  const raw = {
    title: readOptionalString(formData, "title") ?? "",
    slug: generateSlug(readOptionalString(formData, "slug") || readOptionalString(formData, "title") || ""),
    content: readOptionalString(formData, "content") ?? "",
    metaTitle: readOptionalString(formData, "metaTitle") ?? "",
    metaDescription: readOptionalString(formData, "metaDescription") ?? "",
    isPublished: formData.get("isPublished") === "on",
  };

  const parsed = pageSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados da página inválidos.");
  }

  return parsed.data;
}

export async function createPage(formData: FormData) {
  const actor = await getAdminActor("marketing:manage");
  const data = parsePageFormData(formData);

  const page = await prisma.page.create({
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      isPublished: data.isPublished,
    },
  });

  await logAdminAudit({
    actor,
    action: "page.create",
    entityType: "page",
    entityId: page.id,
    summary: `Página ${data.title} criada.`,
    metadata: { slug: data.slug, isPublished: data.isPublished },
  });

  revalidatePath("/admin/pages");
  revalidatePath(`/pages/${data.slug}`);
  redirect("/admin/pages");
}

export async function updatePage(id: string, formData: FormData) {
  const actor = await getAdminActor("marketing:manage");
  const data = parsePageFormData(formData);

  await prisma.page.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      isPublished: data.isPublished,
    },
  });

  await logAdminAudit({
    actor,
    action: "page.update",
    entityType: "page",
    entityId: id,
    summary: `Página ${data.title} atualizada.`,
    metadata: { slug: data.slug, isPublished: data.isPublished },
  });

  revalidatePath("/admin/pages");
  revalidatePath(`/pages/${data.slug}`);
  redirect("/admin/pages");
}

export async function deletePage(formData: FormData) {
  const actor = await getAdminActor("marketing:manage");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Página inválida");

  const page = await prisma.page.delete({
    where: { id },
    select: { slug: true },
  });

  await logAdminAudit({
    actor,
    action: "page.delete",
    entityType: "page",
    entityId: id,
    summary: `Página ${page.slug} removida.`,
    metadata: { slug: page.slug },
  });

  revalidatePath("/admin/pages");
  revalidatePath(`/pages/${page.slug}`);
}

export async function updateOrderNotes(id: string, formData: FormData) {
  const actor = await getAdminActor("orders:manage");

  const notes = readOptionalString(formData, "notes") ?? null;

  await prisma.order.update({
    where: { id },
    data: { notes },
  });

  await logAdminAudit({
    actor,
    action: "order.notes.update",
    entityType: "order",
    entityId: id,
    summary: "Observações do pedido atualizadas.",
    metadata: { hasNotes: Boolean(notes) },
  });

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function updateOrderTracking(id: string, formData: FormData) {
  const actor = await getAdminActor("orders:manage");

  const trackingCode = readOptionalString(formData, "trackingCode") ?? null;
  const trackingUrl = readOptionalString(formData, "trackingUrl") ?? null;

  await prisma.order.update({
    where: { id },
    data: {
      trackingCode,
      trackingUrl,
    },
  });

  await logAdminAudit({
    actor,
    action: "order.tracking.update",
    entityType: "order",
    entityId: id,
    summary: "Rastreamento do pedido atualizado.",
    metadata: { trackingCode, trackingUrl },
  });

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
}

