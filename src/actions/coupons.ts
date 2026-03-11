"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { couponSchema } from "@/lib/validators";
import { normalizeCouponCode } from "@/lib/coupons";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/audit-log";

async function checkAdmin() {
  return requireAdminPermission("marketing:manage");
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalField(formData: FormData, key: string) {
  const value = readField(formData, key);
  return value ? value : undefined;
}

function parseOptionalDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseCouponFormData(formData: FormData) {
  const raw = {
    code: normalizeCouponCode(readField(formData, "code")),
    name: readField(formData, "name"),
    description: readOptionalField(formData, "description"),
    type: readField(formData, "type") || "PERCENTAGE",
    value: Number(formData.get("value")),
    minSubtotal: readOptionalField(formData, "minSubtotal") ? Number(formData.get("minSubtotal")) : undefined,
    maxDiscount: readOptionalField(formData, "maxDiscount") ? Number(formData.get("maxDiscount")) : undefined,
    startsAt: parseOptionalDate(readOptionalField(formData, "startsAt")),
    expiresAt: parseOptionalDate(readOptionalField(formData, "expiresAt")),
    isActive: formData.get("isActive") === "on",
    usageLimit: readOptionalField(formData, "usageLimit") ? Number(formData.get("usageLimit")) : undefined,
    appliesToBrandSlugs: readOptionalField(formData, "appliesToBrandSlugs"),
    appliesToCategorySlugs: readOptionalField(formData, "appliesToCategorySlugs"),
    firstOrderOnly: formData.get("firstOrderOnly") === "on",
    allowWithPixDiscount: formData.get("allowWithPixDiscount") === "on",
  };

  const parsed = couponSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados do cupom inválidos.");
  }

  if (parsed.data.startsAt && parsed.data.expiresAt && parsed.data.expiresAt < parsed.data.startsAt) {
    throw new Error("A data final do cupom deve ser maior que a data inicial.");
  }

  return parsed.data;
}

export async function createCoupon(formData: FormData) {
  const actor = await checkAdmin();
  const data = parseCouponFormData(formData);
  let couponId: string | null = null;

  try {
    const coupon = await prisma.coupon.create({
      data,
    });
    couponId = coupon.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Já existe um cupom com este código.");
    }

    throw new Error("Erro ao criar cupom.");
  }

  await logAdminAudit({
    actor,
    action: "coupon.create",
    entityType: "coupon",
    entityId: couponId,
    summary: `Cupom ${data.code} criado.`,
    metadata: {
      type: data.type,
      value: data.value,
      isActive: data.isActive,
      minSubtotal: data.minSubtotal,
      appliesToBrandSlugs: data.appliesToBrandSlugs,
      appliesToCategorySlugs: data.appliesToCategorySlugs,
      firstOrderOnly: data.firstOrderOnly,
      allowWithPixDiscount: data.allowWithPixDiscount,
    },
  });

  revalidatePath("/admin/coupons");
  revalidatePath("/checkout");
  redirect("/admin/coupons");
}

export async function updateCoupon(id: string, formData: FormData) {
  const actor = await checkAdmin();
  const data = parseCouponFormData(formData);

  try {
    await prisma.coupon.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Já existe um cupom com este código.");
    }

    throw new Error("Erro ao atualizar cupom.");
  }

  await logAdminAudit({
    actor,
    action: "coupon.update",
    entityType: "coupon",
    entityId: id,
    summary: `Cupom ${data.code} atualizado.`,
    metadata: {
      type: data.type,
      value: data.value,
      isActive: data.isActive,
      minSubtotal: data.minSubtotal,
      appliesToBrandSlugs: data.appliesToBrandSlugs,
      appliesToCategorySlugs: data.appliesToCategorySlugs,
      firstOrderOnly: data.firstOrderOnly,
      allowWithPixDiscount: data.allowWithPixDiscount,
    },
  });

  revalidatePath("/admin/coupons");
  revalidatePath("/checkout");
  redirect("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  const actor = await checkAdmin();
  const id = readField(formData, "id");

  if (!id) {
    throw new Error("Cupom inválido.");
  }

  const coupon = await prisma.coupon.findUnique({
    where: { id },
    select: { code: true },
  });

  await prisma.coupon.delete({ where: { id } });

  await logAdminAudit({
    actor,
    action: "coupon.delete",
    entityType: "coupon",
    entityId: id,
    summary: `Cupom ${coupon?.code || id} removido.`,
  });

  revalidatePath("/admin/coupons");
  revalidatePath("/checkout");
}