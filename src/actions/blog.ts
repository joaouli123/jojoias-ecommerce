"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { blogPostSchema } from "@/lib/validators";
import { generateSlug } from "@/lib/utils";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/audit-log";

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseBlogPostFormData(formData: FormData) {
  const publishedAtRaw = readOptionalString(formData, "publishedAt");

  const raw = {
    title: readOptionalString(formData, "title") ?? "",
    slug: generateSlug(readOptionalString(formData, "slug") || readOptionalString(formData, "title") || ""),
    excerpt: readOptionalString(formData, "excerpt") ?? "",
    content: readOptionalString(formData, "content") ?? "",
    coverImage: readOptionalString(formData, "coverImage") ?? "",
    authorName: readOptionalString(formData, "authorName") ?? "",
    tags: readOptionalString(formData, "tags") ?? "",
    isPublished: formData.get("isPublished") === "on",
    featured: formData.get("featured") === "on",
    publishedAt: publishedAtRaw ? new Date(publishedAtRaw) : undefined,
  };

  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados do post inválidos.");
  }

  return parsed.data;
}

async function getAdminActor() {
  return requireAdminPermission("marketing:manage");
}

export async function createBlogPost(formData: FormData) {
  const actor = await getAdminActor();
  const data = parseBlogPostFormData(formData);

  try {
    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage || null,
        authorName: data.authorName || null,
        tags: data.tags || null,
        isPublished: data.isPublished,
        featured: data.featured,
        publishedAt: data.isPublished ? data.publishedAt ?? new Date() : data.publishedAt ?? null,
      },
    });

    await logAdminAudit({
      actor,
      action: "blog.create",
      entityType: "blog_post",
      entityId: post.id,
      summary: `Post ${data.title} criado.`,
      metadata: { slug: data.slug, isPublished: data.isPublished, featured: data.featured },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Já existe um post com este slug.");
    }
    throw error;
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  redirect("/admin/blog");
}

export async function updateBlogPost(id: string, formData: FormData) {
  const actor = await getAdminActor();
  const data = parseBlogPostFormData(formData);

  try {
    await prisma.blogPost.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage || null,
        authorName: data.authorName || null,
        tags: data.tags || null,
        isPublished: data.isPublished,
        featured: data.featured,
        publishedAt: data.isPublished ? data.publishedAt ?? new Date() : data.publishedAt ?? null,
      },
    });

    await logAdminAudit({
      actor,
      action: "blog.update",
      entityType: "blog_post",
      entityId: id,
      summary: `Post ${data.title} atualizado.`,
      metadata: { slug: data.slug, isPublished: data.isPublished, featured: data.featured },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Já existe um post com este slug.");
    }
    throw error;
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  redirect("/admin/blog");
}

export async function deleteBlogPost(formData: FormData) {
  const actor = await getAdminActor();
  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    throw new Error("Post inválido.");
  }

  const post = await prisma.blogPost.delete({
    where: { id },
    select: { id: true, title: true, slug: true },
  });

  await logAdminAudit({
    actor,
    action: "blog.delete",
    entityType: "blog_post",
    entityId: post.id,
    summary: `Post ${post.title} removido.`,
    metadata: { slug: post.slug },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
}