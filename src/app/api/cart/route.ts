import { NextRequest, NextResponse } from "next/server";
import { hydrateCart, type CartLine } from "@/lib/store-data";
import { CART_COOKIE } from "@/lib/constants";
import { assertProductQuantityAvailable } from "@/lib/inventory";

function parseCart(value: string | undefined): CartLine[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const productId = (item as { productId?: unknown }).productId;
        const variantId = (item as { variantId?: unknown }).variantId;
        const quantity = (item as { quantity?: unknown }).quantity;

        if (typeof productId !== "string") return [];
        if (variantId !== undefined && typeof variantId !== "string") return [];
        if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) return [];

        return [{ productId, variantId: variantId || undefined, quantity }];
      });
  } catch {
    return [];
  }
}

async function cartResponse(lines: CartLine[]) {
  const items = await hydrateCart(lines);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const payload = {
    items,
    subtotal,
    shipping: 0,
    total: subtotal,
  };

  const response = NextResponse.json(payload);
  response.cookies.set(CART_COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

export async function GET(request: NextRequest) {
  const lines = parseCart(request.cookies.get(CART_COOKIE)?.value);
  return cartResponse(lines);
}

export async function POST(request: NextRequest) {
  const lines = parseCart(request.cookies.get(CART_COOKIE)?.value);
  const body = (await request.json()) as { productId?: string; variantId?: string; quantity?: number };
  const productId = body.productId;
  const variantId = body.variantId;
  const quantity = body.quantity ?? 1;

  if (!productId || quantity <= 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const existing = lines.find((line) => line.productId === productId && (line.variantId ?? null) === (variantId ?? null));
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  try {
    await assertProductQuantityAvailable(productId, nextQuantity, variantId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Estoque insuficiente" }, { status: 400 });
  }

  if (existing) {
    existing.quantity += quantity;
  } else {
    lines.push({ productId, variantId, quantity });
  }

  return cartResponse(lines);
}

export async function PATCH(request: NextRequest) {
  const lines = parseCart(request.cookies.get(CART_COOKIE)?.value);
  const body = (await request.json()) as { productId?: string; variantId?: string; quantity?: number };
  const productId = body.productId;
  const variantId = body.variantId;
  const quantity = body.quantity;

  if (!productId || typeof quantity !== "number" || !Number.isInteger(quantity)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (quantity > 0) {
    try {
      await assertProductQuantityAvailable(productId, quantity, variantId);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Estoque insuficiente" }, { status: 400 });
    }
  }

  const next = quantity <= 0
    ? lines.filter((line) => !(line.productId === productId && (line.variantId ?? null) === (variantId ?? null)))
    : lines.map((line) => {
      if (!(line.productId === productId && (line.variantId ?? null) === (variantId ?? null))) return line;
      return { ...line, quantity };
    });

  return cartResponse(next);
}

export async function DELETE(request: NextRequest) {
  const lines = parseCart(request.cookies.get(CART_COOKIE)?.value);
  const productId = new URL(request.url).searchParams.get("productId");
  const variantId = new URL(request.url).searchParams.get("variantId") || undefined;

  if (!productId) {
    return cartResponse([]);
  }

  const next = lines.filter((line) => !(line.productId === productId && (line.variantId ?? null) === (variantId ?? null)));
  return cartResponse(next);
}

