"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { dispatchCartUpdated, type CartStatePayload } from "@/lib/cart-sync"
import { PixIcon, WhatsAppIcon } from "@/components/ui/icons"
import { FavoriteButton } from "@/components/product/favorite-button"
import { getProductPath } from "@/lib/product-url"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    categorySlug?: string | null
    price: number
    comparePrice?: number | null
    image: string
    category: string
    variantId?: string | null
    requiresSelection?: boolean
    whatsappBaseUrl?: string
  }
  pixIconClassName?: string
}

export function ProductCard({ product, pixIconClassName }: ProductCardProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [showCartNotice, setShowCartNotice] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const canAddDirectly = !product.requiresSelection || Boolean(product.variantId);
  const hasDiscount = typeof product.comparePrice === "number" && product.comparePrice > product.price;
  const oldPrice = hasDiscount ? (product.comparePrice as number) : product.price * 1.15;
  const parcelas = 6;
  const valorParcela = product.price / parcelas;
  const pixPrice = product.price * 0.90;
  const discountPercent = Math.round((1 - (product.price / oldPrice)) * 100);
  const whatsappHref = product.whatsappBaseUrl
    ? `${product.whatsappBaseUrl}${product.whatsappBaseUrl.includes("?") ? "&" : "?"}text=${encodeURIComponent(`Olá! Quero comprar o produto ${product.name}.`)}`
    : getProductPath(product);
  const productHref = getProductPath(product);

  useEffect(() => {
    if (!showCartNotice) return;

    const timeout = window.setTimeout(() => setShowCartNotice(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [showCartNotice]);

  useEffect(() => {
    if (!cartError) return;

    const timeout = window.setTimeout(() => setCartError(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [cartError]);

  async function handleAddToCart() {
    if (product.requiresSelection && !product.variantId) {
      router.push(productHref);
      return;
    }

    setCartError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          variantId: product.variantId || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as CartStatePayload | { error?: string } | null;

      if (!response.ok) {
        throw new Error((payload as { error?: string } | null)?.error || "Não foi possível adicionar ao carrinho.");
      }

      dispatchCartUpdated(payload as CartStatePayload);
      setShowCartNotice(true);
    } catch (error) {
      setCartError(error instanceof Error ? error.message : "Não foi possível adicionar ao carrinho.");
    } finally {
      setIsPending(false);
    }
  }

  function stopCardAction(event: React.SyntheticEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="group relative flex h-full select-none flex-col rounded-[24px] border border-zinc-200/90 bg-white/95 p-2 shadow-[0_18px_38px_-34px_rgba(26,26,26,0.45)] transition-all hover:-translate-y-1 hover:border-[#d4af37]/40 hover:shadow-[0_28px_48px_-34px_rgba(26,26,26,0.6)] sm:p-3">
      {showCartNotice ? (
        <div className="absolute inset-x-2 bottom-2 z-40 rounded-2xl border border-emerald-200 bg-white/95 p-3 backdrop-blur">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.85] text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-700">Adicionado ao carrinho</p>
              <p className="mt-1 line-clamp-1 text-xs text-[#666666]">{product.name}</p>
              <Link
                href="/cart"
                className="mt-2 inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl bg-[#21352A] px-4 text-xs font-medium text-white transition-colors hover:bg-[#21352A]/90"
              >
                Ver carrinho
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {cartError ? (
        <div className="absolute inset-x-2 bottom-2 z-40 rounded-2xl border border-rose-200 bg-white/95 p-3 backdrop-blur">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.85] text-rose-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-700">Não foi possível adicionar</p>
              <p className="mt-1 text-xs text-[#666666]">{cartError}</p>
            </div>
          </div>
        </div>
      ) : null}

      
      
      <div className="absolute right-3 top-3 z-20" onClick={stopCardAction}>
        <FavoriteButton productId={product.id} className="h-9 w-9 bg-white/92 shadow-none backdrop-blur" />
      </div>

      {/* Badges de Destaque */}
      {hasDiscount && (
        <div className="absolute left-2 top-2 z-20">
          <span className="rounded-full bg-[#D4AF37] px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] text-[#111111] shadow-sm">
            {discountPercent}% OFF
          </span>
        </div>
      )}

      {/* Imagem Container */}
      <Link
        href={productHref}
        aria-label={`Ver detalhes de ${product.name}`}
        className="relative mb-3 block aspect-square w-full overflow-hidden rounded-[18px] bg-[#F7F5F2] select-none"
      >
        <Image
          src={product.image || "/demo-products/kit-elegance.svg"}
          alt={product.name}
          fill
          draggable={false}
          quality={50}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3 transition-transform duration-700 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col px-2 pb-2 text-left">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8A7F72]">
          {product.category}
        </p>
        <Link href={productHref} className="mb-3 block min-h-[64px] select-none">
          <h3 className="line-clamp-2 font-serif text-[clamp(1.08rem,1.45vw,1.24rem)] font-medium leading-[1.1] tracking-[-0.015em] text-[#1A1A1A]">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto flex flex-col items-start justify-end gap-1">
          {hasDiscount && (
            <span className="text-sm font-medium text-zinc-400 line-through decoration-zinc-400/80">
              {formatCurrency(oldPrice)}
            </span>
          )}
          
          <span className="mb-1 text-[1.65rem] font-semibold leading-none tracking-tight text-[#1A1A1A]">
            {formatCurrency(product.price)}
          </span>
          
          <span className="mb-3 text-xs font-medium text-[#1A1A1A]">
            até {parcelas}x de {formatCurrency(valorParcela)} sem juros
          </span>

          <div className="mt-2 flex w-full items-center gap-2 border-t border-zinc-200 pt-3 text-left">
            <PixIcon className={`h-[13px] w-[13px] shrink-0 text-[#32BCAD] ${pixIconClassName ?? "translate-y-px"}`} />
            <span className="text-sm font-medium leading-none text-[#1A1A1A]">
              ou {formatCurrency(pixPrice)} via Pix
            </span>
          </div>

          <div className="mt-4 grid w-full grid-cols-[1fr_auto] gap-2" onClick={stopCardAction}>
            <button
              type="button"
              onClick={() => void handleAddToCart()}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#111111] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1c1c1c] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <ShoppingCart className="h-4 w-4" />
              {isPending ? "Adicionando" : canAddDirectly ? "Comprar" : "Escolher"}
            </button>
            <Link
              href={whatsappHref}
              target={product.whatsappBaseUrl ? "_blank" : undefined}
              rel={product.whatsappBaseUrl ? "noreferrer" : undefined}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-zinc-200 bg-white text-[#1A1A1A] transition-colors hover:border-[#25D366] hover:text-[#25D366]"
              aria-label={`Falar sobre ${product.name} no WhatsApp`}
            >
              <WhatsAppIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}






