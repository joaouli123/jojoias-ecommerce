import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"
import { getProductBySlugAction, getProductReviewsAction, getRelatedProductsAction } from "@/actions/products"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { ProductDetailsTabs } from "@/components/product/product-details-tabs"
import { ProductCard } from "@/components/product/product-card"
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel"
import { ProductViewTracker } from "@/components/analytics/ecommerce-trackers"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getStoreSettings } from "@/lib/store-settings"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br"

const getCachedProductBySlug = cache(async (slug: string) => getProductBySlugAction(slug))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getCachedProductBySlug(slug)

  if (!product) {
    return {
      title: "Produto não encontrado",
      robots: { index: false, follow: false },
    }
  }

  const description =
    product.description ||
    "Produto premium Luxijóias com compra segura e entrega rápida para todo o Brasil."

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
  const [product, settings] = await Promise.all([getCachedProductBySlug(slug), getStoreSettings()]);

  if (!product) {
    notFound();
  }

  const hasDiscount = (product.comparePrice ?? 0) > product.price;
  const hasFreeShipping = product.price >= 199;
  const oldPrice = product.comparePrice ?? product.price * 1.15;
  const pixPrice = product.price * 0.90;
  const sku = product.sku ?? product.slug.toUpperCase();
  const brand = product.brand ?? "Luxijóias";
  const whatsappHref = `${settings.whatsappUrl}${settings.whatsappUrl.includes("?") ? "&" : "?"}text=${encodeURIComponent(`Olá! Quero comprar o produto ${product.name} (SKU: ${sku}).`)}`;
  
  const description =
    product.description ||
    "Este é um produto exclusivo de alta qualidade, desenhado para durar e impressionar. Perfeito para ocasiões especiais ou para presentear quem você ama. Fabricado com materiais premium e acabamento impecável.\n\nNossa equipe de designers trabalhou incansavelmente para criar uma peça que não apenas pareça deslumbrante, mas também seja confortável para uso diário. Cada detalhe foi cuidadosamente considerado, desde a seleção dos materiais até o polimento final.";
    
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
        <ProductPurchasePanel
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            brand: product.brand,
            brandSlug: product.brandSlug,
            category: product.category,
          }}
          sku={sku}
          brandLabel={brand}
          reviewCount={0}
          hasDiscount={hasDiscount}
          hasFreeShipping={hasFreeShipping}
          oldPrice={oldPrice}
          pixPrice={pixPrice}
          <Suspense fallback={<ProductDetailsTabsSkeleton />}>
            <ProductDetailsSection
              productId={product.id}
              description={description}
              sku={sku}
              brand={brand}
              category={product.category}
              quantity={product.quantity}
            />
          </Suspense>

          <Suspense fallback={<RelatedProductsSkeleton />}>
            <RelatedProductsSection
              productId={product.id}
              categorySlug={product.categorySlug}
              whatsappUrl={settings.whatsappUrl}
            />
          </Suspense>
                  price: relatedProduct.price,
                  comparePrice: relatedProduct.comparePrice,
                  image: relatedProduct.image || "",

    async function ProductDetailsSection({
      productId,
      description,
      sku,
      brand,
      category,
      quantity,
    }: {
      productId: string
      description: string
      sku: string
      brand: string
      category: string
      quantity: number
    }) {
      const [reviewSummary, session] = await Promise.all([
        getProductReviewsAction(productId),
        auth(),
      ])

      const canReview = session?.user?.id
        ? Boolean(await prisma.order.findFirst({
            where: {
              userId: session.user.id,
              status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
              items: { some: { productId } },
            },
            select: { id: true },
          }))
        : false

      return (
        <ProductDetailsTabs
          description={description}
          sku={sku}
          brand={brand}
          category={category}
          quantity={quantity}
          reviewsCount={reviewSummary.totalReviews}
          averageRating={reviewSummary.averageRating}
          reviews={reviewSummary.reviews}
          productId={productId}
          canReview={canReview}
          isAuthenticated={Boolean(session?.user?.id)}
        />
      )
    }

    async function RelatedProductsSection({
      productId,
      categorySlug,
      whatsappUrl,
    }: {
      productId: string
      categorySlug: string
      whatsappUrl: string
    }) {
      const relatedProducts = await getRelatedProductsAction(productId, categorySlug, 4)

      if (!relatedProducts.length) {
        return null
      }

      return (
        <section className="mt-14 md:mt-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">Sugestões</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Produtos relacionados</h2>
            </div>
            <Link href={`/categoria/${categorySlug}`} className="text-sm font-bold text-zinc-900 hover:text-[#D4AF37] transition-colors">
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
                  whatsappBaseUrl: whatsappUrl,
                }}
              />
            ))}
          </div>
        </section>
      )
    }

    function ProductDetailsTabsSkeleton() {
      return (
        <div className="w-full border-t border-zinc-200 pt-8 md:pt-10 animate-pulse">
          <div className="mb-6 h-6 w-56 rounded bg-zinc-200 md:mb-8" />
          <div className="space-y-4">
            <div className="h-4 w-full rounded bg-zinc-100" />
            <div className="h-4 w-[92%] rounded bg-zinc-100" />
            <div className="h-4 w-[88%] rounded bg-zinc-100" />
          </div>
        </div>
      )
    }

    function RelatedProductsSkeleton() {
      return (
        <section className="mt-14 md:mt-20 animate-pulse">
          <div className="mb-6 h-8 w-64 rounded bg-zinc-200" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-[3/4] rounded-2xl border border-zinc-200 bg-zinc-50" />
            ))}
          </div>
        </section>
      )
    }
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




