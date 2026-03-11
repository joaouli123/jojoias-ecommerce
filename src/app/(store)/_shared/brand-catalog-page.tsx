import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ProductCard } from "@/components/product/product-card"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { getCatalogFacetsAction, getCatalogProductsAction } from "@/actions/products"
import { MobileFilters } from "@/components/catalog/mobile-filters"
import { prisma } from "@/lib/prisma"
import { getStoreSettings } from "@/lib/store-settings"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br"

const PRICE_FILTERS = [
  { label: "Até R$ 100", value: "0-100", min: 0, max: 100 },
  { label: "R$ 100 a R$ 250", value: "100-250", min: 100, max: 250 },
  { label: "R$ 250 a R$ 500", value: "250-500", min: 250, max: 500 },
  { label: "Acima de R$ 500", value: "500-*", min: 500 },
] as const

const SORT_OPTIONS = [
  { value: "relevance", label: "Mais Relevantes" },
  { value: "price-asc", label: "Menor Preço" },
  { value: "price-desc", label: "Maior Preço" },
  { value: "newest", label: "Lançamentos" },
] as const

function parsePriceFilter(value?: string): { minPrice?: number; maxPrice?: number } {
  const selected = PRICE_FILTERS.find((option) => option.value === value)
  const maxPrice = selected && "max" in selected ? selected.max : undefined

  return selected
    ? {
        minPrice: selected.min,
        ...(typeof maxPrice === "number" ? { maxPrice } : {}),
      }
    : {}
}

function normalizeSort(value?: string) {
  return SORT_OPTIONS.some((option) => option.value === value) ? (value as (typeof SORT_OPTIONS)[number]["value"]) : "relevance"
}

function normalizePage(value?: string) {
  const parsed = Number.parseInt(value || "1", 10)
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
}

function buildQueryString(current: Record<string, string | undefined>, updates: Record<string, string | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries({ ...current, ...updates })) {
    if (value) {
      params.set(key, value)
    }
  }

  if (!params.get("page") || params.get("page") === "1") {
    params.delete("page")
  }

  if (params.get("sort") === "relevance") {
    params.delete("sort")
  }

  return params.toString()
}

