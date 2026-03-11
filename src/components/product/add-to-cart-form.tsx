"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { trackAddToCart } from "@/lib/analytics";

type ProductVariantOption = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type AddToCartFormProps = {
  product: {
    id: string;
    name: string;
    price: number;
    brand: string | null;
    category: string;
  };
  variants: ProductVariantOption[];
  totalAvailableQuantity: number;
};

export function AddToCartForm({ product, variants, totalAvailableQuantity }: AddToCartFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVariant = variants.find((variant) => variant.id === variantId);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);

        if (variants.length && !variantId) {
          setErrorMessage("Selecione uma variação para continuar.");
          return;
        }

        setIsSubmitting(true);

        try {
          const response = await fetch("/api/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: product.id,
              quantity,
              variantId: variantId || undefined,
            }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(payload?.error || "Não foi possível adicionar ao carrinho.");
          }

          trackAddToCart({
            item_id: selectedVariant ? `${product.id}:${selectedVariant.id}` : product.id,
            item_name: product.name,
            item_brand: product.brand ?? undefined,
            item_category: product.category,
            item_variant: selectedVariant?.name,
            price: selectedVariant?.price ?? product.price,
            quantity,
          });

          router.push("/checkout");
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Não foi possível adicionar ao carrinho.");
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="flex flex-col gap-3"
    >
      {variants.length ? (
        <div className="space-y-2">
          <label htmlFor="variantId" className="text-sm font-semibold text-zinc-900">Escolha a variação</label>
          <select
            id="variantId"
            name="variantId"
            required
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
            className="h-[50px] w-full rounded-[10px] border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 outline-none focus:border-[#D4AF37]"
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={variant.quantity <= 0}>
                {variant.name} — {formatCurrency(variant.price)} {variant.quantity > 0 ? `(${variant.quantity} disponíveis)` : "(indisponível)"}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-row items-center gap-2">
        <div className="h-[50px] w-[110px] rounded-[10px] border border-zinc-300 bg-zinc-50 flex items-center justify-center px-3 shrink-0">
          <input
            type="number"
            name="quantity"
            min={1}
            max={Math.max(totalAvailableQuantity, 1)}
            value={quantity}
            onChange={(event) => {
              const nextQuantity = Number(event.target.value);
              setQuantity(Number.isFinite(nextQuantity) && nextQuantity > 0 ? Math.floor(nextQuantity) : 1);
            }}
            className="w-full text-center text-[20px] font-semibold text-zinc-900 bg-transparent outline-none"
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="flex-1 h-[50px] text-[16px] font-bold tracking-tight bg-[#111827] hover:bg-[#111827]/90 text-white shadow-none rounded-[10px] transition-colors uppercase disabled:opacity-70">
          <ShoppingCart className="mr-2 h-5 w-5" /> Comprar Agora
        </Button>
      </div>

      {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}
    </form>
  );
}