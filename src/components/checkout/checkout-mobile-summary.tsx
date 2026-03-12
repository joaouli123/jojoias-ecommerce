"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CheckoutTotalsSummary } from "@/components/checkout/checkout-totals-summary";
import type { HydratedCartItem } from "@/lib/store-data";

type CheckoutMobileSummaryProps = {
  items: HydratedCartItem[];
  subtotal: number;
  pixDiscountPercent: number;
};

export function CheckoutMobileSummary({ items, subtotal, pixDiscountPercent }: CheckoutMobileSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-[#FFFFFF] p-5 lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <p className="text-base font-medium font-serif text-[#1A1A1A]">Resumo do pedido</p>
          <p className="mt-1 text-xs font-medium text-[#666666]">{isOpen ? "Toque para recolher" : "Toque para expandir"}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#666666]">{formatCurrency(subtotal)}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white">
            <ChevronDown className={`h-4 w-4 text-[#666666] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId ?? "base"}`} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#1A1A1A]">{item.name}</p>
                {item.variantName ? <p className="text-[#666666]">Variação: {item.variantName}</p> : null}
                <p className="text-[#666666]">Qtd: {item.quantity}</p>
              </div>
              <span className="whitespace-nowrap font-medium font-serif text-[#1A1A1A]">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}

          <div className="border-t border-zinc-200 pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#666666]">Subtotal</span>
              <span className="font-semibold text-[#1A1A1A]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-2">
              <dl className="space-y-2">
                <CheckoutTotalsSummary subtotal={subtotal} pixDiscountPercent={pixDiscountPercent} />
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}