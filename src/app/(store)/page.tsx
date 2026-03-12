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
const NEWSLETTER_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1400&q=80",
    alt: "Joias douradas em composição sofisticada sobre superfície clara",
  },
  {
    src: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1400&q=80",
    alt: "Acessórios femininos em linguagem visual luxuosa",
  },
  {
    src: "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?auto=format&fit=crop&w=1400&q=80",
    alt: "Braceletes e joias em fotografia editorial clara",
  },
];
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

type RailTheme = {
  accentLabel: string;
  cardSize: "compact" | "regular" | "spacious";
  layout: "left" | "right";
  sectionClassName: string;
  panelClassName: string;
  image: string;
  imageAlt: string;
  chip: string;
};

const HOME_RAIL_THEMES: Record<string, RailTheme> = {
  featured: {
    accentLabel: "Nova campanha",
    cardSize: "spacious",
    layout: "right",
    sectionClassName: "border border-[#e7dcc8] bg-[linear-gradient(135deg,#fffdfa_0%,#f7efe4_100%)]",
    panelClassName: "bg-[linear-gradient(180deg,#2c241c_0%,#16120d_100%)] text-white",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Joias douradas em fotografia de campanha sofisticada",
    chip: "Curadoria de estreia",
  },
  aneis: {
    accentLabel: "Anéis em foco",
    cardSize: "compact",
    layout: "left",
    sectionClassName: "border border-[#d8c4a6] bg-[linear-gradient(135deg,#1a1410_0%,#2a2118_100%)] text-white",
    panelClassName: "bg-white/8 text-white border border-white/10",
    image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Anéis dourados em produção editorial escura",
    chip: "Brilho escultural",
  },
  colares: {
    accentLabel: "Colares em destaque",
    cardSize: "spacious",
    layout: "right",
    sectionClassName: "border border-[#e6dccf] bg-[linear-gradient(180deg,#fbf7f2_0%,#f2eadf_100%)]",
    panelClassName: "bg-[#ffffff]/80 text-[#1A1A1A] border border-white/70",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Colares delicados em composição clara e elegante",
    chip: "Leveza com presença",
  },
  pulseiras: {
    accentLabel: "Pulseiras da vez",
    cardSize: "regular",
    layout: "left",
    sectionClassName: "border border-[#dcc8a7] bg-[linear-gradient(135deg,#f9f4ec_0%,#efe2cf_100%)]",
    panelClassName: "bg-[#fff9f0] text-[#1A1A1A] border border-[#eadcc5]",
    image: "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Pulseiras douradas em fotografia clean de campanha",
    chip: "Elegância cotidiana",
  },
  brincos: {
    accentLabel: "Brincos essenciais",
    cardSize: "compact",
    layout: "right",
    sectionClassName: "border border-[#e8dece] bg-[linear-gradient(180deg,#fffdfa_0%,#f7efe5_100%)]",
    panelClassName: "bg-white/85 text-[#1A1A1A] border border-white/80",
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Brincos com styling clean e refinado",
    chip: "Luz e movimento",
  },
  acessorios: {
    accentLabel: "Acessórios selecionados",
    cardSize: "regular",
    layout: "left",
    sectionClassName: "border border-[#eadfce] bg-[linear-gradient(180deg,#fcfaf6_0%,#f4eee5_100%)]",
    panelClassName: "bg-white/82 text-[#1A1A1A] border border-white/80",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Acessórios femininos em direção de arte luxuosa",
    chip: "Vitrine autoral",
  },
};
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
        theme={HOME_RAIL_THEMES.featured}
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
          theme={HOME_RAIL_THEMES[category.slug] ?? HOME_RAIL_THEMES.acessorios}
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
  theme,
}: {
  eyebrow: string;
  title: string;
  description: string;
  products: StoreProduct[];
  whatsappUrl: string;
  categoryHref?: string;
  anchorId?: string;
  theme: RailTheme;
}) {
  if (!products.length) {
    return null;
  }

  const isPanelLeft = theme.layout === "left";

  return (
    <section id={anchorId} className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-12 scroll-mt-24">
      <div className={`overflow-hidden rounded-[34px] p-4 shadow-[0_30px_70px_-50px_rgba(26,26,26,0.8)] md:p-5 ${theme.sectionClassName}`}>
        <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr] lg:gap-6">
          <div className={`${isPanelLeft ? "lg:order-1" : "lg:order-2"}`}>
            <div className={`flex h-full flex-col overflow-hidden rounded-[28px] p-5 shadow-[0_20px_45px_-35px_rgba(26,26,26,0.8)] md:p-6 ${theme.panelClassName}`}>
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#D4AF37]">{eyebrow}</p>
              <h2 className="mt-3 font-serif text-[clamp(2rem,3vw,2.7rem)] leading-[0.98] tracking-[-0.03em]">{title}</h2>
              <p className="mt-4 text-sm leading-6 text-current/72 md:text-[15px]">{description}</p>

              <div className="mt-6 rounded-full border border-current/15 bg-black/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-current/72 w-fit">
                {theme.chip}
              </div>

              <div className="relative mt-6 min-h-[220px] overflow-hidden rounded-[24px]">
                <Image src={theme.image} alt={theme.imageAlt} fill sizes="(max-width: 1024px) 100vw, 26vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/20 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                  {theme.accentLabel}
                </div>
              </div>

              {categoryHref ? (
                <Link href={categoryHref} className="mt-6 inline-flex items-center gap-2 rounded-full border border-current/18 bg-white/10 px-5 py-3 text-sm font-medium transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] w-fit">
                  Ver coleção
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className={`${isPanelLeft ? "lg:order-2" : "lg:order-1"}`}>
            <div className="mb-4 flex items-center justify-between gap-4 px-1">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-[#8A7F72]">Vitrine da categoria</p>
                <p className="mt-2 font-serif text-[clamp(1.35rem,2vw,1.8rem)] text-[#1A1A1A]">Seleção lateral com navegação fluida</p>
              </div>
            </div>

            <ProductRail
              size={theme.cardSize}
              products={products.map((product) => ({
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                comparePrice: product.comparePrice,
                image: product.image || "",
                category: product.category,
                variantId: product.variants.find((variant) => variant.quantity > 0)?.id ?? product.variants[0]?.id ?? null,
                requiresSelection: product.variants.length > 1,
                whatsappBaseUrl: whatsappUrl,
              }))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterEditorialSection() {
  return (
    <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="grid overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(135deg,#111111_0%,#1f1a15_58%,#6f5630_100%)] shadow-[0_32px_70px_-42px_rgba(17,17,17,0.8)] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="relative z-10 max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#e7cf9a]">Clube Luxijóias</p>
            <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3.35rem)] leading-[0.96] tracking-[-0.03em] text-white">
              Cadastre-se e fique por dentro das promoções
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/78 md:text-[15px]">
              Receba novidades, campanhas sazonais, acesso antecipado a seleções especiais e condições pensadas para quem acompanha a marca de perto.
            </p>

            <div className="mt-8 rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur-md sm:p-6">
              <p className="mb-4 text-sm font-medium text-white">Inscreva-se para receber ofertas e lançamentos em primeira mão.</p>
              <NewsletterSubscribeForm />
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.18em] text-white/72">
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">Lançamentos exclusivos</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">Cupons especiais</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">Curadoria da semana</span>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.22),transparent_35%)]" />
        </div>

        <div className="grid min-h-[340px] grid-cols-2 grid-rows-2 gap-3 bg-[#f6f0e8] p-3 sm:min-h-[420px]">
          <div className="relative col-span-2 overflow-hidden rounded-[26px]">
            <Image src={NEWSLETTER_IMAGES[0].src} alt={NEWSLETTER_IMAGES[0].alt} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
          </div>
          <div className="relative overflow-hidden rounded-[22px]">
            <Image src={NEWSLETTER_IMAGES[1].src} alt={NEWSLETTER_IMAGES[1].alt} fill sizes="(max-width: 1024px) 50vw, 20vw" className="object-cover" />
          </div>
          <div className="relative overflow-hidden rounded-[22px]">
            <Image src={NEWSLETTER_IMAGES[2].src} alt={NEWSLETTER_IMAGES[2].alt} fill sizes="(max-width: 1024px) 50vw, 20vw" className="object-cover" />
          </div>
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
      <div className="grid gap-8 rounded-[32px] border border-zinc-200/80 bg-white p-5 shadow-[0_28px_60px_-44px_rgba(26,26,26,0.65)] md:p-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:p-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="relative min-h-[300px] overflow-hidden rounded-[28px] sm:min-h-[360px]">
            <Image src={ABOUT_IMAGES[0].src} alt={ABOUT_IMAGES[0].alt} fill sizes="(max-width: 1024px) 100vw, 36vw" className="object-cover" />
          </div>
          <div className="relative min-h-[220px] overflow-hidden rounded-[28px] sm:min-h-[360px] lg:min-h-[240px]">
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
    <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="grid gap-6 rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(180deg,#fffdfa_0%,#f8f4ed_100%)] p-5 shadow-[0_28px_60px_-46px_rgba(26,26,26,0.65)] md:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end lg:gap-8 lg:p-10">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#D4AF37]">Siga-nos no Instagram</p>
          <h2 className="mt-4 font-serif text-[clamp(2rem,3.6vw,3rem)] leading-[0.98] tracking-[-0.03em] text-[#1A1A1A]">
            Conteúdo com cara de vitrine, desejo e inspiração diária
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-[#666666]">
            Mostramos combinações reais, detalhes de acabamento, ideias de presente e composições para valorizar cada coleção dentro e fora da loja.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A7F72] shadow-sm">Looks e composições</span>
            <span className="rounded-full bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A7F72] shadow-sm">Novidades da semana</span>
            <span className="rounded-full bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A7F72] shadow-sm">Bastidores da curadoria</span>
          </div>

          <Link href={instagramUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1f1f1f]">
            <Instagram className="h-4 w-4" />
            Acompanhar perfil
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {INSTAGRAM_IMAGES.map((image, index) => (
            <div
              key={image.src}
              className={`relative overflow-hidden rounded-[24px] ${index === 0 ? "col-span-2 row-span-2 min-h-[280px] md:col-span-1 md:min-h-[220px]" : "min-h-[135px] md:min-h-[180px]"}`}
            >
              <Image src={image.src} alt={image.alt} fill sizes="(max-width: 768px) 50vw, 22vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
