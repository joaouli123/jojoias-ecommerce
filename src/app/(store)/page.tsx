import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Script from "next/script";
import { ArrowRight, Instagram, MessageCircleMore } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { getBrandsAction, getCategoriesAction, getFeaturedProductsAction, getProductsByCategoryAction, getStoreBannersAction } from "@/actions/products";
import { BannerCarousel, BenefitsCarousel, CategoriesCarousel, SecondaryBanners } from "@/components/home/carousels";
import { BrandGrid } from "@/components/catalog/brand-grid";
import { getStoreSettings } from "@/lib/store-settings";
import { NewsletterSubscribeForm } from "@/components/layout/newsletter-subscribe-form";
import type { StoreProduct } from "@/lib/store-data";
import { ProductRail } from "@/components/home/product-rail";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";
const HERO_BANNER_PRIMARY = "/banner-home-luxijoias 2.avif";
const HERO_BANNER_SECONDARY = "/banner-home-secundario-luxijoias.avif";
const HERO_BANNER_PRIMARY_MOBILE = "/banner-celular.avif";
const HERO_BANNER_SECONDARY_MOBILE = "/banner-celular-2.avif";
const ABOUT_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1400&q=80",
    alt: "Joias douradas em composição refinada",
  },
  {
    src: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=80",
    alt: "Modelo com acessórios delicados e elegantes",
  },
];
const INSTAGRAM_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
    alt: "Composição de joias douradas com estética de campanha",
  },
  {
    src: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=80",
    alt: "Colares sofisticados em produção editorial",
  },
  {
    src: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
    alt: "Anéis e acessórios em visual refinado",
  },
  {
    src: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80",
    alt: "Retrato com joias douradas em styling sofisticado",
  },
  {
    src: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=80",
    alt: "Conjunto de joias e styling feminino em tons claros",
  },
];

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

  const railCategories = categories.slice(0, 4);
  const categoryRailProducts = await Promise.all(
    railCategories.map(async (category) => ({
      category,
      products: (await getProductsByCategoryAction(category.slug)).slice(0, 8),
    })),
  );

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

  const heroSlides = normalizedHeroBanners.length >= 2
    ? normalizedHeroBanners.slice(0, 2)
    : [
        normalizedHeroBanners[0] ?? {
          id: "hero-primary-fallback",
          title: "Banner principal",
          subtitle: null,
          imageUrl: HERO_BANNER_PRIMARY,
          mobileUrl: HERO_BANNER_PRIMARY_MOBILE,
          href: "/",
          placement: "hero" as const,
          position: 0,
        },
        {
          id: "hero-secondary-fallback",
          title: "Banner secundário",
          subtitle: null,
          imageUrl: HERO_BANNER_SECONDARY,
          mobileUrl: HERO_BANNER_SECONDARY_MOBILE,
          href: "/",
          placement: "hero" as const,
          position: 1,
        },
      ];

  return (
    <div className="relative flex w-full flex-col overflow-hidden">
      <Script id="website-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <Script id="organization-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <Link href={settings.whatsappUrl} target="_blank" rel="noreferrer" aria-label="Falar com a Luxijóias no WhatsApp" className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-[#25D366] text-white shadow-[0_14px_32px_-14px_rgba(37,211,102,0.9)] transition-transform hover:scale-110 md:bottom-6 md:right-6">
        <MessageCircleMore className="h-7 w-7 stroke-[1.9]" />
      </Link>

      <BannerCarousel banners={heroSlides} />

      <BenefitsCarousel />

      <section className="bg-transparent pt-10 pb-4 md:pt-14 md:pb-6">
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

      <HorizontalProductSection
        eyebrow="Curadoria Luxijóias"
        title="Lançamentos Exclusivos"
        description="Peças com acabamento delicado, brilho equilibrado e seleção pensada para presentear ou elevar a produção do dia a dia."
        products={featuredProducts}
        whatsappUrl={settings.whatsappUrl}
        anchorId="produtos"
      />

      {categoryRailProducts.map(({ category, products }) => (
        <HorizontalProductSection
          key={category.id}
          eyebrow="Seleção por categoria"
          title={category.name}
          description={`Uma trilha visual com peças de ${category.name.toLowerCase()} para compor a vitrine da home com profundidade e movimento.`}
          products={products}
          categoryHref={`/categoria/${category.slug}`}
          whatsappUrl={settings.whatsappUrl}
        />
      ))}

      <section className="bg-transparent py-8 md:py-12">
        <SecondaryBanners banners={secondaryBanners} />
      </section>

      <NewsletterEditorialSection />

      <AboutEditorialSection
        title={settings.aboutTitle}
        description={settings.aboutDescription}
        content={settings.aboutContent}
      />

      <InstagramEditorialSection instagramUrl={settings.instagramUrl} />
    </div>
  );
}

