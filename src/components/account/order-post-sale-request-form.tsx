"use client";

import { useState, useTransition } from "react";
import { requestOrderPostSaleAction } from "@/actions/orders";

type OrderPostSaleRequestFormProps = {
  orderId: string;
  maxAmount: number;
};

export function OrderPostSaleRequestForm({ orderId, maxAmount }: OrderPostSaleRequestFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await requestOrderPostSaleAction(orderId, formData);
        setMessage("Solicitação enviada. Nossa equipe vai analisar o pedido e atualizar o status nesta página.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Não foi possível abrir a solicitação agora.");
      }
    });
  }

  return (
    <form action={onSubmit} className="mt-4 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="space-y-2">
        <label htmlFor="requestReason" className="text-sm font-semibold text-zinc-900">Motivo da solicitação</label>
        <textarea
          id="requestReason"
          name="requestReason"
          rows={4}
          required
          minLength={10}
          placeholder="Descreva o motivo da devolução, troca ou suporte necessário."
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="requestedAmount" className="text-sm font-semibold text-zinc-900">Valor estimado do reembolso, se aplicável</label>
        <input
          id="requestedAmount"
          name="requestedAmount"
          type="number"
          min="0.01"
          max={maxAmount}
          step="0.01"
          placeholder="Opcional"
          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
        />
        <p className="text-xs text-zinc-500">Máximo disponível para este pedido: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(maxAmount)}</p>
      </div>

      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button type="submit" disabled={isPending} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#111111] px-5 text-sm font-bold text-white hover:bg-[#111111]/90 disabled:opacity-70">
        {isPending ? "Enviando..." : "Solicitar análise"}
      </button>
    </form>
  );
}