export const TRACKING_CONSENT_COOKIE = "jj_tracking_consent";

export type TrackingConsent = "accepted" | "rejected";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

function readCookieValue(cookieString: string, name: string) {
  return cookieString
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function getTrackingConsent(cookieString?: string): TrackingConsent | null {
  const source = typeof cookieString === "string"
    ? cookieString
    : typeof document !== "undefined"
      ? document.cookie
      : "";

  const value = readCookieValue(source, TRACKING_CONSENT_COOKIE);

  if (value === "accepted" || value === "rejected") {
    return value;
  }

  return null;
}

export function setTrackingConsent(value: TrackingConsent) {
  if (typeof document === "undefined") return;

  document.cookie = `${TRACKING_CONSENT_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
}

function trackEvent(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined" || getTrackingConsent() !== "accepted") {
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", event, payload);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, ...payload });
}

export function trackViewItem(item: AnalyticsItem, currency = "BRL") {
  trackEvent("view_item", {
    currency,
    value: item.price,
    ecommerce: {
      currency,
      value: item.price,
      items: [item],
    },
    items: [item],
  });
}

export function trackAddToCart(item: AnalyticsItem, currency = "BRL") {
  const quantity = item.quantity ?? 1;
  const value = Number((item.price * quantity).toFixed(2));

  trackEvent("add_to_cart", {
    currency,
    value,
    ecommerce: {
      currency,
      value,
      items: [{ ...item, quantity }],
    },
    items: [{ ...item, quantity }],
  });
}

export function trackViewCart(items: AnalyticsItem[], value: number, currency = "BRL") {
  trackEvent("view_cart", {
    currency,
    value,
    ecommerce: {
      currency,
      value,
      items,
    },
    items,
  });
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number, currency = "BRL") {
  trackEvent("begin_checkout", {
    currency,
    value,
    ecommerce: {
      currency,
      value,
      items,
    },
    items,
  });
}

export function trackPurchase(payload: {
  transactionId: string;
  items: AnalyticsItem[];
  value: number;
  shipping?: number;
  coupon?: string | null;
  currency?: string;
}) {
  const currency = payload.currency ?? "BRL";

  trackEvent("purchase", {
    transaction_id: payload.transactionId,
    currency,
    value: payload.value,
    shipping: payload.shipping ?? 0,
    coupon: payload.coupon || undefined,
    ecommerce: {
      transaction_id: payload.transactionId,
      currency,
      value: payload.value,
      shipping: payload.shipping ?? 0,
      coupon: payload.coupon || undefined,
      items: payload.items,
    },
    items: payload.items,
  });
}