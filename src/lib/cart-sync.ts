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

const EMPTY_CART_STATE: CartStatePayload = {
  items: [],
  subtotal: 0,
  shipping: 0,
  total: 0,
};

let latestCartState: CartStatePayload = EMPTY_CART_STATE;
let inFlightCartRequest: Promise<CartStatePayload> | null = null;

export function getEmptyCartState(): CartStatePayload {
  return EMPTY_CART_STATE;
}

export function getLatestCartState(): CartStatePayload {
  return latestCartState;
}

export function primeCartState(payload: CartStatePayload) {
  latestCartState = payload;
}

export async function fetchCartState(force = false): Promise<CartStatePayload> {
  if (!force && inFlightCartRequest) {
    return inFlightCartRequest;
  }

  if (!force && latestCartState.items.length > 0) {
    return latestCartState;
  }

  inFlightCartRequest = fetch("/api/cart", { method: "GET", cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        return latestCartState;
      }

      const payload = (await response.json()) as CartStatePayload;
      latestCartState = payload;
      return payload;
    })
    .finally(() => {
      inFlightCartRequest = null;
    });

  return inFlightCartRequest;
}

export function dispatchCartUpdated(payload: CartStatePayload) {
  if (typeof window === "undefined") return;

  latestCartState = payload;
  window.dispatchEvent(new CustomEvent<CartStatePayload>(CART_UPDATED_EVENT, { detail: payload }));
}