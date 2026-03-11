"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { categorySchema } from "@/lib/validators";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/audit-log";

async function checkAdmin() {
  return requireAdminPermission("catalog:manage");
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseCategoryFormData(formData: FormData) {
  const raw = {
    name: readField(formData, "name"),
    slug: generateSlug(readField(formData, "slug") || readField(formData, "name")),
  };

  const parsed = categorySchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados da categoria inválidos.");
  }

  return parsed.data;
}

export async function createCategory(formData: FormData) {
  const actor = await checkAdmin();

  const { name, slug } = parseCategoryFormData(formData);
  let categoryId: string | null = null;

  try {
    const category = await prisma.category.create({
      data: { name, slug },
    });
    categoryId = category.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Já existe uma categoria com esse slug.");
    }

    throw new Error("Erro ao criar categoria.");
  }

  await logAdminAudit({
    actor,
    action: "category.create",
    entityType: "category",
    entityId: categoryId,
    summary: `Categoria ${name} criada.`,
    metadata: { slug },
  });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const actor = await checkAdmin();

  const { name, slug } = parseCategoryFormData(formData);

  try {
    await prisma.category.update({
      where: { id },
      data: { name, slug },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Já existe uma categoria com esse slug.");
    }

    throw new Error("Erro ao atualizar categoria.");
  }

  await logAdminAudit({
    actor,
    action: "category.update",
    entityType: "category",
    entityId: id,
    summary: `Categoria ${name} atualizada.`,
    metadata: { slug },
  });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const actor = await checkAdmin();
  const id = readField(formData, "id");

  if (!id) {
    throw new Error("Categoria inválida.");
  }

  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error("Categoria não encontrada.");
  }

  if (category._count.products > 0) {
    throw new Error("Remova ou mova os produtos desta categoria antes de excluí-la.");
  }

  await prisma.category.delete({
    where: { id },
  });

  await logAdminAudit({
    actor,
    action: "category.delete",
    entityType: "category",
    entityId: id,
    summary: "Categoria removida.",
  });

  revalidatePath("/admin/categories");
}