import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const FAVORITES_COOKIE = "ecommerce_favorites";

type FavoriteLine = { productId: string };

function parseFavorites(value: string | undefined): FavoriteLine[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const productId = (item as { productId?: unknown }).productId;
        if (typeof productId !== "string" || !productId) return null;
        return { productId };
      })
      .filter((item): item is FavoriteLine => Boolean(item));
  } catch {
    return [];
  }
}

function responseWithCookie(lines: FavoriteLine[]) {
  const response = NextResponse.json({
    items: lines,
    ids: lines.map((line) => line.productId),
  });

  response.cookies.set(FAVORITES_COOKIE, JSON.stringify(lines), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

function responseWithIds(ids: string[], clearCookie = false) {
  const response = NextResponse.json({
    items: ids.map((productId) => ({ productId })),
    ids,
  });

  if (clearCookie) {
    response.cookies.set(FAVORITES_COOKIE, JSON.stringify([]), {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

async function syncCookieFavoritesForUser(userId: string, request: NextRequest) {
  const cookieLines = parseFavorites(request.cookies.get(FAVORITES_COOKIE)?.value);

  if (cookieLines.length) {
    await Promise.all(
      cookieLines.map((line) =>
        prisma.favorite.upsert({
          where: {
            userId_productId: {
              userId,
              productId: line.productId,
            },
          },
          update: {},
          create: {
            userId,
            productId: line.productId,
          },
        }),
      ),
    );
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { productId: true },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((favorite) => favorite.productId);
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (session?.user?.id) {
    const ids = await syncCookieFavoritesForUser(session.user.id, request);
    return responseWithIds(ids, true);
  }

  const lines = parseFavorites(request.cookies.get(FAVORITES_COOKIE)?.value);
  return responseWithCookie(lines);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const lines = parseFavorites(request.cookies.get(FAVORITES_COOKIE)?.value);
  const body = (await request.json()) as { productId?: string };

  if (!body.productId) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (session?.user?.id) {
    await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: body.productId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        productId: body.productId,
      },
    });
    const ids = await syncCookieFavoritesForUser(session.user.id, request);
    return responseWithIds(ids, true);
  }

  if (!lines.some((line) => line.productId === body.productId)) {
    lines.push({ productId: body.productId });
  }

  return responseWithCookie(lines);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  const lines = parseFavorites(request.cookies.get(FAVORITES_COOKIE)?.value);
  const body = (await request.json()) as { productId?: string };

  if (!body.productId) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (session?.user?.id) {
    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        productId: body.productId,
      },
    });
    const ids = await syncCookieFavoritesForUser(session.user.id, request);
    return responseWithIds(ids, true);
  }

  const next = lines.filter((line) => line.productId !== body.productId);
  return responseWithCookie(next);
}
