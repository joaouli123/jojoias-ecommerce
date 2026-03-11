import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pageSchema } from "@/lib/validators";
import { hasAdminPermission } from "@/lib/admin-permissions";

export async function GET() {
  const pages = await prisma.page.findMany({
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
  });

  return NextResponse.json({ pages });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !hasAdminPermission(session.user.role, "marketing:manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const page = await prisma.page.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      content: parsed.data.content,
      metaTitle: parsed.data.metaTitle || null,
      metaDescription: parsed.data.metaDescription || null,
      isPublished: parsed.data.isPublished,
    },
  });

  return NextResponse.json({ page }, { status: 201 });
}
