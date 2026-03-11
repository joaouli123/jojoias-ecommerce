import Link from "next/link";
import type { Metadata } from "next";
import Script from "next/script";
import { ProductCard } from "@/components/product/product-card";
import { getBrandsAction, getCategoriesAction, getFeaturedProductsAction, getStoreBannersAction } from "@/actions/products";
import { BannerCarousel, BenefitsCarousel, CategoriesCarousel, SecondaryBanners } from "@/components/home/carousels";
import { BrandGrid } from "@/components/catalog/brand-grid";
import { getStoreSettings } from "@/lib/store-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Loja Oficial de Semijoias",
  description: "Compre semijoias premium com elegância, segurança e entrega rápida em todo Brasil.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const [featuredProducts, heroBanners, secondaryBanners, categories, brands, settings] = await Promise.all([
    getFeaturedProductsAction(8),
    getStoreBannersAction("hero"),
    getStoreBannersAction("secondary"),
    getCategoriesAction(8),
    getBrandsAction(4),
    getStoreSettings(),
  ]);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.storeName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.storeName,
    url: siteUrl,
    telephone: settings.supportPhone,
    sameAs: [settings.instagramUrl, settings.facebookUrl, settings.youtubeUrl].filter(Boolean),
  };

  return (
    <div className="flex flex-col w-full bg-white overflow-hidden relative">
      <Script id="website-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <Script id="organization-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <Link href={settings.whatsappUrl} target="_blank" rel="noreferrer" aria-label="Falar com a Luxijóias no WhatsApp" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      </Link>

      <BannerCarousel banners={heroBanners} />

      <BenefitsCarousel />

      <section className="bg-white py-8 md:py-12">
        <SecondaryBanners banners={secondaryBanners} />
        <CategoriesCarousel categories={categories} />
      </section>

      {settings.brandShowcaseEnabled && brands.length ? (
        <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 border-t border-zinc-100">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37]">Vitrines por marca</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Explore marcas do catálogo</h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                Descubra coleções por estilo, acabamento e curadoria com páginas dedicadas para cada marca da loja.
              </p>
            </div>
            <Link href="/marcas" className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 px-5 text-sm font-bold text-zinc-900 hover:border-[#D4AF37] hover:text-[#D4AF37]">
              Ver todas as marcas
            </Link>
          </div>

          <BrandGrid brands={brands} compact logoOnly />
        </section>
      ) : null}

      <section id="produtos" className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16 scroll-mt-24 border-t border-zinc-100">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-zinc-950 tracking-tight">Lançamentos Exclusivos</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                comparePrice: product.comparePrice,
                image: product.image || "",
                category: product.category,
                variantId: product.variants.length === 1 ? product.variants[0]?.id ?? null : null,
                requiresSelection: product.variants.length > 1,
                whatsappBaseUrl: settings.whatsappUrl,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
