"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ShippingQuote } from "@/lib/shipping";
import { readStoredShippingSelection, writeStoredShippingSelection } from "@/lib/shipping-session";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatZipcode(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

type CartSummaryProps = {
  subtotal: number;
  itemsCount: number;
};

export function CartSummary({ subtotal, itemsCount }: CartSummaryProps) {
  const [zipcode, setZipcode] = useState("");
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [options, setOptions] = useState<ShippingQuote[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState("standard");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const total = useMemo(() => subtotal + (quote?.amount ?? 0), [subtotal, quote]);

  const calculate = useCallback(async (rawZipcode: string, preferredOptionId?: string) => {
    const digits = onlyDigits(rawZipcode);

    if (digits.length !== 8) {
      setError("Informe um CEP válido.");
      setQuote(null);
      setOptions([]);
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipcode: digits, subtotal, itemsCount }),
      });

      const payload = (await response.json()) as { error?: string; quote?: ShippingQuote; options?: ShippingQuote[] };
      if (!response.ok || !payload.quote) {
        setError(payload.error ?? "Não foi possível calcular o frete agora.");
        setQuote(null);
        setOptions([]);
        return;
      }

      const nextOptions = payload.options ?? [payload.quote];
      const nextSelected = nextOptions.find((option) => option.id === preferredOptionId) ?? nextOptions[0];

      setOptions(nextOptions);
      setSelectedOptionId(nextSelected.id);
      setQuote(nextSelected);
      setMessage(nextSelected.isFree ? "Frete grátis liberado para este pedido." : "Frete calculado no carrinho.");
      writeStoredShippingSelection({ zipcode: digits, optionId: nextSelected.id });
    } catch {
      setError("Não foi possível calcular o frete agora.");
      setQuote(null);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [itemsCount, subtotal]);

  useEffect(() => {
    const saved = readStoredShippingSelection();
    if (!saved?.zipcode) return;

    const formatted = formatZipcode(saved.zipcode);
    setZipcode(formatted);
    void calculate(formatted, saved.optionId);
  }, [calculate]);

  function handleOptionChange(optionId: string) {
    setSelectedOptionId(optionId);
    const selected = options.find((option) => option.id === optionId) ?? null;
    setQuote(selected);
    if (selected) {
      writeStoredShippingSelection({ zipcode: selected.zipcode, optionId: selected.id });
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
      <h2 className="mb-6 text-xl font-bold text-zinc-950">Resumo do Pedido</h2>

      <dl className="flex flex-col gap-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500">Subtotal ({itemsCount} itens)</dt>
          <dd className="font-semibold text-zinc-900">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500">Frete</dt>
          <dd className="font-semibold text-zinc-900">{quote ? formatCurrency(quote.amount) : "A calcular"}</dd>
        </div>
        <div className="my-2 border-t border-zinc-200 pt-4 flex items-center justify-between">
          <dt className="text-base font-bold text-zinc-900">Total a pagar</dt>
          <dd className="text-2xl font-black text-zinc-950">{formatCurrency(total)}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Calcular frete no carrinho</p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={zipcode}
            onChange={(event) => setZipcode(formatZipcode(event.target.value))}
            placeholder="00000-000"
            className="h-12 flex-1 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
          />
          <button
            type="button"
            onClick={() => void calculate(zipcode, selectedOptionId)}
            disabled={isLoading}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#111111] text-white transition-colors hover:bg-[#111111]/90 disabled:opacity-60"
          >
            <Truck className="h-4 w-4" />
          </button>
        </div>

        {options.length ? (
          <div className="mt-4 space-y-2">
            {options.map((option) => (
              <label key={option.id} className={`block cursor-pointer rounded-xl border p-3 transition-colors ${selectedOptionId === option.id ? "border-[#D4AF37] bg-zinc-50" : "border-zinc-200"}`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="cartShippingOption"
                    checked={selectedOptionId === option.id}
                    onChange={() => handleOptionChange(option.id)}
                    className="mt-0.5 accent-[#111111]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-zinc-900">{option.service}</span>
                      <span className="font-semibold text-zinc-900">{formatCurrency(option.amount)}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{option.region} • até {option.estimatedDays} dias úteis.</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        ) : null}

        {message ? <p className="mt-3 text-xs font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-xs font-medium text-red-600">{error}</p> : null}
      </div>

      <div className="mt-8 space-y-4">
        <Link href="/checkout">
          <Button size="lg" className="w-full h-14 text-base font-bold bg-[#111111] hover:bg-[#111111]/90 shadow-none">
            Finalizar Compra Segura <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}