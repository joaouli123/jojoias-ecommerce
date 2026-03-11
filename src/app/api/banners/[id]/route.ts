import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bannerSchema } from "@/lib/validators";
import { getAdminUserIfAllowed, unauthorizedJson } from "@/lib/admin-auth";

function parseBannerBody(body: Record<string, unknown>) {
  return bannerSchema.safeParse({
    title: body.title,
    subtitle: body.subtitle ?? "",
    imageUrl: body.imageUrl,
    mobileUrl: body.mobileUrl ?? "",
    href: body.href ?? "",
    placement: body.placement,
    isActive: Boolean(body.isActive),
    position: Number(body.position ?? 0),
    startsAt: body.startsAt ? new Date(String(body.startsAt)) : undefined,
    endsAt: body.endsAt ? new Date(String(body.endsAt)) : undefined,
  });
}

async function requireMarketingAccess() {
  return getAdminUserIfAllowed("marketing:manage");
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireMarketingAccess())) {
    return unauthorizedJson();
  }

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = parseBannerBody(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      imageUrl: parsed.data.imageUrl,
      mobileUrl: parsed.data.mobileUrl || null,
      href: parsed.data.href || null,
      placement: parsed.data.placement,
      isActive: parsed.data.isActive,
      position: parsed.data.position,
      startsAt: parsed.data.startsAt ?? null,
      endsAt: parsed.data.endsAt ?? null,
    },
  });

  return NextResponse.json({ banner });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireMarketingAccess())) {
    return unauthorizedJson();
  }

  const { id } = await context.params;
  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
