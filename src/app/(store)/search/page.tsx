import type { Metadata } from "next"
import Link from "next/link"
import { SearchX } from "lucide-react"
import { MobileFilters } from "@/components/catalog/mobile-filters"
import { ProductCard } from "@/components/product/product-card"
import { getBrandsAction, getCatalogFacetsAction, getCatalogProductsAction, getCategoriesAction } from "@/actions/products"
import { getStoreSettings } from "@/lib/store-settings"

const PRICE_FILTERS = [
  { label: "Até R$ 100", value: "0-100", min: 0, max: 100 },
  { label: "R$ 100 a R$ 250", value: "100-250", min: 100, max: 250 },
  { label: "R$ 250 a R$ 500", value: "250-500", min: 250, max: 500 },
  { label: "Acima de R$ 500", value: "500-*", min: 500 },
] as const

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jojoias.com.br"

const SORT_OPTIONS = [
  { value: "relevance", label: "Mais Relevantes" },
  { value: "price-asc", label: "Menor Preço" },
  { value: "price-desc", label: "Maior Preço" },
  { value: "newest", label: "Lançamentos" },
] as const

function normalizeSort(value?: string) {
  return SORT_OPTIONS.some((option) => option.value === value) ? value as (typeof SORT_OPTIONS)[number]["value"] : "relevance"
}

