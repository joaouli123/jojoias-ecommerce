"use client";

import { useMemo, useState } from "react";
import { Loader2, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { AppliedCoupon } from "@/lib/coupons";

type CheckoutCouponFieldProps = {
  subtotal: number;
  brandSlugs?: string[];
  categorySlugs?: string[];
  customerOrderCount?: number;
  inputName?: string;
  compact?: boolean;
};

function emitCouponUpdate(coupon: AppliedCoupon | null) {
  window.dispatchEvent(new CustomEvent("coupon:updated", { detail: coupon }));
}

export function CheckoutCouponField({ subtotal, brandSlugs, categorySlugs, customerOrderCount, inputName = "couponCode", compact = false }: CheckoutCouponFieldProps) {
  const [code, setCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const normalizedCode = useMemo(() => code.trim().toUpperCase(), [code]);
  const isSubmitDisabled = isLoading || !normalizedCode;
  const couponStatusId = compact ? "checkout-coupon-status-compact" : "checkout-coupon-status";
  const couponErrorId = compact ? "checkout-coupon-error-compact" : "checkout-coupon-error";

  async function handleApplyCoupon() {
    if (!normalizedCode) {
      setError("Digite um cupom para aplicar.");
      setMessage("");
      setAppliedCoupon(null);
      emitCouponUpdate(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode, subtotal, brandSlugs, categorySlugs, customerOrderCount }),
      });

      const payload = (await response.json()) as { error?: string; coupon?: AppliedCoupon };

      if (!response.ok || !payload.coupon) {
        setAppliedCoupon(null);
        emitCouponUpdate(null);
        setError(payload.error ?? "Não foi possível validar o cupom.");
        return;
      }

      setAppliedCoupon(payload.coupon);
      emitCouponUpdate(payload.coupon);
      setMessage(`Cupom aplicado: ${payload.coupon.code} • desconto de ${formatCurrency(payload.coupon.discount)}.`);
    } catch {
      setAppliedCoupon(null);
      emitCouponUpdate(null);
      setError("Não foi possível validar o cupom.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setMessage("Cupom removido do pedido.");
    setError("");
    emitCouponUpdate(null);
  }

  return (
    <section className={compact ? "" : "rounded-2xl border border-zinc-200 bg-white p-5 md:p-6"} aria-labelledby={compact ? undefined : "checkout-coupon-heading"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={compact ? undefined : "checkout-coupon-heading"} className={`${compact ? "text-sm" : "text-xl"} font-medium font-serif text-[#1A1A1A]`}>Cupom de desconto</h2>
          {!compact ? <p className="mt-1 text-sm text-[#666666]">Aplique códigos promocionais antes de finalizar o pedido.</p> : null}
        </div>
        <Tag className={`text-[#D4AF37] ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
      </div>

      <input type="hidden" name={inputName} value={appliedCoupon?.code ?? ""} />

      <div className={`mt-4 flex gap-3 ${compact ? "flex-col" : "flex-col sm:flex-row"}`}>
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E5E5E5]" />
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Ex.: PRIM10"
            aria-label="Código do cupom"
            aria-describedby={message ? couponStatusId : error ? couponErrorId : undefined}
            className="h-14 w-full rounded-[20px] border border-zinc-200 bg-white pl-10 pr-4 text-sm uppercase outline-none transition-colors focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleApplyCoupon()}
          disabled={isSubmitDisabled}
          className={`inline-flex h-14 items-center justify-center rounded-[20px] px-5 text-sm font-medium font-serif text-white transition-colors ${isSubmitDisabled ? "cursor-not-allowed bg-zinc-300 text-white" : "bg-[#111111] hover:bg-[#111111]/90"} ${compact ? "w-full" : ""}`}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar cupom"}
        </button>
      </div>

      {appliedCoupon ? (
        <div className={`mt-4 rounded-xl border border-emerald-200 bg-emerald-50 ${compact ? "p-3 text-xs" : "p-4 text-sm"}`}>
          <p className="font-semibold text-emerald-800">{appliedCoupon.code} ativo no pedido</p>
          <p className="mt-1 text-emerald-700">Desconto confirmado de {formatCurrency(appliedCoupon.discount)}.</p>
          {appliedCoupon.description ? <p className="mt-1 text-emerald-700">{appliedCoupon.description}</p> : null}
          <button type="button" onClick={handleRemoveCoupon} className="mt-3 text-xs font-medium font-serif uppercase tracking-wide text-emerald-800 hover:text-emerald-950">
            Remover cupom
          </button>
        </div>
      ) : null}

      {message ? <p id={couponStatusId} className={`mt-3 font-medium text-[#666666] ${compact ? "text-xs" : "text-sm"}`} aria-live="polite" aria-atomic="true">{message}</p> : null}
      {error ? <p id={couponErrorId} className={`mt-3 font-medium text-red-600 ${compact ? "text-xs" : "text-sm"}`} role="alert">{error}</p> : null}
    </section>
  );
}