import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { blogPostSchema } from "@/lib/validators";
import { getAdminUserIfAllowed, unauthorizedJson } from "@/lib/admin-auth";
import { getBlogPostByIdentifier } from "@/lib/blog";

export async function GET(_request: Request, context: { params: Promise<{ postId: string }> }) {
  const { postId } = await context.params;
  const post = await getBlogPostByIdentifier(postId);

  if (!post) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  if (!post.isPublished) {
    const user = await getAdminUserIfAllowed("marketing:manage");
    if (!user) {
      return unauthorizedJson();
    }
  }

  return NextResponse.json({ post });
}

export async function PATCH(request: Request, context: { params: Promise<{ postId: string }> }) {
  const user = await getAdminUserIfAllowed("marketing:manage");
  if (!user) {
    return unauthorizedJson();
  }

  const { postId } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = blogPostSchema.safeParse({
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt,
    content: body.content,
    coverImage: body.coverImage ?? "",
    authorName: body.authorName ?? "",
    tags: body.tags ?? "",
    isPublished: Boolean(body.isPublished),
    featured: Boolean(body.featured),
    publishedAt: body.publishedAt ? new Date(String(body.publishedAt)) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const post = await prisma.blogPost.update({
    where: { id: postId },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt,
      content: parsed.data.content,
      coverImage: parsed.data.coverImage || null,
      authorName: parsed.data.authorName || null,
      tags: parsed.data.tags || null,
      isPublished: parsed.data.isPublished,
      featured: parsed.data.featured,
      publishedAt: parsed.data.isPublished ? parsed.data.publishedAt ?? new Date() : parsed.data.publishedAt ?? null,
    },
  });

  return NextResponse.json({ post });
}

export async function DELETE(_request: Request, context: { params: Promise<{ postId: string }> }) {
  const user = await getAdminUserIfAllowed("marketing:manage");
  if (!user) {
    return unauthorizedJson();
  }

  const { postId } = await context.params;
  await prisma.blogPost.delete({ where: { id: postId } });
  return NextResponse.json({ ok: true });
}