function normalizePage(value?: string) {
  const parsed = Number.parseInt(value || "1", 10)
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
}

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

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams
  const query = q?.trim()
  const title = query ? `Busca por “${query}”` : "Buscar produtos"

  return {
    title,
    description: query
      ? `Resultados de busca para ${query} na JoJoias.`
      : "Pesquise semijoias, acessórios e novidades da JoJoias.",
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
    },
    openGraph: {
      title: `${title} | JoJoias`,
      description: query
        ? `Resultados de busca para ${query} na JoJoias.`
        : "Pesquise semijoias, acessórios e novidades da JoJoias.",
      url: query ? `${siteUrl}/search?q=${encodeURIComponent(query)}` : `${siteUrl}/search`,
      type: "website",
    },
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; price?: string; brand?: string; category?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q?.trim() || ""
  const sort = normalizeSort(resolvedSearchParams.sort)
  const page = normalizePage(resolvedSearchParams.page)
  const priceValue = resolvedSearchParams.price
  const selectedBrand = resolvedSearchParams.brand?.trim() || undefined
  const selectedCategory = resolvedSearchParams.category?.trim() || undefined
  const { minPrice, maxPrice } = parsePriceFilter(priceValue)

  const catalog = query
    ? await getCatalogProductsAction({ query, sort, page, pageSize: 12, minPrice, maxPrice, brandSlug: selectedBrand, categorySlug: selectedCategory })
    : { products: [], total: 0, page: 1, pageSize: 12, totalPages: 0 }
  const facets = query
    ? await getCatalogFacetsAction({ query, minPrice, maxPrice, brandSlug: selectedBrand, categorySlug: selectedCategory })
    : { brands: [], categories: [] }
  const [categories, popularBrands, settings] = await Promise.all([
    getCategoriesAction(6),
    getBrandsAction(6),
    getStoreSettings(),
  ])

  const currentQuery = {
    q: query || undefined,
    sort,
    price: priceValue,
    brand: selectedBrand,
    category: selectedCategory,
    page: page > 1 ? String(page) : undefined,
  }

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="border-b border-zinc-200 pb-8 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">{query ? `Resultados para “${query}”` : "Buscar produtos"}</h1>
        <p className="text-zinc-500 mt-2 max-w-2xl">
          {query
            ? `Encontramos ${catalog.total} produto(s) relacionados à sua busca.`
            : "Digite o nome do produto, coleção ou categoria para encontrar o que procura."}
        </p>
        <form method="get" className="mt-6 flex max-w-2xl gap-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar produtos, marcas ou categorias"
            className="h-12 flex-1 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
          />
          <button type="submit" className="h-12 rounded-xl bg-[#111111] px-5 text-sm font-bold text-white hover:bg-[#111111]/90">
            Buscar
          </button>
        </form>
      </div>

      {query ? (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
            <MobileFilters
              actionPath="/search"
              query={query}
              sortOptions={SORT_OPTIONS}
              selectedSort={sort}
              priceOptions={PRICE_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
              selectedPrice={priceValue}
              brandOptions={facets.brands.map((item) => ({ value: item.slug, label: `${item.name} (${item.productCount})` }))}
              selectedBrand={selectedBrand}
              categoryOptions={facets.categories.map((item) => ({ value: item.slug, label: `${item.name} (${item.productCount})` }))}
              selectedCategory={selectedCategory}
              clearHref={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
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
                          href={href ? `/search?${href}` : "/search"}
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

              {facets.brands.length ? (
                <div>
                  <h3 className="font-bold text-zinc-900 mb-4">Marcas</h3>
                  <div className="space-y-2">
                    {facets.brands.map((brand) => {
                      const isActive = selectedBrand === brand.slug
                      const href = buildQueryString(currentQuery, { brand: isActive ? undefined : brand.slug, page: undefined })

                      return (
                        <Link
                          key={brand.id}
                          href={href ? `/search?${href}` : "/search"}
                          className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? "bg-[#D4AF37]/10 text-zinc-900" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"}`}
                        >
                          <span>{brand.name}</span>
                          <span className="text-xs text-zinc-500">{brand.productCount}</span>
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
                        href={href ? `/search?${href}` : "/search"}
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
            </div>
          </aside>

          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-sm text-zinc-500">
                Mostrando <span className="font-bold text-zinc-900">{catalog.products.length}</span> de <span className="font-bold text-zinc-900">{catalog.total}</span> produtos
              </p>
              <form method="get" className="w-full sm:w-auto flex gap-2">
                <input type="hidden" name="q" value={query} />
                {priceValue ? <input type="hidden" name="price" value={priceValue} /> : null}
                {selectedBrand ? <input type="hidden" name="brand" value={selectedBrand} /> : null}
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

            {priceValue || selectedBrand || selectedCategory ? (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="text-sm text-zinc-500">Filtros ativos:</span>
                {PRICE_FILTERS.filter((option) => option.value === priceValue).map((option) => {
                  const clearHref = buildQueryString(currentQuery, { price: undefined, page: undefined })
                  return (
                    <Link key={option.value} href={clearHref ? `/search?${clearHref}` : "/search"} className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-800 hover:bg-zinc-200">
                      {option.label} ×
                    </Link>
                  )
                })}
                {facets.brands.filter((brand) => brand.slug === selectedBrand).map((brand) => {
                  const clearHref = buildQueryString(currentQuery, { brand: undefined, page: undefined })
                  return (
                    <Link key={brand.id} href={clearHref ? `/search?${clearHref}` : "/search"} className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-800 hover:bg-zinc-200">
                      Marca: {brand.name} ×
                    </Link>
                  )
                })}
                {facets.categories.filter((category) => category.slug === selectedCategory).map((category) => {
                  const clearHref = buildQueryString(currentQuery, { category: undefined, page: undefined })
                  return (
                    <Link key={category.id} href={clearHref ? `/search?${clearHref}` : "/search"} className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-800 hover:bg-zinc-200">
                      Categoria: {category.name} ×
                    </Link>
                  )
                })}
              </div>
            ) : null}

            {catalog.products.length ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
              <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-14 text-center">
                <SearchX className="mx-auto h-12 w-12 text-zinc-300" />
                <h2 className="mt-4 text-xl font-bold text-zinc-900">Nenhum produto encontrado</h2>
                <p className="mt-2 text-zinc-500">Tente outro termo ou ajuste os filtros atuais.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {categories.map((category) => (
                    <Link key={category.id} href={`/categoria/${category.slug}`} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-[#D4AF37] hover:text-[#D4AF37]">
                      {category.name}
                    </Link>
                  ))}
                </div>
                {popularBrands.length ? (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {popularBrands.map((brand) => (
                      <Link key={brand.id} href={`/marca/${brand.slug}`} className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:text-[#D4AF37]">
                        {brand.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
                <Link href="/categoria/todos" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#111111] px-5 text-sm font-bold text-white hover:bg-[#111111]/90">
                  Ver todo o catálogo
                </Link>
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
                        href={href ? `/search?${href}` : "/search"}
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
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center text-zinc-500">
          <p>Comece digitando um termo para ver resultados reais do catálogo.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Link key={category.id} href={`/categoria/${category.slug}`} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:text-[#D4AF37]">
                {category.name}
              </Link>
            ))}
          </div>
          {popularBrands.length ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {popularBrands.map((brand) => (
                <Link key={brand.id} href={`/marca/${brand.slug}`} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:text-[#D4AF37]">
                  {brand.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}