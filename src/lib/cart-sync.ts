export const CART_UPDATED_EVENT = "luxijoias:cart-updated";

export type CartStateItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  variantName: string | null;
};

export type CartStatePayload = {
  items: CartStateItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

export function dispatchCartUpdated(payload: CartStatePayload) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent<CartStatePayload>(CART_UPDATED_EVENT, { detail: payload }));
}