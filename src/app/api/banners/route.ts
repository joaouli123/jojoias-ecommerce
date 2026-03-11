import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bannerSchema } from "@/lib/validators";
import { getAdminUserIfAllowed, unauthorizedJson } from "@/lib/admin-auth";

function parseBannerBody(body: Record<string, unknown>) {
  const parsed = bannerSchema.safeParse({
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

  return parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement");
  const active = searchParams.get("active");
  const now = new Date();

  const banners = await prisma.banner.findMany({
    where: {
      ...(placement ? { placement } : {}),
      ...(active === "true"
        ? {
            isActive: true,
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
              { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
            ],
          }
        : {}),
    },
    orderBy: [{ placement: "asc" }, { position: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ banners });
}

export async function POST(request: Request) {
  const user = await getAdminUserIfAllowed("marketing:manage");
  if (!user) {
    return unauthorizedJson();
  }

  const body = (await request.json()) as Record<string, unknown>;
  const parsed = parseBannerBody(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const banner = await prisma.banner.create({
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

  return NextResponse.json({ banner }, { status: 201 });
}
