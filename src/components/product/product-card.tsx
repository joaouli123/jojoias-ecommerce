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

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    comparePrice?: number | null
    image: string
    category: string
    variantId?: string | null
    requiresSelection?: boolean
    whatsappBaseUrl?: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
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
    : `/produto/${product.slug}`;

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
      router.push(`/produto/${product.slug}`);
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
    <div className="group relative flex flex-col bg-white rounded-[20px] border border-zinc-200 p-2 sm:p-3 transition-all hover:scale-[1.02]">
      {showCartNotice ? (
        <div className="absolute inset-x-2 bottom-2 z-40 rounded-[20px] border border-emerald-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-700">Adicionado ao carrinho</p>
              <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{product.name}</p>
              <Link
                href="/cart"
                className="mt-2 inline-flex h-9 items-center justify-center rounded-[20px] bg-[#111111] px-4 text-xs font-bold text-white transition-colors hover:bg-[#111111]/90"
              >
                Ver carrinho
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {cartError ? (
        <div className="absolute inset-x-2 bottom-2 z-40 rounded-[20px] border border-rose-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-700">Não foi possível adicionar</p>
              <p className="mt-1 text-xs text-zinc-500">{cartError}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto absolute right-2 top-2 z-50 flex flex-col gap-2">
        <FavoriteButton productId={product.id} className="w-8 h-8" />
        <Link
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`Comprar ${product.name} pelo WhatsApp`}
          className="relative z-10 inline-flex h-8 w-8 touch-manipulation items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-[#25D366] hover:text-[#25D366]"
        >
          <WhatsAppIcon className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onPointerDown={stopCardAction}
          onClick={(event) => {
            stopCardAction(event);
            void handleAddToCart();
          }}
          disabled={isPending}
          aria-label={canAddDirectly ? `Adicionar ${product.name} ao carrinho` : `Escolher opções de ${product.name}`}
          className="relative z-10 inline-flex h-8 w-8 touch-manipulation items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37] text-white transition-colors hover:border-[#b8921f] hover:bg-[#b8921f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>
      
      {/* Badges de Destaque */}
      {hasDiscount && (
        <div className="absolute left-2 top-2 z-20">
          <span className="bg-[#D4AF37] text-[#111111] text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm tracking-wide">
            {discountPercent}% OFF
          </span>
        </div>
      )}

      {/* Imagem Container */}
      <Link
        href={`/produto/${product.slug}`}
        aria-label={`Ver detalhes de ${product.name}`}
        className="relative mb-4 block aspect-square w-full overflow-hidden rounded-[20px]"
      >
        <Image
          src={product.image || "/demo-products/kit-elegance.svg"}
          alt={product.name}
          fill
          quality={50}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </Link>

      <div className="flex flex-col flex-1 px-2 text-center">
        <Link href={`/produto/${product.slug}`} className="mb-3 block">
          <h3 className="min-h-[44px] text-base font-semibold leading-snug text-zinc-800 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex flex-col items-center justify-end mt-auto space-y-1">
          {hasDiscount && (
            <span className="text-sm text-zinc-400 line-through decoration-zinc-400/50 font-medium">
              {formatCurrency(oldPrice)}
            </span>
          )}
          
          <span className="text-2xl font-black tracking-tight text-zinc-950 leading-none mb-1">
            {formatCurrency(product.price)}
          </span>
          
          <span className="text-xs font-medium text-zinc-900 mb-3">
            até {parcelas}x de {formatCurrency(valorParcela)} sem juros
          </span>

          <div className="w-full pt-3 border-t border-zinc-100 flex items-center justify-center gap-1.5 mt-2">
            <PixIcon className="w-[14px] h-[14px] text-[#32BCAD] shrink-0" />
            <span className="text-sm font-bold text-zinc-950">
              ou {formatCurrency(pixPrice)} via Pix
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}