function HorizontalProductSection({
  eyebrow,
  title,
  description,
  products,
  whatsappUrl,
  categoryHref,
  anchorId,
}: {
  eyebrow: string;
  title: string;
  description: string;
  products: StoreProduct[];
  whatsappUrl: string;
  categoryHref?: string;
  anchorId?: string;
}) {
  if (!products.length) {
    return null;
  }

  return (
    <section id={anchorId} className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 scroll-mt-24">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-t border-zinc-200/80 pt-8 md:mb-8 md:pt-10">
        <div className="max-w-2xl">
          <p className="text-xs font-medium font-serif uppercase tracking-[0.3em] text-[#D4AF37]">{eyebrow}</p>
          <h2 className="mt-2 text-[clamp(1.8rem,3vw,2.4rem)] font-medium text-[#1A1A1A] font-serif tracking-[-0.02em]">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#666666] md:text-[15px]">{description}</p>
        </div>
        {categoryHref ? (
          <Link href={categoryHref} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-5 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]">
            Ver coleção
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <ProductRail
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          categorySlug: product.categorySlug,
          price: product.price,
          comparePrice: product.comparePrice,
          image: product.image || "",
          category: product.category,
          variantId: product.variants.find((variant) => variant.quantity > 0)?.id ?? product.variants[0]?.id ?? null,
          requiresSelection: product.variants.length > 1,
          whatsappBaseUrl: whatsappUrl,
        }))}
      />
    </section>
  );
}

function NewsletterEditorialSection() {
  return (
    <section className="bg-zinc-50 border-y border-zinc-100 py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <p className="text-xs font-medium font-serif uppercase tracking-[0.3em] text-[#D4AF37] mb-4">Clube Luxijóias</p>
        <h2 className="font-serif text-[clamp(2.2rem,4vw,3.35rem)] leading-[1.1] tracking-[-0.03em] text-[#1A1A1A] mb-4">
          Fique por dentro das promoções
        </h2>
        <p className="text-[#666666] mb-8 text-sm md:text-base leading-relaxed">
          Receba novidades, campanhas sazonais, acesso antecipado a seleções especiais e condições pensadas para quem acompanha a marca de perto.
        </p>
        
        <div className="max-w-md mx-auto">
          <NewsletterSubscribeForm />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A7F72]">
          <span>Lançamentos exclusivos</span>
          <span className="hidden sm:inline">•</span>
          <span>Cupons especiais</span>
          <span className="hidden sm:inline">•</span>
          <span>Curadoria da semana</span>
        </div>
      </div>
    </section>
  );
}

function AboutEditorialSection({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content: string;
}) {
  const paragraphs = content.split("\n\n").filter(Boolean).slice(0, 2);

  return (
    <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 items-center">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl sm:min-h-[360px]">
            <Image src={ABOUT_IMAGES[0].src} alt={ABOUT_IMAGES[0].alt} fill sizes="(max-width: 1024px) 100vw, 36vw" className="object-cover" />
          </div>
          <div className="relative min-h-[220px] overflow-hidden rounded-2xl sm:min-h-[360px] lg:min-h-[240px]">
            <Image src={ABOUT_IMAGES[1].src} alt={ABOUT_IMAGES[1].alt} fill sizes="(max-width: 1024px) 100vw, 30vw" className="object-cover" />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#D4AF37]">Quem somos</p>
          <h2 className="mt-4 max-w-[14ch] font-serif text-[clamp(2rem,3.6vw,3.1rem)] leading-[0.98] tracking-[-0.03em] text-[#1A1A1A]">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#666666]">
            {description}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-zinc-200 bg-[#fcfbf8] p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A7F72]">Curadoria</p>
              <p className="mt-3 font-serif text-xl text-[#1A1A1A]">Seleção com olhar de marca</p>
            </div>
            <div className="rounded-[22px] border border-zinc-200 bg-[#fcfbf8] p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A7F72]">Acabamento</p>
              <p className="mt-3 font-serif text-xl text-[#1A1A1A]">Peças com presença e delicadeza</p>
            </div>
            <div className="rounded-[22px] border border-zinc-200 bg-[#fcfbf8] p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A7F72]">Atendimento</p>
              <p className="mt-3 font-serif text-xl text-[#1A1A1A]">Experiência próxima do início ao pós-venda</p>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-[15px] leading-7 text-[#5f5a52]">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/quem-somos" className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]">
              Conhecer a marca
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function InstagramEditorialSection({ instagramUrl }: { instagramUrl: string }) {
  return (
    <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-zinc-100">
      <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#D4AF37]">Siga-nos no Instagram</p>
          <h2 className="mt-4 font-serif text-[clamp(2.2rem,3.6vw,3rem)] leading-[1.05] tracking-[-0.03em] text-[#1A1A1A]">
            Conteúdo com cara de vitrine, desejo e inspiração diária
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#666666]">
            Mostramos combinações reais, detalhes de acabamento, ideias de presente e composições para valorizar cada coleção dentro e fora da loja.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-zinc-200 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A7F72]">Looks e composições</span>
            <span className="rounded-full border border-zinc-200 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A7F72]">Novidades da semana</span>
            <span className="rounded-full border border-zinc-200 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A7F72]">Curadoria</span>
          </div>

          <Link href={instagramUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#D4AF37]">
            <Instagram className="h-4 w-4" />
            Acompanhar perfil
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {INSTAGRAM_IMAGES.map((image, index) => (
            <div
              key={image.src}
              className={`relative overflow-hidden rounded-2xl ${index === 0 ? "col-span-2 min-h-[220px] md:col-span-1" : "min-h-[160px] md:min-h-[220px]"}`}
            >
              <Image src={image.src} alt={image.alt} fill sizes="(max-width: 768px) 50vw, 22vw" className="object-cover transition-transform duration-700 hover:scale-105" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
