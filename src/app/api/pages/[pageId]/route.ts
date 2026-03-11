import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pageSchema } from "@/lib/validators";
import { getAdminUserIfAllowed, unauthorizedJson } from "@/lib/admin-auth";
import { getPageByIdentifier } from "@/lib/cms-pages";

async function requireMarketingAccess() {
  return getAdminUserIfAllowed("marketing:manage");
}

export async function GET(_request: Request, context: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await context.params;
  const page = await getPageByIdentifier(pageId);

  if (!page) {
    return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ page });
}

export async function PATCH(request: Request, context: { params: Promise<{ pageId: string }> }) {
  if (!(await requireMarketingAccess())) {
    return unauthorizedJson();
  }

  const { pageId } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = pageSchema.safeParse({
    title: body.title,
    slug: body.slug,
    content: body.content,
    metaTitle: body.metaTitle ?? "",
    metaDescription: body.metaDescription ?? "",
    isPublished: Boolean(body.isPublished),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const page = await prisma.page.update({
    where: { id: pageId },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      content: parsed.data.content,
      metaTitle: parsed.data.metaTitle || null,
      metaDescription: parsed.data.metaDescription || null,
      isPublished: parsed.data.isPublished,
    },
  });

  return NextResponse.json({ page });
}

export async function DELETE(_request: Request, context: { params: Promise<{ pageId: string }> }) {
  if (!(await requireMarketingAccess())) {
    return unauthorizedJson();
  }

  const { pageId } = await context.params;
  await prisma.page.delete({ where: { id: pageId } });
  return NextResponse.json({ ok: true });
}
