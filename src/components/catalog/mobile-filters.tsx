import Link from "next/link"
import { ChevronDown, SlidersHorizontal } from "lucide-react"

type FilterOption = {
  value: string
  label: string
}

type MobileFiltersProps = {
  actionPath: string
  sortOptions: readonly FilterOption[]
  selectedSort: string
  priceOptions?: readonly FilterOption[]
  selectedPrice?: string
  brandOptions?: readonly FilterOption[]
  selectedBrand?: string
  categoryOptions?: readonly FilterOption[]
  selectedCategory?: string
  query?: string
  clearHref: string
}

export function MobileFilters({
  actionPath,
  sortOptions,
  selectedSort,
  priceOptions,
  selectedPrice,
  brandOptions,
  selectedBrand,
  categoryOptions,
  selectedCategory,
  query,
  clearHref,
}: MobileFiltersProps) {
  const hasExtraFilters = Boolean(selectedPrice || selectedBrand || selectedCategory)

  return (
    <details className="lg:hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-[#1A1A1A] marker:hidden">
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" /> Filtros e ordenação
        </span>
        <ChevronDown className="h-4 w-4 text-[#666666]" />
      </summary>

      <form method="get" action={actionPath} className="space-y-4 border-t border-zinc-100 px-4 py-4">
        {query ? <input type="hidden" name="q" value={query} /> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categoryOptions?.length ? (
            <label className="space-y-2 text-sm font-medium text-[#666666]">
              <span>Categoria</span>
              <select name="category" defaultValue={selectedCategory ?? ""} className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]">
                <option value="">Todas</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}

          {brandOptions?.length ? (
            <label className="space-y-2 text-sm font-medium text-[#666666]">
              <span>Marca</span>
              <select name="brand" defaultValue={selectedBrand ?? ""} className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]">
                <option value="">Todas</option>
                {brandOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}

          {priceOptions?.length ? (
            <label className="space-y-2 text-sm font-medium text-[#666666]">
              <span>Faixa de preço</span>
              <select name="price" defaultValue={selectedPrice ?? ""} className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]">
                <option value="">Todas</option>
                {priceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="space-y-2 text-sm font-medium text-[#666666]">
            <span>Ordenar por</span>
            <select name="sort" defaultValue={selectedSort} className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1A1A1A] px-5 text-sm font-medium font-serif text-white hover:bg-[#666666]">
            Aplicar filtros
          </button>
          {hasExtraFilters ? (
            <Link href={clearHref} className="text-sm font-semibold text-[#666666] hover:text-[#D4AF37]">
              Limpar filtros
            </Link>
          ) : null}
        </div>
      </form>
    </details>
  )
}