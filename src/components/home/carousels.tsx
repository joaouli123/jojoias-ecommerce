"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ShieldCheck, Truck, CreditCard, Map } from "lucide-react";
import type { StoreBanner, StoreCategory } from "@/lib/store-data";

function resolveBannerImageUrl(imageUrl: string | null | undefined, fallbackUrl: string) {
  if (!imageUrl) return fallbackUrl;

  if (imageUrl.includes("images.unsplash.com") || imageUrl.includes("plus.unsplash.com")) {
    return fallbackUrl;
  }

  return imageUrl;
}

export function BenefitsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const benefits = [
    { icon: ShieldCheck, title: "Loja 100% segura", subtitle: "selo de segurança" },
    { icon: Map, title: "Entregamos", subtitle: "em todo o Brasil" },
    { icon: CreditCard, title: "Parcele suas compras", subtitle: "em até 12x" },
    { icon: Truck, title: "Frete grátis", subtitle: "para SP" },
  ];

  return (
    <section className="bg-white pt-8 md:pt-12 relative group max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-2 py-6 md:px-0 relative w-full">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-4 items-center w-full"
        >
          {benefits.map((benefit, i) => (
            <div key={i} className={`flex items-center px-2 min-w-full md:min-w-0 snap-center justify-center w-full group/item ${i !== benefits.length - 1 ? 'md:border-r md:border-zinc-200' : ''}`}>
              <div className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-zinc-100/50 w-full justify-center">
                <benefit.icon className="w-8 h-8 stroke-[1.5] text-zinc-900 shrink-0" />
                <div className="flex flex-col text-left">
                  <strong className="block text-sm md:text-[15px] font-bold text-zinc-950 leading-tight">{benefit.title}</strong>
                  <span className="text-xs md:text-[13px] text-zinc-600">{benefit.subtitle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        type="button"
        onClick={() => scroll("left")}
        aria-label="Ver benefícios anteriores"
        className="absolute left-1 top-[55%] -translate-y-1/2 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg z-10 text-zinc-900 md:hidden flex"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        type="button"
        onClick={() => scroll("right")}
        aria-label="Ver próximos benefícios"
        className="absolute right-1 top-[55%] -translate-y-1/2 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg z-10 text-zinc-900 md:hidden flex"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>
  );
}

export function BannerCarousel({ banners = [] }: { banners?: StoreBanner[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -scrollRef.current.clientWidth : scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const fallbackBanners: StoreBanner[] = [
    { id: "hero-1", title: "Banner principal", subtitle: null, imageUrl: "/banner-home-jojoias.avif", mobileUrl: null, href: null, placement: "hero", position: 0 },
    { id: "hero-2", title: "Coleção Premium", subtitle: "Peças com brilho elegante e acabamento refinado.", imageUrl: "/demo-products/banner-hero.svg", mobileUrl: "/demo-products/banner-hero.svg", href: "/search?q=colecao", placement: "hero", position: 1 },
  ];

  const items = banners.length ? banners : fallbackBanners;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6 relative group">
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >
          {items.map((banner) => {
            const isFirstBanner = banner.id === items[0]?.id;
            const desktopImage = resolveBannerImageUrl(
              banner.imageUrl,
              isFirstBanner ? "/banner-home-jojoias.avif" : "/demo-products/banner-hero.svg",
            );
            const mobileImage = resolveBannerImageUrl(
              banner.mobileUrl || banner.imageUrl,
              isFirstBanner ? "/banner-home-jojoias.avif" : "/demo-products/banner-hero.svg",
            );
            const hasVisibleCopy = Boolean(banner.title || banner.subtitle);
            const imageAlt = banner.href && hasVisibleCopy ? "" : banner.title || "Banner principal da loja";
            const content = (
              <>
                <div className="absolute inset-0 hidden md:block">
                  <Image
                    src={desktopImage}
                    alt={imageAlt}
                    fill
                    priority={isFirstBanner}
                    fetchPriority={isFirstBanner ? "high" : undefined}
                    loading={isFirstBanner ? "eager" : "lazy"}
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 md:hidden">
                  <Image
                    src={mobileImage}
                    alt={imageAlt}
                    fill
                    priority={isFirstBanner}
                    fetchPriority={isFirstBanner ? "high" : undefined}
                    loading={isFirstBanner ? "eager" : "lazy"}
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
                {(banner.title || banner.subtitle) ? (
                  <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white md:p-10">
                    <div className="max-w-xl">
                      <h2 className="text-2xl font-black tracking-tight md:text-4xl">{banner.title}</h2>
                      {banner.subtitle ? <p className="mt-3 text-sm leading-6 text-white/90 md:text-base">{banner.subtitle}</p> : null}
                    </div>
                  </div>
                ) : null}
              </>
            );

            return banner.href ? (
              <Link key={banner.id} href={banner.href} className="relative min-w-full h-[50vh] md:h-[480px] snap-center block">
                {content}
              </Link>
            ) : (
              <div key={banner.id} className="min-w-full h-[50vh] md:h-[480px] snap-center relative">
                {content}
              </div>
            );
          })}
        </div>
        
        <button 
          type="button"
          onClick={() => scroll("left")}
          aria-label="Ver banner anterior"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-md z-10 text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity md:flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          type="button"
          onClick={() => scroll("right")}
          aria-label="Ver próximo banner"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-md z-10 text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity md:flex"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}

export function SecondaryBanners({ banners = [] }: { banners?: StoreBanner[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
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

  return (
    <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 relative group">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0"
      >
        {items.map((banner, index) => {
          const imageUrl = resolveBannerImageUrl(banner.imageUrl, fallbackImages[index] || fallbackImages[0]);

          return (
          <Link key={banner.id} href={banner.href || "/"} className="min-w-[85vw] md:min-w-0 h-[220px] md:h-[250px] snap-center rounded-xl overflow-hidden relative block group/banner border border-zinc-200 bg-white">
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 85vw, 33vw"
              className="object-cover transform group-hover/banner:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
              <h3 className="text-lg font-bold tracking-tight">{banner.title}</h3>
              {banner.subtitle ? <p className="mt-1 text-sm text-white/90">{banner.subtitle}</p> : null}
            </div>
          </Link>
          );
        })}
      </div>

      <button 
        type="button"
        onClick={() => scroll("left")}
        aria-label="Ver promoções anteriores"
        className="absolute left-1 md:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg z-10 text-zinc-900 group-hover:opacity-100 transition-opacity flex md:hidden"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        type="button"
        onClick={() => scroll("right")}
        aria-label="Ver próximas promoções"
        className="absolute right-1 md:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg z-10 text-zinc-900 group-hover:opacity-100 transition-opacity flex md:hidden"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>
  );
}

export function CategoriesCarousel({ categories = [] }: { categories?: StoreCategory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
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

  return (
    <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative">
      <h2 className="text-3xl font-black text-zinc-950 tracking-tight mb-8 text-center">Compre por Categoria</h2>
      
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
          className="absolute -left-4 md:left-0 top-[33%] -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-zinc-200/80 rounded-full z-10 text-zinc-700 xl:hidden"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          type="button"
          onClick={() => scroll("right")}
          aria-label="Ver próximas categorias"
          className="absolute -right-4 md:right-0 top-[33%] -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-zinc-200/80 rounded-full z-10 text-zinc-700 xl:hidden"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
