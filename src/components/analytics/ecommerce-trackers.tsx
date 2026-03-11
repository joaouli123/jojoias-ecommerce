"use client";

import { useEffect } from "react";
import type { AnalyticsItem } from "@/lib/analytics";
import { trackBeginCheckout, trackPurchase, trackViewCart, trackViewItem } from "@/lib/analytics";

export function ProductViewTracker({ item }: { item: AnalyticsItem }) {
  useEffect(() => {
    trackViewItem(item);
  }, [item]);

  return null;
}

export function CartViewTracker({ items, value }: { items: AnalyticsItem[]; value: number }) {
  useEffect(() => {
    if (!items.length) return;
    trackViewCart(items, value);
  }, [items, value]);

  return null;
}

export function CheckoutTracker({ checkoutToken, items, value }: { checkoutToken: string; items: AnalyticsItem[]; value: number }) {
  useEffect(() => {
    if (!items.length || typeof window === "undefined") return;

    const key = `jj_begin_checkout_${checkoutToken}`;
    if (window.sessionStorage.getItem(key)) return;

    trackBeginCheckout(items, value);
    window.sessionStorage.setItem(key, "1");
  }, [checkoutToken, items, value]);

  return null;
}

export function PurchaseTracker(props: {
  orderId: string;
  items: AnalyticsItem[];
  value: number;
  shipping: number;
  coupon?: string | null;
}) {
  const { orderId, items, value, shipping, coupon } = props;

  useEffect(() => {
    if (!items.length || typeof window === "undefined") return;

    const key = `jj_purchase_${orderId}`;
    if (window.localStorage.getItem(key)) return;

    trackPurchase({
      transactionId: orderId,
      items,
      value,
      shipping,
      coupon,
    });

    window.localStorage.setItem(key, "1");
  }, [coupon, items, orderId, shipping, value]);

  return null;
}