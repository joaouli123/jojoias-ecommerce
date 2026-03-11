"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { ShippingQuote } from "@/lib/shipping";
import type { AppliedCoupon } from "@/lib/coupons";

type CheckoutTotalsSummaryProps = {
  subtotal: number;
  pixDiscountPercent: number;
};

export function CheckoutTotalsSummary({ subtotal, pixDiscountPercent }: CheckoutTotalsSummaryProps) {
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARD" | "BOLETO">("PIX");

  useEffect(() => {
    function handleShippingUpdate(event: Event) {
      const customEvent = event as CustomEvent<ShippingQuote | null>;
      setQuote(customEvent.detail ?? null);
    }

    function handleCouponUpdate(event: Event) {
      const customEvent = event as CustomEvent<AppliedCoupon | null>;
      setCoupon(customEvent.detail ?? null);
    }

    function handlePaymentUpdate(event: Event) {
      const customEvent = event as CustomEvent<{ method?: "PIX" | "CARD" | "BOLETO" }>;
      setPaymentMethod(customEvent.detail?.method ?? "PIX");
    }

    window.addEventListener("shipping:updated", handleShippingUpdate as EventListener);
    window.addEventListener("coupon:updated", handleCouponUpdate as EventListener);
    window.addEventListener("payment:updated", handlePaymentUpdate as EventListener);

    return () => {
      window.removeEventListener("shipping:updated", handleShippingUpdate as EventListener);
      window.removeEventListener("coupon:updated", handleCouponUpdate as EventListener);
      window.removeEventListener("payment:updated", handlePaymentUpdate as EventListener);
    };
  }, []);

  const paymentDiscount = useMemo(() => {
    if (paymentMethod !== "PIX") return 0;
    return Number((((subtotal + (quote?.amount ?? 0) - (coupon?.discount ?? 0)) * pixDiscountPercent) / 100).toFixed(2));
  }, [paymentMethod, pixDiscountPercent, quote, subtotal, coupon]);

  const total = useMemo(
    () => subtotal + (quote?.amount ?? 0) - (coupon?.discount ?? 0) - paymentDiscount,
    [subtotal, quote, coupon, paymentDiscount],
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <dt className="text-zinc-500">Frete</dt>
        <dd className={`font-semibold ${quote?.isFree ? "text-emerald-600" : "text-zinc-900"}`}>
          {quote ? formatCurrency(quote.amount) : "A calcular"}
        </dd>
      </div>

      {coupon ? (
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500">Cupom ({coupon.code})</dt>
          <dd className="font-semibold text-emerald-700">- {formatCurrency(coupon.discount)}</dd>
        </div>
      ) : null}

      {paymentDiscount > 0 ? (
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500">Desconto Pix</dt>
          <dd className="font-semibold text-emerald-700">- {formatCurrency(paymentDiscount)}</dd>
        </div>
      ) : null}

      {quote ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3 text-xs text-zinc-600">
          <p className="font-semibold text-zinc-900">{quote.service}</p>
          <p className="mt-1">Entrega estimada em até {quote.estimatedDays} dias úteis para {quote.region}.</p>
          {!quote.isFree && quote.missingForFree > 0 ? (
            <p className="mt-1 text-emerald-700">Faltam {formatCurrency(quote.missingForFree)} para frete grátis.</p>
          ) : null}
          {coupon ? <p className="mt-1 text-emerald-700">Desconto de {formatCurrency(coupon.discount)} aplicado com {coupon.code}.</p> : null}
          {paymentDiscount > 0 ? <p className="mt-1 text-emerald-700">Pagamento via Pix garante mais {formatCurrency(paymentDiscount)} de desconto.</p> : null}
        </div>
      ) : coupon || paymentDiscount > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3 text-xs text-zinc-600">
          <p className="font-semibold text-zinc-900">Descontos aplicados</p>
          {coupon ? <p className="mt-1 text-emerald-700">Desconto de {formatCurrency(coupon.discount)} confirmado com {coupon.code}.</p> : null}
          {paymentDiscount > 0 ? <p className="mt-1 text-emerald-700">Pix ativo com redução de {formatCurrency(paymentDiscount)}.</p> : null}
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-3">
        <dt className="text-base font-bold text-zinc-900">Total</dt>
        <dd className="text-2xl font-black text-zinc-950">{formatCurrency(total)}</dd>
      </div>
    </>
  );
}