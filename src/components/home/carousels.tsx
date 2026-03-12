"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ShieldCheck, Truck, CreditCard, Map } from "lucide-react";
import type { StoreBanner, StoreCategory } from "@/lib/store-data";

const HERO_PRIMARY_FALLBACK = "/banner 1.png";
const HERO_SECONDARY_FALLBACK = "/banner-home-secundario-luxijoias.avif";

function resolveBannerImageUrl(imageUrl: string | null | undefined, fallbackUrl: string) {
  if (!imageUrl) return fallbackUrl;

  if (imageUrl.includes("images.unsplash.com") || imageUrl.includes("plus.unsplash.com")) {
    return fallbackUrl;
  }

  if (imageUrl === "/banner-home-luxijoias.avif") {
    return HERO_PRIMARY_FALLBACK;
  }

  if (imageUrl === "/banner-home-luxijoias 2.avif") {
    return HERO_SECONDARY_FALLBACK;
  }

  return imageUrl;
}

function BannerSlideImage({
  src,
  fallbackSrc,
  alt,
  priority,
  loading,
  fetchPriority,
  className,
}: {
  src: string;
  fallbackSrc: string;
  alt: string;
  priority: boolean;
  loading: "eager" | "lazy";
  fetchPriority?: "high";
  className: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      priority={priority}
      quality={60}
      fetchPriority={fetchPriority}
      loading={loading}
      sizes="100vw"
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}

export function BenefitsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const benefits = [
    { icon: ShieldCheck, title: "Loja 100% segura", subtitle: "selo de segurança" },
    { icon: Map, title: "Entregamos", subtitle: "em todo o Brasil" },
    { icon: CreditCard, title: "Parcele suas compras", subtitle: "em até 12x" },
    { icon: Truck, title: "Frete grátis", subtitle: "para SP" },
  ];

  useEffect(() => {
    const container = scrollRef.current;
    const child = container?.children[activeIndex] as HTMLElement | undefined;
    if (!container || !child) return;
    container.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  }, [activeIndex]);

  const scroll = (direction: "left" | "right") => {
    setActiveIndex((current) => {
      const nextIndex = direction === "right" ? current + 1 : current - 1;
      return (nextIndex + benefits.length) % benefits.length;
    });
  };

  return (
    <section className="bg-white pt-8 md:pt-12 relative max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:hidden relative">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar pb-2"
        >
          {benefits.map((benefit, i) => (
            <div key={i} className="min-w-[85vw] snap-center rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center gap-4">
                <benefit.icon className="w-8 h-8 stroke-[1.5] text-zinc-900 shrink-0" />
                <div className="flex flex-col text-left">
                  <strong className="block text-sm font-bold text-zinc-950 leading-tight">{benefit.title}</strong>
                  <span className="text-xs text-zinc-600">{benefit.subtitle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button 
          type="button"
          onClick={() => scroll("left")}
          aria-label="Ver benefícios anteriores"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md z-20 text-zinc-900"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          type="button"
          onClick={() => scroll("right")}
          aria-label="Ver próximos benefícios"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md z-20 text-zinc-900"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="hidden md:grid md:grid-cols-4 md:overflow-hidden md:rounded-[26px] md:border md:border-zinc-200 md:bg-white">
        {benefits.map((benefit, i) => (
          <div key={i} className="p-6 lg:p-7 border-r border-zinc-200 last:border-r-0">
            <div className="flex items-center gap-4">
              <benefit.icon className="w-8 h-8 stroke-[1.5] text-zinc-900 shrink-0" />
              <div className="flex flex-col text-left">
                <strong className="block text-[15px] font-bold text-zinc-950 leading-tight">{benefit.title}</strong>
                <span className="text-[13px] text-zinc-600">{benefit.subtitle}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BannerCarousel({ banners = [] }: { banners?: StoreBanner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const secondaryBannerImage = HERO_SECONDARY_FALLBACK;

  const scroll = (direction: "left" | "right") => {
    setActiveIndex((current) => {
      const nextIndex = direction === "right" ? current + 1 : current - 1;
      return (nextIndex + items.length) % items.length;
    });
  };

  const fallbackBanners: StoreBanner[] = [
    { id: "hero-1", title: "Banner principal", subtitle: null, imageUrl: HERO_PRIMARY_FALLBACK, mobileUrl: null, href: null, placement: "hero", position: 0 },
    { id: "hero-2", title: "Banner secundário", subtitle: null, imageUrl: secondaryBannerImage, mobileUrl: secondaryBannerImage, href: null, placement: "hero", position: 1 },
  ];

  const items = banners.length
    ? [
        ...banners,
        ...fallbackBanners.filter((fallbackBanner) => !banners.some((banner) => banner.id === fallbackBanner.id)),
      ].slice(0, Math.max(2, banners.length))
    : fallbackBanners;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6 relative group">
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {items.map((banner) => {
            const isFirstBanner = banner.id === items[0]?.id;
            const desktopImage = resolveBannerImageUrl(
              banner.imageUrl,
              isFirstBanner ? HERO_PRIMARY_FALLBACK : secondaryBannerImage,
            );
            const mobileImage = resolveBannerImageUrl(
              banner.mobileUrl || banner.imageUrl,
              isFirstBanner ? HERO_PRIMARY_FALLBACK : secondaryBannerImage,
            );
            const imageAlt = banner.title || "Banner principal da loja";
            const content = (
              <>
                <div className="absolute inset-0 hidden md:block">
                  <BannerSlideImage
                    src={desktopImage}
                    fallbackSrc={isFirstBanner ? HERO_PRIMARY_FALLBACK : secondaryBannerImage}
                    alt={imageAlt}
                    priority={isFirstBanner}
                    fetchPriority={isFirstBanner ? "high" : undefined}
                    loading={isFirstBanner ? "eager" : "lazy"}
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 md:hidden">
                  <BannerSlideImage
                    src={mobileImage}
                    fallbackSrc={isFirstBanner ? HERO_PRIMARY_FALLBACK : secondaryBannerImage}
                    alt={imageAlt}
                    priority={isFirstBanner}
                    fetchPriority={isFirstBanner ? "high" : undefined}
                    loading={isFirstBanner ? "eager" : "lazy"}
                    className="object-cover"
                  />
                </div>
              </>
            );

            const href = banner.href || "/";

            return (
              <Link key={banner.id} href={href} className="relative min-w-full h-[50vh] md:h-[480px] block">
                {content}
              </Link>
            );
          })}
        </div>
        
        <button 
          type="button"
          onClick={() => scroll("left")}
          aria-label="Ver banner anterior"
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-11 h-11 hidden md:flex items-center justify-center bg-white/95 rounded-full shadow-lg z-20 text-zinc-900 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          type="button"
          onClick={() => scroll("right")}
          aria-label="Ver próximo banner"
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-11 h-11 hidden md:flex items-center justify-center bg-white/95 rounded-full shadow-lg z-20 text-zinc-900 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}

export function SecondaryBanners({ banners = [] }: { banners?: StoreBanner[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (direction: "left" | "right") => {
    setActiveIndex((current) => {
      const nextIndex = direction === "right" ? current + 1 : current - 1;
      return (nextIndex + items.length) % items.length;
    });
  };

  const fallbackBanners: StoreBanner[] = [
    { id: "secondary-1", title: "Coleção premium", subtitle: null, imageUrl: "/demo-products/colar-constelacao.svg", mobileUrl: null, href: "/search?q=colecao", placement: "secondary", position: 0 },
    { id: "secondary-2", title: "Novidades", subtitle: null, imageUrl: "/demo-products/kit-elegance.svg", mobileUrl: null, href: "/search?q=novidades", placement: "secondary", position: 1 },
    { id: "secondary-3", title: "Presentes", subtitle: null, imageUrl: "/demo-products/brinco-gota.svg", mobileUrl: null, href: "/search?q=presentes", placement: "secondary", position: 2 },
  ];

  const items = (banners.length ? banners : fallbackBanners).slice(0, 3);
  const fallbackImages = [
    "/demo-products/colar-constelacao.svg",
    "/demo-products/kit-elegance.svg",
    "/demo-products/brinco-gota.svg",
  ];

  useEffect(() => {
    const container = scrollRef.current;
    const child = container?.children[activeIndex] as HTMLElement | undefined;
    if (!container || !child) return;
    container.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  }, [activeIndex]);

  return (
    <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 relative group">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0"
      >
        {items.map((banner, index) => {
          const imageUrl = resolveBannerImageUrl(banner.imageUrl, fallbackImages[index] || fallbackImages[0]);

          return (
          <Link key={banner.id} href={banner.href || "/"} className="min-w-[85vw] md:min-w-0 h-[220px] md:h-[250px] snap-center rounded-xl overflow-hidden relative block bg-white">
            <Image
              src={imageUrl}
              alt={banner.title || "Banner promocional da Luxijóias"}
              fill
              quality={55}
              sizes="(max-width: 768px) 85vw, 33vw"
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
          </Link>
          );
        })}
      </div>

      <button 
        type="button"
        onClick={() => scroll("left")}
        aria-label="Ver promoções anteriores"
        className="hidden"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        type="button"
        onClick={() => scroll("right")}
        aria-label="Ver próximas promoções"
        className="hidden"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>
  );
}

export function CategoriesCarousel({ categories = [] }: { categories?: StoreCategory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (direction: "left" | "right") => {
    setActiveIndex((current) => {
      const nextIndex = direction === "right" ? current + 1 : current - 1;
      return (nextIndex + items.length) % items.length;
    });
  };

  const fallbackCategories = [
    { name: "Acessórios", slug: "acessorios" },
    { name: "Colares", slug: "colares" },
    { name: "Anéis", slug: "aneis" },
    { name: "Pulseiras", slug: "pulseiras" },
    { name: "Brincos", slug: "brincos" },
    { name: "Presentes", slug: "presentes" },
  ];

  const categoryImages = [
    "/demo-products/kit-elegance.svg",
    "/demo-products/colar-constelacao.svg",
    "/demo-products/anel-aura.svg",
    "/demo-products/pulseira-elos.svg",
    "/demo-products/brinco-gota.svg",
    "/demo-products/mix-aneis.svg",
  ];

  const items = (categories.length ? categories : fallbackCategories).slice(0, 8);

  useEffect(() => {
    const container = scrollRef.current;
    const child = container?.children[activeIndex] as HTMLElement | undefined;
    if (!container || !child) return;
    container.scrollTo({ left: child.offsetLeft - 12, behavior: "smooth" });
  }, [activeIndex]);

  return (
    <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative">
      <h2 className="text-3xl font-medium text-[#1A1A1A] font-serif tracking-tight mb-8 text-center">Compre por Categoria</h2>
      
      <div className="relative group">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-5 no-scrollbar pb-2 xl:justify-center"
        >
          {items.map((cat, i) => (
            <Link key={i} href={"/categoria/" + cat.slug} className="min-w-[132px] snap-center block shrink-0 text-center group/cat">
              <div className="w-[132px] h-[132px] rounded-full overflow-hidden relative border border-zinc-200 bg-white">
                <Image
                  src={categoryImages[i % categoryImages.length]}
                  alt=""
                  fill
                  sizes="132px"
                  className="object-cover transform group-hover/cat:scale-110 transition-transform duration-700"
                />
              </div>
              <span className="mt-4 block text-[17px] text-zinc-900 font-bold tracking-tight">{cat.name}</span>
            </Link>
          ))}
        </div>

        <button 
          type="button"
          onClick={() => scroll("left")}
          aria-label="Ver categorias anteriores"
          className="hidden md:flex absolute -left-4 md:left-0 top-[33%] -translate-y-1/2 w-12 h-12 items-center justify-center bg-zinc-200/80 rounded-full z-10 text-zinc-700 xl:hidden"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          type="button"
          onClick={() => scroll("right")}
          aria-label="Ver próximas categorias"
          className="hidden md:flex absolute -right-4 md:right-0 top-[33%] -translate-y-1/2 w-12 h-12 items-center justify-center bg-zinc-200/80 rounded-full z-10 text-zinc-700 xl:hidden"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
