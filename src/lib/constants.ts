export const STORE_NAME = "JoJoias";
export const DEFAULT_COUNTRY = "Brasil";
export const DEFAULT_SHIPPING_COST = 0;
export const CART_COOKIE = "ecommerce_cart";

export const ORDER_STATUS_TRANSITIONS = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
} as const;

export type OrderStatusKey = keyof typeof ORDER_STATUS_TRANSITIONS;