"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackAddToCart } from "@/lib/analytics";

type ProductVariantOption = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isActive: boolean;
  image?: string | null;
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
  initialVariantId?: string | null;
  onVariantChange?: (variant: ProductVariantOption | null) => void;
};

const colorMap: Record<string, string> = {
  dourado: "#D4AF37",
  dourada: "#D4AF37",
  ouro: "#D4AF37",
  prata: "#C0C0C0",
  prateado: "#C0C0C0",
  marrom: "#6F4E37",
  rose: "#B76E79",
  rosé: "#B76E79",
  rosa: "#E7A6B5",
  preto: "#18181B",
  "preto fosco": "#27272A",
  branco: "#F5F5F5",
  branca: "#F5F5F5",
  cristal: "#E7EEF7",
  azul: "#70A5FF",
  verde: "#5DBB87",
};

function normalizeVariant(option: ProductVariantOption) {
  const match = option.name.match(/^([^:]+):\s*(.+)$/);
  const rawType = match?.[1]?.trim().toLowerCase() ?? "opção";
  const label = match?.[2]?.trim() ?? option.name;

  return {
    ...option,
    type: rawType,
    label,
    unavailable: option.quantity <= 0 || !option.isActive,
  };
}

function colorForLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  return colorMap[normalized] ?? colorMap[normalized.split(" ")[0]] ?? null;
}

export function AddToCartForm({
  product,
  variants,
  totalAvailableQuantity,
  initialVariantId,
  onVariantChange,
}: AddToCartFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(initialVariantId ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedVariants = useMemo(() => variants.map(normalizeVariant), [variants]);
  const hasAvailableVariant = useMemo(
    () => normalizedVariants.some((variant) => !variant.unavailable),
    [normalizedVariants],
  );
  const selectedVariant = useMemo(
    () => normalizedVariants.find((variant) => variant.id === variantId) ?? null,
    [normalizedVariants, variantId],
  );

  useEffect(() => {
    setVariantId(initialVariantId ?? "");
  }, [initialVariantId]);

  useEffect(() => {
    if (!normalizedVariants.length) {
      setVariantId("");
      return;
    }

    const currentVariant = normalizedVariants.find((variant) => variant.id === variantId);
    if (!currentVariant || currentVariant.unavailable) {
      const firstAvailable = normalizedVariants.find((variant) => !variant.unavailable) ?? null;
      setVariantId(firstAvailable?.id ?? "");
    }
  }, [normalizedVariants, variantId]);

  const sharedType = normalizedVariants.length
    ? normalizedVariants.every((variant) => variant.type === normalizedVariants[0]?.type)
      ? normalizedVariants[0]?.type
      : "opção"
    : null;

  useEffect(() => {
    if (!onVariantChange) return;
    onVariantChange(selectedVariant ?? null);
  }, [onVariantChange, selectedVariant?.id]);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);

        if (variants.length && !variantId) {
          setErrorMessage(hasAvailableVariant ? "Selecione uma variação para continuar." : "Todas as variações estão indisponíveis no momento.");
          return;
        }

        if (selectedVariant?.unavailable) {
          setErrorMessage("A variação escolhida está indisponível no momento.");
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
      {normalizedVariants.length ? (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-900">
            {sharedType === "cor"
              ? "Escolha a cor"
              : sharedType === "tamanho"
                ? "Escolha o tamanho"
                : sharedType?.includes("letra")
                  ? "Escolha a letra cravejada"
                  : "Escolha a variação"}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {normalizedVariants.map((variant) => {
              const selected = variant.id === variantId;
              const unavailable = variant.unavailable;
              const swatchColor = variant.type === "cor" ? colorForLabel(variant.label) : null;

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    if (unavailable) {
                      return;
                    }

                    setErrorMessage(null);
                    setVariantId(variant.id);
                  }}
                  disabled={unavailable}
                  aria-label={unavailable ? `${variant.label} indisponível` : `Selecionar ${variant.label}`}
                  title={unavailable ? `${variant.label} indisponível` : variant.label}
                  aria-pressed={selected}
                  className={`group relative rounded-full transition focus:outline-none focus-visible:outline-none ${unavailable ? "cursor-not-allowed" : ""}`}
                >
                  {variant.type === "cor" ? (
                    <>
                      <span className={`relative flex h-9 w-9 items-center justify-center rounded-full border p-[2px] transition ${selected ? "border-[#E7C96A] bg-[#FFF9E8]" : "border-zinc-200 bg-white hover:border-zinc-300"} ${unavailable ? "border-zinc-200 bg-zinc-100 opacity-50" : ""}`}>
                        <span
                          className={`h-full w-full rounded-full border ${selected ? "border-[#F4E5B1]" : "border-zinc-200"}`}
                          style={{ backgroundColor: swatchColor || "#ffffff" }}
                        />
                        {unavailable ? (
                          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/25 text-zinc-600">
                            <X className="h-4 w-4 stroke-[2.4]" />
                          </span>
                        ) : null}
                      </span>
                      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
                        {unavailable ? `${variant.label} indisponível` : variant.label}
                      </span>
                    </>
                  ) : (
                    <span className={`inline-flex min-h-11 min-w-[72px] items-center justify-center gap-1 rounded-full border px-3 py-2 text-sm font-medium transition ${selected ? "border-[#D4AF37] bg-[#D4AF37] text-[#111827]" : "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-500"} ${unavailable ? "border-zinc-200 bg-zinc-100 text-zinc-400 line-through opacity-70" : ""}`}>
                      {unavailable ? <X className="h-3.5 w-3.5 shrink-0" /> : null}
                      <span>{variant.label}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {selectedVariant ? (
            <p className="text-sm text-zinc-600">
              Selecionado: <span className="font-semibold text-zinc-900">{selectedVariant.label}</span>
            </p>
          ) : !hasAvailableVariant ? (
            <p className="text-sm text-amber-700">Nenhuma variação disponível no momento.</p>
          ) : null}
          <input type="hidden" name="variantId" value={variantId} />
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

        <Button type="submit" disabled={isSubmitting || (normalizedVariants.length > 0 && !hasAvailableVariant)} className="flex-1 h-[50px] text-[16px] font-bold tracking-tight bg-[#111827] hover:bg-[#111827]/90 text-white shadow-none rounded-[10px] transition-colors uppercase disabled:opacity-70">
          <ShoppingCart className="mr-2 h-5 w-5" /> Comprar Agora
        </Button>
      </div>

      {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}
    </form>
  );
}