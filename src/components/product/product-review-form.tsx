"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { submitReviewAction } from "@/actions/reviews";

type ProductReviewFormProps = {
  productId: string;
  canReview: boolean;
  isAuthenticated: boolean;
};

export function ProductReviewForm({ productId, canReview, isAuthenticated }: ProductReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await submitReviewAction(formData);
        setMessage("Avaliação enviada com sucesso.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Não foi possível enviar a avaliação.");
      }
    });
  }

  if (!isAuthenticated) {
    return <p className="text-sm text-zinc-500">Faça <Link href="/login" className="font-semibold text-[#D4AF37]">login</Link> para avaliar este produto.</p>;
  }

  if (!canReview) {
    return <p className="text-sm text-zinc-500">A avaliação fica disponível para clientes que já compraram este produto.</p>;
  }

  return (
    <form action={onSubmit} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const active = starValue <= rating;
          return (
            <button key={starValue} type="button" onClick={() => setRating(starValue)} className="text-[#facc15]">
              <Star className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        <input name="title" placeholder="Título da avaliação (opcional)" className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
        <textarea name="content" required rows={4} placeholder="Conte como foi sua experiência com o produto" className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
      </div>

      {message ? <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

      <button type="submit" disabled={isPending} className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#111111] px-5 text-sm font-bold text-white hover:bg-[#111111]/90 disabled:opacity-70">
        {isPending ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}