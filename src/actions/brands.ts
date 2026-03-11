"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { brandSchema } from "@/lib/validators";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/audit-log";

async function checkAdmin() {
  return requireAdminPermission("catalog:manage");
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseBrandFormData(formData: FormData) {
  const raw = {
    name: readField(formData, "name"),
    slug: generateSlug(readField(formData, "slug") || readField(formData, "name")),
  };

  const parsed = brandSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados da marca inválidos.");
  }

  return parsed.data;
}

export async function createBrand(formData: FormData) {
  const actor = await checkAdmin();

  const { name, slug } = parseBrandFormData(formData);
  let brandId: string | null = null;

  try {
    const brand = await prisma.brand.create({
      data: { name, slug },
    });
    brandId = brand.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Já existe uma marca com esse slug.");
    }

    throw new Error("Erro ao criar marca.");
  }

  await logAdminAudit({
    actor,
    action: "brand.create",
    entityType: "brand",
    entityId: brandId,
    summary: `Marca ${name} criada.`,
    metadata: { slug },
  });

  revalidatePath("/admin/brands");
  revalidatePath("/admin/products/new");
  redirect("/admin/brands");
}

export async function updateBrand(id: string, formData: FormData) {
  const actor = await checkAdmin();

  const { name, slug } = parseBrandFormData(formData);

  try {
    await prisma.brand.update({
      where: { id },
      data: { name, slug },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Já existe uma marca com esse slug.");
    }

    throw new Error("Erro ao atualizar marca.");
  }

  await logAdminAudit({
    actor,
    action: "brand.update",
    entityType: "brand",
    entityId: id,
    summary: `Marca ${name} atualizada.`,
    metadata: { slug },
  });

  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  redirect("/admin/brands");
}

export async function deleteBrand(formData: FormData) {
  const actor = await checkAdmin();

  const id = readField(formData, "id");

  if (!id) {
    throw new Error("Marca inválida.");
  }

  const brand = await prisma.brand.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!brand) {
    throw new Error("Marca não encontrada.");
  }

  if (brand._count.products > 0) {
    throw new Error("Remova ou troque a marca dos produtos vinculados antes de excluir.");
  }

  await prisma.brand.delete({
    where: { id },
  });

  await logAdminAudit({
    actor,
    action: "brand.delete",
    entityType: "brand",
    entityId: id,
    summary: "Marca removida.",
  });

  revalidatePath("/admin/brands");
}