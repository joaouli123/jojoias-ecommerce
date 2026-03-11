import type { Metadata } from "next"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import { Star, Truck, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getProductBySlugAction, getProductReviewsAction, getRelatedProductsAction } from "@/actions/products"
import { PixIcon } from "@/components/ui/icons"
import { FavoriteButton } from "@/components/product/favorite-button"
import { ProductShippingEstimator } from "@/components/product/product-shipping-estimator"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { ProductDetailsTabs } from "@/components/product/product-details-tabs"
import { ProductCard } from "@/components/product/product-card"
import { AddToCartForm } from "@/components/product/add-to-cart-form"
import { ProductViewTracker } from "@/components/analytics/ecommerce-trackers"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getStoreSettings } from "@/lib/store-settings"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlugAction(slug)

  if (!product) {
    return {
      title: "Produto não encontrado",
      robots: { index: false, follow: false },
    }
  }

  const description =
    product.description ||
    "Produto premium JoJoias com compra segura e entrega rápida para todo o Brasil."

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/produto/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: `${siteUrl}/produto/${product.slug}`,
      locale: "pt_BR",
      images: product.image
        ? [
            {
              url: product.image,
              alt: product.name,
            },
          ]
        : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, session, settings] = await Promise.all([getProductBySlugAction(slug), auth(), getStoreSettings()]);

  if (!product) {
    notFound();
  }

  const hasDiscount = (product.comparePrice ?? 0) > product.price;
  const hasFreeShipping = product.price >= 199;
  const oldPrice = product.comparePrice ?? product.price * 1.15;
  const pixPrice = product.price * 0.90;
  const sku = product.sku ?? product.slug.toUpperCase();
  const brand = product.brand ?? "JoJoias";
  const whatsappHref = `${settings.whatsappUrl}${settings.whatsappUrl.includes("?") ? "&" : "?"}text=${encodeURIComponent(`Olá! Quero comprar o produto ${product.name} (SKU: ${sku}).`)}`;
  
  const description =
    product.description ||
    "Este é um produto exclusivo de alta qualidade, desenhado para durar e impressionar. Perfeito para ocasiões especiais ou para presentear quem você ama. Fabricado com materiais premium e acabamento impecável.\n\nNossa equipe de designers trabalhou incansavelmente para criar uma peça que não apenas pareça deslumbrante, mas também seja confortável para uso diário. Cada detalhe foi cuidadosamente considerado, desde a seleção dos materiais até o polimento final.";
    
  const [reviewSummary, relatedProducts, canReview] = await Promise.all([
    getProductReviewsAction(product.id),
    getRelatedProductsAction(product.id, product.categorySlug, 4),
    session?.user?.id
      ? prisma.order.findFirst({
          where: {
            userId: session.user.id,
            status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
            items: { some: { productId: product.id } },
          },
          select: { id: true },
        }).then(Boolean)
      : Promise.resolve(false),
  ]);
  const images = product.images.length
    ? product.images.map((image) => image.url)
    : [product.image || "https://images.unsplash.com/photo-1611095567219-79caa80c5980?q=80&w=800"];
  const variants = product.variants.filter((variant) => variant.isActive)
  const totalAvailableQuantity = variants.length
    ? variants.reduce((sum, variant) => sum + variant.quantity, 0)
    : product.quantity
  const productUrl = `${siteUrl}/produto/${product.slug}`

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category,
        item: `${siteUrl}/categoria/${product.categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image ? [product.image] : undefined,
    description,
    sku,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    aggregateRating: reviewSummary.totalReviews > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(reviewSummary.averageRating.toFixed(1)),
          reviewCount: reviewSummary.totalReviews,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BRL",
      price: product.price,
      availability: product.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  }

  return (
    <div className="flex flex-col pb-16 md:pb-24 bg-white max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <ProductViewTracker
        item={{
          item_id: product.id,
          item_name: product.name,
          item_brand: product.brand ?? undefined,
          item_category: product.category,
          price: product.price,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Breadcrumbs */}
      <div className="py-4 md:py-6">
        <Breadcrumbs
          items={[
            { label: "Início", href: "/" },
            { label: product.category, href: `/categoria/${product.categorySlug}` },
            { label: product.name },
          ]}
        />
      </div>

      {/* Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-10 lg:gap-12 mb-14 md:mb-20">
        
        {/* Left Col: Gallery */}
        <div className="flex flex-col gap-3 md:gap-4 lg:col-span-3">
          <div className="relative aspect-[4/3] w-full rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden">
            <Image
              src={images[0]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          </div>
          
          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {images.map((image, i) => (
              <button key={i} className="aspect-[4/3] rounded-xl border border-zinc-200 hover:border-[#D4AF37] bg-zinc-50 overflow-hidden relative transition-all opacity-80 hover:opacity-100">
                <Image
                  src={image}
                  alt={`${product.name} ${i + 1}`}
                  fill
                  sizes="(max-width: 1024px) 25vw, 180px"
                  className={`object-cover ${i === 0 ? "opacity-100" : ""}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Col: Details & Buy Box */}
        <div className="flex flex-col lg:col-span-2 w-full h-fit rounded-2xl border border-zinc-200 p-4 md:p-6 lg:p-7 lg:sticky lg:top-24">
          
          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[#facc15] text-[#facc15]" />
              ))}
            </div>
            <span className="text-[13px] font-medium text-zinc-500">
              ({reviewSummary.totalReviews})
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {hasDiscount && (
              <span className="inline-flex h-8 px-3 rounded-md bg-[#D4AF37] text-white text-[12px] font-black tracking-wide items-center">
                DESCONTO
              </span>
            )}
            {hasFreeShipping && (
              <span className="inline-flex h-8 px-3 rounded-md bg-emerald-600 text-white text-[12px] font-black tracking-wide items-center">
                FRETE GRÁTIS
              </span>
            )}
          </div>

          {/* Title */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-[24px] font-bold text-[#111827] tracking-tight leading-[1.2]">
              {product.name}
            </h1>
            <FavoriteButton productId={product.id} className="w-10 h-10 shrink-0" />
          </div>

          <div className="w-full flex items-center justify-between text-[13px] text-zinc-700 pb-3 mb-5 border-b border-zinc-200">
            <span>Código: <strong className="text-zinc-900">{sku}</strong></span>
            <span>
              Marca:{" "}
              {product.brandSlug ? (
                <Link href={`/marca/${product.brandSlug}`} className="font-bold text-zinc-900 hover:text-[#D4AF37] transition-colors">
                  {brand}
                </Link>
              ) : (
                <strong className="text-zinc-900">{brand}</strong>
              )}
            </span>
          </div>

          {/* Pricing */}
          <div className="flex flex-col mb-6">
            {hasDiscount && (
              <span className="text-[15px] font-medium text-[#9ca3af] line-through decoration-[#9ca3af]/50 mb-1">
                {formatCurrency(oldPrice)}
              </span>
            )}
            <div className="flex flex-col">
              <span className="text-[30px] font-bold text-[#D4AF37] tracking-tight leading-none mb-3">
                {formatCurrency(product.price)}
              </span>
              
              <div className="flex items-center gap-2">
                  <PixIcon className="w-[18px] h-[18px] text-[#32BCAD]" />
                  <span className="text-[16px] font-bold text-[#32BCAD]">
                  {formatCurrency(pixPrice)} no Pix
                </span>
              </div>
            </div>
          </div>
            
          {/* Actions */}
          <div className="flex flex-col gap-3 mb-6">
            <AddToCartForm
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                brand: product.brand,
                category: product.category,
              }}
              variants={variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                price: variant.price,
                quantity: variant.quantity,
                image: variant.image,
              }))}
              totalAvailableQuantity={totalAvailableQuantity}
            />

            {variants.length ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                <p className="font-semibold text-zinc-900">Variações disponíveis</p>
                <ul className="mt-3 space-y-2">
                  {variants.map((variant) => (
                    <li key={variant.id} className="flex items-center justify-between gap-3">
                      <span>{variant.name}</span>
                      <span className="text-right font-medium">{formatCurrency(variant.price)} · {variant.quantity} un.</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Link href={whatsappHref} target="_blank" rel="noreferrer" className="w-full h-[50px] rounded-[10px] border border-[#25D366] bg-[#25D366] text-white text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-[#22c55e] hover:border-[#22c55e] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Comprar pelo WhatsApp
            </Link>
          </div>

          {/* Value Props Lists */}
          <div className="flex flex-col gap-4 py-5 border-y border-zinc-100 mb-6">
            <div className="flex items-center gap-3 text-[#4b5563]">
              <Truck className="h-[22px] w-[22px] stroke-[1.5]" />
              <span className="text-[14px]">Frete grátis para todo o Brasil</span>
            </div>
            <div className="flex items-center gap-3 text-[#4b5563]">
              <ShieldCheck className="h-[22px] w-[22px] stroke-[1.5]" />
              <span className="text-[14px]">Garantia de 12 meses</span>
            </div>
          </div>

          {/* Calcular Frete */}
          <ProductShippingEstimator subtotal={product.price} />

          {/* Compartilhar */}
          <div className="flex items-center gap-3 mt-5 pt-5 border-t border-zinc-100">
            <span className="text-[15px] font-bold text-[#111827]">Compartilhar:</span>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-[#111827] hover:border-[#111827] transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              </button>
              <button className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-[#25D366] hover:border-[#25D366] transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              </button>
              <button className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-[#1877F2] hover:border-[#1877F2] transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </button>
            </div>
          </div>

        </div>
      </div>

      <ProductDetailsTabs
        description={description}
        sku={sku}
        brand={brand}
        category={product.category}
        quantity={product.quantity}
        reviewsCount={reviewSummary.totalReviews}
        averageRating={reviewSummary.averageRating}
        reviews={reviewSummary.reviews}
        productId={product.id}
        canReview={canReview}
        isAuthenticated={Boolean(session?.user?.id)}
      />

      {relatedProducts.length ? (
        <section className="mt-14 md:mt-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">Sugestões</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Produtos relacionados</h2>
            </div>
            <Link href={`/categoria/${product.categorySlug}`} className="text-sm font-bold text-zinc-900 hover:text-[#D4AF37] transition-colors">
              Ver categoria
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={{
                  id: relatedProduct.id,
                  name: relatedProduct.name,
                  slug: relatedProduct.slug,
                  price: relatedProduct.price,
                  comparePrice: relatedProduct.comparePrice,
                  image: relatedProduct.image || "",
                  category: relatedProduct.category,
                  variantId: relatedProduct.variants.length === 1 ? relatedProduct.variants[0]?.id ?? null : null,
                  requiresSelection: relatedProduct.variants.length > 1,
                  whatsappBaseUrl: settings.whatsappUrl,
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

    </div>
  )
}




