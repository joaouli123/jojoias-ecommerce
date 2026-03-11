"use client";

import { useEffect, useMemo, useState } from "react";
import { Truck } from "lucide-react";
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

type ProductShippingEstimatorProps = {
  subtotal: number;
};

export function ProductShippingEstimator({ subtotal }: ProductShippingEstimatorProps) {
  const [zipcode, setZipcode] = useState("");
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const zipcodeDigits = useMemo(() => onlyDigits(zipcode), [zipcode]);

  useEffect(() => {
    const saved = readStoredShippingSelection();
    if (saved?.zipcode) {
      setZipcode(formatZipcode(saved.zipcode));
    }
  }, []);

  async function handleSubmit() {
    if (zipcodeDigits.length !== 8) {
      setError("Informe um CEP válido.");
      setQuote(null);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipcode: zipcodeDigits, subtotal, itemsCount: 1 }),
      });

      const payload = (await response.json()) as { error?: string; quote?: ShippingQuote };

      if (!response.ok || !payload.quote) {
        setQuote(null);
        setError(payload.error ?? "Não foi possível calcular o frete agora.");
        return;
      }

      setQuote(payload.quote);
      writeStoredShippingSelection({ zipcode: zipcodeDigits, optionId: payload.quote.id });
    } catch {
      setQuote(null);
      setError("Não foi possível calcular o frete agora.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[15px] font-bold text-[#111827]">Calcular Frete</span>
      <div className="flex flex-row gap-2 w-full">
        <input
          type="text"
          inputMode="numeric"
          value={zipcode}
          onChange={(event) => setZipcode(formatZipcode(event.target.value))}
          placeholder="00000-000"
          className="h-[52px] flex-1 min-w-0 rounded-[8px] border border-zinc-200 outline-none focus:border-[#111827] text-[15px] text-[#111111] placeholder:text-zinc-400 px-4"
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-[52px] h-[52px] shrink-0 bg-[#111827] hover:bg-[#111827]/90 text-white shadow-none rounded-[8px] transition-colors p-0 flex items-center justify-center disabled:opacity-60"
        >
          <Truck className="w-5 h-5" />
        </Button>
      </div>

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

      {quote ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-900">{quote.service} • {formatCurrency(quote.amount)}</p>
          <p className="mt-1">Entrega estimada em até {quote.estimatedDays} dias úteis para {quote.region}.</p>
          {!quote.isFree && quote.missingForFree > 0 ? (
            <p className="mt-1 text-emerald-700">Adicione mais {formatCurrency(quote.missingForFree)} para liberar frete grátis.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}