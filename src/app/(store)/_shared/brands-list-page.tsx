import type { Metadata } from "next"
import { getBrandsAction } from "@/actions/products"
import { BrandGrid } from "@/components/catalog/brand-grid"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br"

export const brandsListMetadata: Metadata = {
  title: "Marcas",
  description: "Explore todas as marcas disponíveis na Luxijóias com acesso rápido às vitrines dedicadas de cada uma.",
  alternates: {
    canonical: "/marcas",
  },
  openGraph: {
    title: "Marcas | Luxijóias",
    description: "Explore todas as marcas disponíveis na Luxijóias com acesso rápido às vitrines dedicadas de cada uma.",
    url: `${siteUrl}/marcas`,
    type: "website",
    locale: "pt_BR",
  },
}

export async function BrandsListPage() {
  const brands = await getBrandsAction(60)

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Marcas" }]} />

      <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 px-6 py-10 md:px-10 md:py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-medium font-serif uppercase tracking-[0.3em] text-[#D4AF37]">Curadoria Luxijóias</p>
          <h1 className="mt-4 text-3xl md:text-5xl font-medium font-serif tracking-tight text-[#1A1A1A]">Marcas em destaque</h1>
          <p className="mt-4 text-sm md:text-base leading-7 text-[#666666]">
            Navegue por todas as marcas disponíveis no catálogo e encontre coleções, estilos e faixas de preço com páginas dedicadas para cada vitrine.
          </p>
        </div>
      </div>

      <BrandGrid brands={brands} />
    </div>
  )
}