export async function generateBrandCatalogMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: { name: true },
  })

  if (!brand) {
    return {
      title: "Marca não encontrada",
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${brand.name} | Marcas`,
    description: `Explore os produtos da marca ${brand.name} com curadoria premium e entrega rápida em todo o Brasil.`,
    alternates: {
      canonical: `/marca/${slug}`,
    },
    openGraph: {
      title: `${brand.name} | Luxijóias`,
      description: `Explore os produtos da marca ${brand.name} com curadoria premium e entrega rápida em todo o Brasil.`,
      url: `${siteUrl}/marca/${slug}`,
      type: "website",
      locale: "pt_BR",
    },
  }
}

export async function BrandCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; price?: string; page?: string; category?: string }>
}) {
  const { slug } = await params
  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  })

  if (!brand) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const sort = normalizeSort(resolvedSearchParams.sort)
  const page = normalizePage(resolvedSearchParams.page)
  const priceValue = resolvedSearchParams.price
  const selectedCategory = resolvedSearchParams.category?.trim() || undefined
  const { minPrice, maxPrice } = parsePriceFilter(priceValue)

  const [catalog, facets, settings] = await Promise.all([
    getCatalogProductsAction({
      brandSlug: brand.slug,
      categorySlug: selectedCategory,
      minPrice,
      maxPrice,
      sort,
      page,
      pageSize: 12,
    }),
    getCatalogFacetsAction({
      brandSlug: brand.slug,
      categorySlug: selectedCategory,
      minPrice,
      maxPrice,
    }),
    getStoreSettings(),
  ])

  const currentQuery = {
    sort,
    price: priceValue,
    category: selectedCategory,
    page: page > 1 ? String(page) : undefined,
  }

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Marca ${brand.name}`,
    itemListElement: catalog.products.slice(0, 12).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/produto/${product.slug}`,
      name: product.name,
    })),
  }

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <Breadcrumbs
        items={[
          { label: "Início", href: "/" },
          { label: "Marcas" },
          { label: brand.name },
        ]}
      />

      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">Marca {brand.name}</h1>
        <p className="text-zinc-500 max-w-2xl">
          Descubra a curadoria completa da marca {brand.name} com filtros rápidos por categoria, preço e ordenação.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
          <MobileFilters
            actionPath={`/marca/${brand.slug}`}
            sortOptions={SORT_OPTIONS}
            selectedSort={sort}
            priceOptions={PRICE_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
            selectedPrice={priceValue}
            categoryOptions={facets.categories.map((item) => ({ value: item.slug, label: `${item.name} (${item.productCount})` }))}
            selectedCategory={selectedCategory}
            clearHref={`/marca/${brand.slug}`}
          />

          <div className="hidden lg:flex flex-col gap-8 sticky top-24">
            {facets.categories.length ? (
              <div>
                <h3 className="font-bold text-zinc-900 mb-4">Categorias</h3>
                <div className="space-y-2">
                  {facets.categories.map((category) => {
                    const isActive = selectedCategory === category.slug
                    const href = buildQueryString(currentQuery, { category: isActive ? undefined : category.slug, page: undefined })

                    return (
                      <Link
                        key={category.id}
                        href={href ? `/marca/${brand.slug}?${href}` : `/marca/${brand.slug}`}
                        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"}`}
                      >
                        <span>{category.name}</span>
                        <span className={`text-xs ${isActive ? "text-white/80" : "text-zinc-500"}`}>{category.productCount}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="font-bold text-zinc-900 mb-4">Preço</h3>
              <div className="space-y-3">
                {PRICE_FILTERS.map((range) => {
                  const isActive = priceValue === range.value
                  const href = buildQueryString(currentQuery, { price: isActive ? undefined : range.value, page: undefined })

                  return (
                    <Link
                      key={range.value}
                      href={href ? `/marca/${brand.slug}?${href}` : `/marca/${brand.slug}`}
                      className={`flex items-center gap-3 rounded-lg px-2 py-1 transition-colors ${isActive ? "bg-[#D4AF37]/10 text-zinc-900" : "hover:bg-zinc-50 text-zinc-600"}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? "border-[#D4AF37] bg-[#D4AF37]" : "border-zinc-300"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full bg-white ${isActive ? "block" : "hidden"}`} />
                      </div>
                      <span className="text-sm">{range.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-zinc-900 mb-4">Ordenação rápida</h3>
              <div className="space-y-2">
                {SORT_OPTIONS.map((option) => {
                  const isActive = sort === option.value
                  const href = buildQueryString(currentQuery, { sort: option.value, page: undefined })

                  return (
                    <Link
                      key={option.value}
                      href={href ? `/marca/${brand.slug}?${href}` : `/marca/${brand.slug}`}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"}`}
                    >
                      {option.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <p className="text-sm text-zinc-500">
              Mostrando <span className="font-bold text-zinc-900">{catalog.products.length}</span> de <span className="font-bold text-zinc-900">{catalog.total}</span> produtos
            </p>
            <form method="get" className="w-full sm:w-auto flex gap-2">
              {priceValue ? <input type="hidden" name="price" value={priceValue} /> : null}
              {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
              <select name="sort" defaultValue={sort} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] cursor-pointer w-full sm:w-auto">
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button type="submit" className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-bold text-white hover:bg-zinc-800">
                Aplicar
              </button>
            </form>
          </div>

          {priceValue || selectedCategory ? (
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="text-sm text-zinc-500">Filtros ativos:</span>
              {PRICE_FILTERS.filter((option) => option.value === priceValue).map((option) => {
                const clearHref = buildQueryString(currentQuery, { price: undefined, page: undefined })
                return (
                  <Link key={option.value} href={clearHref ? `/marca/${brand.slug}?${clearHref}` : `/marca/${brand.slug}`} className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-800 hover:bg-zinc-200">
                    {option.label} ×
                  </Link>
                )
              })}
              {facets.categories.filter((category) => category.slug === selectedCategory).map((category) => {
                const clearHref = buildQueryString(currentQuery, { category: undefined, page: undefined })
                return (
                  <Link key={category.id} href={clearHref ? `/marca/${brand.slug}?${clearHref}` : `/marca/${brand.slug}`} className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-800 hover:bg-zinc-200">
                    Categoria: {category.name} ×
                  </Link>
                )
              })}
            </div>
          ) : null}

          {catalog.products.length ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {catalog.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    comparePrice: product.comparePrice,
                    image: product.image || "/mock",
                    category: product.category,
                    variantId: product.variants.length === 1 ? product.variants[0]?.id ?? null : null,
                    requiresSelection: product.variants.length > 1,
                    whatsappBaseUrl: settings.whatsappUrl,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
              Nenhum produto encontrado para esta marca com os filtros atuais.
            </div>
          )}

          {catalog.totalPages > 1 ? (
            <div className="mt-12 flex justify-center">
              <nav className="flex items-center gap-2">
                {Array.from({ length: catalog.totalPages }, (_, index) => index + 1).slice(Math.max(page - 3, 0), Math.max(page - 3, 0) + 5).map((pageNumber) => {
                  const href = buildQueryString(currentQuery, { page: pageNumber === 1 ? undefined : String(pageNumber) })
                  return (
                    <Link
                      key={pageNumber}
                      href={href ? `/marca/${brand.slug}?${href}` : `/marca/${brand.slug}`}
                      className={`h-10 min-w-10 rounded-lg px-3 flex items-center justify-center text-sm font-bold ${pageNumber === page ? "bg-[#111111] text-white" : "border border-zinc-200 hover:bg-zinc-50"}`}
                    >
                      {pageNumber}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}