"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Droplets, Facebook, Gem, Link2, ShieldCheck, Star, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PixIcon, WhatsAppIcon } from "@/components/ui/icons";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ProductShippingEstimator } from "@/components/product/product-shipping-estimator";
import { AddToCartForm } from "@/components/product/add-to-cart-form";
import type { ProductInfoItem } from "@/lib/product-content";

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
  infoItems: ProductInfoItem[];
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
  infoItems,
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

  const sidebarInfoItems = infoItems.length > 0
    ? infoItems
    : [
        { label: "Entrega", value: "Frete grátis para todo o Brasil" },
        { label: "Garantia", value: "Garantia de 12 meses" },
      ];

  function getInfoIcon(item: ProductInfoItem) {
    if (item.label === "Entrega") {
      return Truck;
    }

    if (item.label === "Garantia") {
      return ShieldCheck;
    }

    if (item.label === "Proteção") {
      return Droplets;
    }

    return Gem;
  }

  return (
    <>
      <div className="flex flex-col gap-3 md:gap-4 lg:col-span-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-[28px] bg-[#FAFAF8]">
          <Image
            src={activeImage?.url || images[0]?.url || ""}
            alt={activeImage?.alt || product.name}
            fill
            priority
            quality={75}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-contain p-5 md:p-7"
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
                className={`relative aspect-square overflow-hidden rounded-[18px] bg-[#FAFAF8] transition-all ${isActive ? "border border-[#D4AF37] opacity-100 ring-1 ring-[#D4AF37]/40" : "border border-transparent opacity-80 hover:border-[#D4AF37]/50 hover:opacity-100"}`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  quality={50}
                  sizes="(max-width: 1024px) 25vw, 180px"
                  className="object-contain p-2"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-fit w-full flex-col rounded-[24px] border border-zinc-200 bg-white p-5 md:p-7 lg:sticky lg:top-24 lg:col-span-2 lg:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          {reviewCount > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-[#facc15] text-[#facc15]" />
                ))}
              </div>
              <span className="text-[13px] font-medium text-[#666666]">({reviewCount})</span>
            </div>
          ) : null}
          {hasDiscount ? (
            <span className="inline-flex h-7 items-center rounded-full bg-[#D4AF37] px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#111111]">
              DESCONTO
            </span>
          ) : null}
          {hasFreeShipping ? (
            <span className="inline-flex h-7 items-center rounded-full bg-emerald-600 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white">
              FRETE GRÁTIS
            </span>
          ) : null}
        </div>

        <div className="mb-4 flex items-start justify-between gap-3">
          <h1 className="max-w-[19ch] text-[clamp(1.32rem,1.35vw,1.72rem)] font-medium leading-[1.16] tracking-[-0.015em] text-[#111827] font-serif">{product.name}</h1>
          <FavoriteButton productId={product.id} className="h-10 w-10 shrink-0 shadow-none" />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 border-b border-zinc-200 pb-5 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A7F72]">Código</p>
            <p className="mt-1 truncate text-[14px] font-semibold text-[#1A1A1A]">{sku}</p>
          </div>
          <div className="min-w-0 sm:text-right">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A7F72]">Marca</p>
            <div className="mt-1 text-[14px] font-medium text-[#1A1A1A]">
              {product.brandSlug ? (
                <Link href={`/marca/${product.brandSlug}`} className="transition-colors hover:text-[#D4AF37]">
                  {brandLabel}
                </Link>
              ) : (
                <span>{brandLabel}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          {hasDiscount ? (
            <span className="mb-2 block text-[14px] font-medium text-[#9ca3af] line-through decoration-[#9ca3af]/60">
              {formatCurrency(oldPrice)}
            </span>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <span className="text-[clamp(2.1rem,2.3vw,2.7rem)] font-medium leading-none tracking-[-0.03em] text-[#1A1A1A]">
              {formatCurrency(product.price)}
            </span>

            <div className="flex items-center gap-1.5 text-[#1A1A1A]">
              <PixIcon className="h-[15px] w-[15px] text-[#32BCAD]" />
              <span className="text-[15px] font-medium">{formatCurrency(pixPrice)} no Pix</span>
            </div>
          </div>
        </div>

        <div className="mb-7 flex flex-col gap-3">
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
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] border border-[#25D366] bg-white text-[14px] font-medium text-[#25D366] transition-colors hover:bg-[#F1FDF6]"
          >
            <WhatsAppIcon className="h-[18px] w-[18px]" />
            Falar no WhatsApp
          </Link>
        </div>

        <div className="mb-7 flex flex-col gap-4 border-y border-zinc-100 py-5">
          {sidebarInfoItems.map((item) => {
            const Icon = getInfoIcon(item);

            return (
              <div key={`${item.label}-${item.value}`} className="flex items-center gap-3 text-[#4b5563]">
                <Icon className="h-[20px] w-[20px] stroke-[1.75]" />
                <span className="text-[14px] leading-6">{item.value}</span>
              </div>
            );
          })}
        </div>

        <ProductShippingEstimator subtotal={product.price} />

        <div className="mt-5 flex items-center gap-3 border-t border-zinc-100 pt-5">
          <span className="text-[14px] font-medium text-[#111827]">Compartilhar</span>
          <div className="flex gap-2">
            <button type="button" aria-label="Copiar link do produto" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-[#666666] transition-all hover:border-[#111827] hover:text-[#111827]">
              <Link2 className="h-[18px] w-[18px] stroke-[1.8]" />
            </button>
            <button type="button" aria-label="Compartilhar no WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-[#666666] transition-all hover:border-[#25D366] hover:text-[#25D366]">
              <WhatsAppIcon className="h-[18px] w-[18px]" />
            </button>
            <button type="button" aria-label="Compartilhar no Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-[#666666] transition-all hover:border-[#1877F2] hover:text-[#1877F2]">
              <Facebook className="h-[18px] w-[18px] stroke-[1.8]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}