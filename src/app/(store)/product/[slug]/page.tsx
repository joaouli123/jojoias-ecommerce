import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { getProductBySlugAction, getProductReviewsAction, getRelatedProductsAction } from "@/actions/products"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { ProductDetailsTabs } from "@/components/product/product-details-tabs"
import { ProductCard } from "@/components/product/product-card"
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel"
import { ProductViewTracker } from "@/components/analytics/ecommerce-trackers"
import { extractProductInfoFromDescription } from "@/lib/product-content"
import { buildProductMetaDescription, buildProductSeoTitle } from "@/lib/product-seo"
import { getStoreSettings } from "@/lib/store-settings"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br"
const productTabKeys = ["description", "specs", "reviews"] as const
export const revalidate = 300

type ProductTabKey = (typeof productTabKeys)[number]

const getCachedProductBySlug = cache(async (slug: string) => getProductBySlugAction(slug))
const getCachedProductReviews = cache(async (productId: string) => getProductReviewsAction(productId))

function getInitialProductTab(tab?: string): ProductTabKey {
  return productTabKeys.includes(tab as ProductTabKey) ? (tab as ProductTabKey) : "description"
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getCachedProductBySlug(slug)

  if (!product) {
    return {
      title: "Produto não encontrado",
      robots: { index: false, follow: false },
    }
  }

  const title = buildProductSeoTitle({
    name: product.name,
    metaTitle: product.metaTitle,
    brand: product.brand,
    category: product.category,
    siteName: "Luxijóias",
  })
  const description = buildProductMetaDescription({
    name: product.name,
    description: product.description,
    metaDescription: product.metaDescription,
    brand: product.brand,
    category: product.category,
    price: product.price,
    comparePrice: product.comparePrice,
    siteName: "Luxijóias",
  })

  return {
    title,
    description,
    alternates: {
      canonical: `/produto/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}/produto/${product.slug}`,
      locale: "pt_BR",
      siteName: "Luxijóias",
      images: product.image
        ? [
            {
              url: product.image,
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image ? [product.image] : undefined,
    },
  }
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const [product, settings] = await Promise.all([getCachedProductBySlug(slug), getStoreSettings()]);

  if (!product) {
    notFound();
  }

  const [reviewSummary, relatedProducts] = await Promise.all([
    getCachedProductReviews(product.id),
    getRelatedProductsAction(product.id, product.categorySlug, 4),
  ])

  const hasDiscount = (product.comparePrice ?? 0) > product.price;
  const hasFreeShipping = product.price >= 199;
  const oldPrice = product.comparePrice ?? product.price * 1.15;
  const pixPrice = product.price * 0.90;
  const sku = product.sku ?? product.slug.toUpperCase();
  const brand = product.brand ?? "Luxijóias";
  const whatsappHref = `${settings.whatsappUrl}${settings.whatsappUrl.includes("?") ? "&" : "?"}text=${encodeURIComponent(`Olá! Quero comprar o produto ${product.name} (SKU: ${sku}).`)}`;
  
  const description =
    product.description ||
    "Produto exclusivo Luxijóias com acabamento refinado, compra segura e envio para todo o Brasil.";
  const { descriptionBody, infoItems } = extractProductInfoFromDescription(description)
    
  const imageEntries = product.images.length
    ? product.images.map((image, index) => ({
        url: image.url,
        alt: image.alt || (index === 0 ? `${product.name} da Luxijóias` : `${product.name} da Luxijóias - imagem ${index + 1}`),
      }))
    : [{
        url: product.image || "https://images.unsplash.com/photo-1611095567219-79caa80c5980?q=80&w=800",
        alt: `${product.name} da Luxijóias`,
      }];
  const images = imageEntries.map((image) => image.url)
  const imageObjects = imageEntries.map((image, index) => ({
    "@type": "ImageObject",
    url: image.url,
    contentUrl: image.url,
    caption: image.alt,
    name: index === 0 ? product.name : `${product.name} imagem ${index + 1}`,
  }))
  const variants = product.variants
  const totalAvailableQuantity = variants.length
    ? variants.reduce((sum, variant) => sum + (variant.isActive ? variant.quantity : 0), 0)
    : product.quantity
  const productUrl = `${siteUrl}/produto/${product.slug}`
  const initialTab = getInitialProductTab(tab)
  const seoDescription = buildProductMetaDescription({
    name: product.name,
    description,
    metaDescription: product.metaDescription,
    brand: product.brand,
    category: product.category,
    price: product.price,
    comparePrice: product.comparePrice,
    siteName: "Luxijóias",
  })

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

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: productUrl,
    name: product.name,
    description: seoDescription,
    primaryImageOfPage: imageObjects[0],
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: imageObjects,
    description: seoDescription,
    sku,
    mainEntityOfPage: productUrl,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BRL",
      price: product.price,
      availability: totalAvailableQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Luxijóias",
      },
    },
    aggregateRating: reviewSummary.totalReviews > 0 ? {
      "@type": "AggregateRating",
      ratingValue: Number(reviewSummary.averageRating.toFixed(1)),
      reviewCount: reviewSummary.totalReviews,
    } : undefined,
    review: reviewSummary.reviews.slice(0, 3).map((review) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
      },
      author: {
        "@type": "Person",
        name: review.userName || "Cliente verificado",
      },
      name: review.title || `Avaliação de ${product.name}`,
      reviewBody: review.content,
      datePublished: review.createdAt,
    })),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
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
          reviewCount={reviewSummary.totalReviews}
          hasDiscount={hasDiscount}
          hasFreeShipping={hasFreeShipping}
          oldPrice={oldPrice}
          pixPrice={pixPrice}
          images={imageEntries}
          infoItems={infoItems}
          variants={variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price,
            quantity: variant.quantity,
            isActive: variant.isActive,
            image: variant.image ?? null,
          }))}
          totalAvailableQuantity={totalAvailableQuantity}
          whatsappHref={whatsappHref}
        />
      </div>

      <ProductDetailsTabs
        description={descriptionBody || description}
        infoItems={infoItems}
        sku={sku}
        brand={brand}
        category={product.category}
        quantity={product.quantity}
        reviewsCount={reviewSummary.totalReviews}
        averageRating={reviewSummary.averageRating}
        reviews={reviewSummary.reviews}
        productId={product.id}
        initialTab={initialTab}
      />

      <RelatedProductsSection
        relatedProducts={relatedProducts}
        categorySlug={product.categorySlug}
        whatsappUrl={settings.whatsappUrl}
      />
    </div>
  )
}

function RelatedProductsSection({
  relatedProducts,
  categorySlug,
  whatsappUrl,
}: {
  relatedProducts: Awaited<ReturnType<typeof getRelatedProductsAction>>
  categorySlug: string
  whatsappUrl: string
}) {
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
              variantId: relatedProduct.variants.find((variant) => variant.quantity > 0)?.id ?? relatedProduct.variants[0]?.id ?? null,
              requiresSelection: relatedProduct.variants.length > 1,
              whatsappBaseUrl: whatsappUrl,
            }}
          />
        ))}
      </div>
    </section>
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




