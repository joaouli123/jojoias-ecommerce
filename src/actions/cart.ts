"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
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

async function readCartLines() {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

async function writeCartLines(lines: CartLine[]) {
  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getCartAction() {
  const lines = await readCartLines();
  const items = await hydrateCart(lines);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    items,
    subtotal,
    shipping: 0,
    total: subtotal,
  };
}

export async function addToCartAction(productId: string, quantity = 1, variantId?: string) {
  if (!productId || quantity <= 0) return;

  const lines = await readCartLines();
  const existing = lines.find((line) => line.productId === productId && (line.variantId ?? null) === (variantId ?? null));
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  await assertProductQuantityAvailable(productId, nextQuantity, variantId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    lines.push({ productId, variantId, quantity });
  }

  await writeCartLines(lines);
  revalidatePath("/cart");
}

export async function updateCartItemAction(productId: string, quantity: number, variantId?: string) {
  if (!productId) return;

   if (quantity > 0) {
    await assertProductQuantityAvailable(productId, quantity, variantId);
  }

  const lines = await readCartLines();
  const next = quantity <= 0 ? lines.filter((line) => !(line.productId === productId && (line.variantId ?? null) === (variantId ?? null))) : lines.map((line) => {
    if (!(line.productId === productId && (line.variantId ?? null) === (variantId ?? null))) return line;
    return { ...line, quantity };
  });

  await writeCartLines(next);
  revalidatePath("/cart");
}

export async function removeFromCartAction(productId: string, variantId?: string) {
  if (!productId) return;

  const lines = await readCartLines();
  const next = lines.filter((line) => !(line.productId === productId && (line.variantId ?? null) === (variantId ?? null)));

  await writeCartLines(next);
  revalidatePath("/cart");
}

export async function clearCartAction() {
  await writeCartLines([]);
  revalidatePath("/cart");
}

