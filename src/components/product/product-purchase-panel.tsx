"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ShieldCheck, Star, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PixIcon } from "@/components/ui/icons";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ProductShippingEstimator } from "@/components/product/product-shipping-estimator";
import { AddToCartForm } from "@/components/product/add-to-cart-form";

type ProductVariantOption = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isActive: boolean;
  image?: string | null;
};

type ProductPurchasePanelProps = {
  product: {
    id: string;
    name: string;
    price: number;
    brand: string | null;
    brandSlug: string | null;
    category: string;
  };
  sku: string;
  brandLabel: string;
  reviewCount: number;
  hasDiscount: boolean;
  hasFreeShipping: boolean;
  oldPrice: number;
  pixPrice: number;
  images: Array<{ url: string; alt: string }>;
  variants: ProductVariantOption[];
  totalAvailableQuantity: number;
  whatsappHref: string;
};

export function ProductPurchasePanel({
  product,
  sku,
  brandLabel,
  reviewCount,
  hasDiscount,
  hasFreeShipping,
  oldPrice,
  pixPrice,
  images,
  variants,
  totalAvailableQuantity,
  whatsappHref,
}: ProductPurchasePanelProps) {
  const [activeImageUrl, setActiveImageUrl] = useState(images[0]?.url ?? "");
  const initialVariantId = useMemo(
    () => variants.find((variant) => variant.isActive && variant.quantity > 0)?.id ?? null,
    [variants],
  );

  const activeImage = useMemo(
    () => images.find((image) => image.url === activeImageUrl) ?? images[0],
    [activeImageUrl, images],
  );

  const galleryImages = useMemo(() => {
    const orderedImages = activeImage
      ? [activeImage, ...images.filter((image) => image.url !== activeImage.url)]
      : images;
    return orderedImages.slice(0, Math.max(orderedImages.length, 4));
  }, [activeImage, images]);

  return (
    <>
      <div className="flex flex-col gap-3 md:gap-4 lg:col-span-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
          <Image
            src={activeImage?.url || images[0]?.url || ""}
            alt={activeImage?.alt || product.name}
            fill
            priority
            quality={75}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {galleryImages.map((image, index) => {
            const isActive = image.url === activeImage?.url;

            return (
              <button
                key={`${image.url}-${index}`}
                type="button"
                aria-label={`Ver imagem ${index + 1} de ${product.name}`}
                onClick={() => setActiveImageUrl(image.url)}
                className={`relative aspect-square overflow-hidden rounded-xl border bg-zinc-50 transition-all ${isActive ? "border-[#D4AF37] opacity-100 ring-1 ring-[#D4AF37]/40" : "border-zinc-200 opacity-80 hover:border-[#D4AF37] hover:opacity-100"}`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  quality={50}
                  sizes="(max-width: 1024px) 25vw, 180px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-fit w-full flex-col rounded-2xl border border-zinc-200 p-4 md:p-6 lg:sticky lg:top-24 lg:col-span-2 lg:p-7">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, index) => (
              <Star key={index} className="h-4 w-4 fill-[#facc15] text-[#facc15]" />
            ))}
          </div>
          <span className="text-[13px] font-medium text-zinc-500">({reviewCount})</span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {hasDiscount ? (
            <span className="inline-flex h-8 items-center rounded-md bg-[#D4AF37] px-3 text-[12px] font-black tracking-wide text-[#111111]">
              DESCONTO
            </span>
          ) : null}
          {hasFreeShipping ? (
            <span className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-[12px] font-black tracking-wide text-white">
              FRETE GRÁTIS
            </span>
          ) : null}
        </div>

        <div className="mb-4 flex items-start justify-between gap-3">
          <h1 className="text-[24px] font-bold leading-[1.2] tracking-tight text-[#111827]">{product.name}</h1>
          <FavoriteButton productId={product.id} className="h-10 w-10 shrink-0" />
        </div>

        <div className="mb-5 flex w-full items-center justify-between border-b border-zinc-200 pb-3 text-[13px] text-zinc-700">
          <span>
            Código: <strong className="text-zinc-900">{sku}</strong>
          </span>
          <span>
            Marca:{" "}
            {product.brandSlug ? (
              <Link href={`/marca/${product.brandSlug}`} className="font-bold text-zinc-900 transition-colors hover:text-[#D4AF37]">
                {brandLabel}
              </Link>
            ) : (
              <strong className="text-zinc-900">{brandLabel}</strong>
            )}
          </span>
        </div>

        <div className="mb-6 flex flex-col">
          {hasDiscount ? (
            <span className="mb-1 text-[15px] font-medium text-[#9ca3af] line-through decoration-[#9ca3af]/50">
              {formatCurrency(oldPrice)}
            </span>
          ) : null}
          <div className="flex flex-col">
            <span className="mb-3 text-[30px] font-bold leading-none tracking-tight text-zinc-950">
              {formatCurrency(product.price)}
            </span>

            <div className="flex items-center gap-2">
              <PixIcon className="h-[18px] w-[18px] text-[#32BCAD]" />
              <span className="text-[16px] font-bold text-zinc-950">{formatCurrency(pixPrice)} no Pix</span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3">
          <AddToCartForm
            product={product}
            variants={variants}
            totalAvailableQuantity={totalAvailableQuantity}
            initialVariantId={initialVariantId}
            onVariantChange={(variant) => {
              setActiveImageUrl(variant?.image || images[0]?.url || "");
            }}
          />

          <Link
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#25D366] bg-[#25D366] text-[16px] font-bold text-white transition-colors hover:border-[#22c55e] hover:bg-[#22c55e]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            Comprar pelo WhatsApp
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-4 border-y border-zinc-100 py-5">
          <div className="flex items-center gap-3 text-[#4b5563]">
            <Truck className="h-[22px] w-[22px] stroke-[1.5]" />
            <span className="text-[14px]">Frete grátis para todo o Brasil</span>
          </div>
          <div className="flex items-center gap-3 text-[#4b5563]">
            <ShieldCheck className="h-[22px] w-[22px] stroke-[1.5]" />
            <span className="text-[14px]">Garantia de 12 meses</span>
          </div>
        </div>

        <ProductShippingEstimator subtotal={product.price} />

        <div className="mt-5 flex items-center gap-3 border-t border-zinc-100 pt-5">
          <span className="text-[15px] font-bold text-[#111827]">Compartilhar:</span>
          <div className="flex gap-2">
            <button type="button" aria-label="Copiar link do produto" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-all hover:border-[#111827] hover:text-[#111827]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </button>
            <button type="button" aria-label="Compartilhar no WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-all hover:border-[#25D366] hover:text-[#25D366]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            </button>
            <button type="button" aria-label="Compartilhar no Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-all hover:border-[#1877F2] hover:text-[#1877F2]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}