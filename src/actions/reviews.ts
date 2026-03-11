"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validators";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/audit-log";

async function checkAdmin() {
  return requireAdminPermission("marketing:manage");
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitReviewAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Você precisa entrar para avaliar este produto.");
  }

  const parsed = reviewSchema.safeParse({
    productId: readField(formData, "productId"),
    rating: Number(formData.get("rating")),
    title: readField(formData, "title") || undefined,
    content: readField(formData, "content"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados inválidos para avaliação.");
  }

  const hasPurchased = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
      items: {
        some: {
          productId: parsed.data.productId,
        },
      },
    },
    select: { id: true },
  });

  if (!hasPurchased) {
    throw new Error("A avaliação está liberada apenas para clientes que compraram o produto.");
  }

  await prisma.review.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: parsed.data.productId,
      },
    },
    update: {
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      content: parsed.data.content,
    },
    create: {
      userId: session.user.id,
      productId: parsed.data.productId,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      content: parsed.data.content,
    },
  });

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { slug: true },
  });

  if (product?.slug) {
    revalidatePath(`/produto/${product.slug}`);
  }
}

export async function deleteReviewAdminAction(formData: FormData) {
  const actor = await checkAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Avaliação inválida.");
  }

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      product: {
        select: { slug: true },
      },
    },
  });

  if (!review) {
    throw new Error("Avaliação não encontrada.");
  }

  await prisma.review.delete({ where: { id } });

  await logAdminAudit({
    actor,
    action: "review.delete",
    entityType: "review",
    entityId: id,
    summary: `Avaliação do produto ${review.product.slug} removida.`,
    metadata: {
      productSlug: review.product.slug,
      userId: review.userId,
      rating: review.rating,
    },
  });

  revalidatePath("/admin/reviews");
  if (review.product.slug) {
    revalidatePath(`/produto/${review.product.slug}`);
  }
}