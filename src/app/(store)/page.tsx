import Link from "next/link";
import type { Metadata } from "next";
import Script from "next/script";
import { MessageCircleMore } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { getBrandsAction, getCategoriesAction, getFeaturedProductsAction, getStoreBannersAction } from "@/actions/products";
import { BannerCarousel, BenefitsCarousel, CategoriesCarousel, SecondaryBanners } from "@/components/home/carousels";
import { BrandGrid } from "@/components/catalog/brand-grid";
import { getStoreSettings } from "@/lib/store-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";
const HERO_BANNER_PRIMARY = "/banner-home-luxijoias 2.avif";
const HERO_BANNER_SECONDARY = "/banner-home-secundario-luxijoias.avif";
const HERO_BANNER_PRIMARY_MOBILE = "/banner-celular.avif";
const HERO_BANNER_SECONDARY_MOBILE = "/banner-celular-2.avif";
export const revalidate = 300;

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

  const normalizedHeroBanners = heroBanners.map((banner, index) => {
    const fallbackImage = index === 0 ? HERO_BANNER_PRIMARY : HERO_BANNER_SECONDARY;
    const fallbackMobileImage = index === 0 ? HERO_BANNER_PRIMARY_MOBILE : HERO_BANNER_SECONDARY_MOBILE;
    const needsFallback =
      !banner.imageUrl ||
      banner.imageUrl.includes("banner-home-luxijoias.avif") ||
      banner.imageUrl.includes("banner-home-secundario-luxijoias.avif");
    const needsMobileFallback =
      !banner.mobileUrl ||
      banner.mobileUrl.includes("banner-home-luxijoias.avif") ||
      banner.mobileUrl.includes("banner-home-secundario-luxijoias.avif") ||
      banner.mobileUrl.includes("banner celular.png") ||
      banner.mobileUrl.includes("banner celular 2.png");

    return {
      ...banner,
      imageUrl: needsFallback ? fallbackImage : banner.imageUrl,
      mobileUrl: needsMobileFallback ? fallbackMobileImage : banner.mobileUrl,
    };
  });

  return (
    <div className="flex flex-col w-full bg-white overflow-hidden relative">
      <Script id="website-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <Script id="organization-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <Link href={settings.whatsappUrl} target="_blank" rel="noreferrer" aria-label="Falar com a Luxijóias no WhatsApp" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
        <MessageCircleMore className="h-7 w-7 stroke-[1.9]" />
      </Link>

      <BannerCarousel banners={normalizedHeroBanners} />

      <BenefitsCarousel />

      <section className="bg-white py-8 md:py-12">
        <SecondaryBanners banners={secondaryBanners} />
        <CategoriesCarousel categories={categories} />
      </section>

      {settings.brandShowcaseEnabled && brands.length ? (
        <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 border-t border-zinc-100">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium font-serif uppercase tracking-[0.3em] text-[#D4AF37]">Vitrines por marca</p>
              <h2 className="mt-2 text-[clamp(1.8rem,3vw,2.4rem)] font-medium tracking-[-0.02em] text-[#1A1A1A] font-serif">Explore marcas do catálogo</h2>
              <p className="mt-2 max-w-2xl text-sm text-[#666666]">
                Descubra coleções por estilo, acabamento e curadoria com páginas dedicadas para cada marca da loja.
              </p>
            </div>
            <Link href="/marcas" className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 px-5 text-sm font-medium text-[#1A1A1A] font-serif hover:border-[#D4AF37] hover:text-[#D4AF37]">
              Ver todas as marcas
            </Link>
          </div>

          <BrandGrid brands={brands} compact logoOnly />
        </section>
      ) : null}

      <section id="produtos" className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16 scroll-mt-24 border-t border-zinc-100">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-[clamp(1.8rem,3vw,2.4rem)] font-medium text-[#1A1A1A] font-serif tracking-[-0.02em]">Lançamentos Exclusivos</h2>
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
                variantId: product.variants.find((variant) => variant.quantity > 0)?.id ?? product.variants[0]?.id ?? null,
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
