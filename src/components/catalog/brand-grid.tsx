import Link from "next/link"
import { ArrowRight, BadgeCheck } from "lucide-react"
import type { StoreBrand } from "@/lib/store-data"

type BrandGridProps = {
  brands: StoreBrand[]
  compact?: boolean
  logoOnly?: boolean
}

function getBrandInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "J"
}

export function BrandGrid({ brands, compact = false, logoOnly = false }: BrandGridProps) {
  if (!brands.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center text-zinc-500">
        Ainda não há marcas públicas disponíveis no catálogo.
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? "xl:grid-cols-4" : "xl:grid-cols-3"} gap-5`}>
      {brands.map((brand) => (
        logoOnly ? (
          <Link
            key={brand.id}
            href={`/marca/${brand.slug}`}
            aria-label={`Abrir vitrine da marca ${brand.name}`}
            title={brand.name}
            className="group flex aspect-[1.5/1] items-center justify-center rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:shadow-lg"
          >
            <div className="flex h-full w-full items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-zinc-50 via-white to-zinc-100 text-zinc-900 transition-colors group-hover:text-[#9a7b18]">
              <span className="text-3xl font-black tracking-[0.22em] sm:text-4xl">{getBrandInitials(brand.name)}</span>
              <span className="sr-only">{brand.name}</span>
            </div>
          </Link>
        ) : (
          <Link
            key={brand.id}
            href={`/marca/${brand.slug}`}
            className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-950">{brand.name}</h2>
                <p className="mt-2 text-sm text-zinc-500">{brand.productCount} produto(s) ativos no catálogo.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-zinc-300 transition-colors group-hover:text-[#D4AF37]" />
            </div>

            <div className="mt-6 inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
              Ver vitrine da marca
            </div>
          </Link>
        )
      ))}
    </div>
  )
}