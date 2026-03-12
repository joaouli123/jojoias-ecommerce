"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ShieldCheck, Truck, CreditCard, Map } from "lucide-react";
import type { StoreBanner, StoreCategory } from "@/lib/store-data";

const HERO_PRIMARY_FALLBACK = "/banner-home-luxijoias 2.avif";
const HERO_SECONDARY_FALLBACK = "/banner-home-secundario-luxijoias.avif";
const HERO_PRIMARY_MOBILE_FALLBACK = "/banner-celular.avif";
const HERO_SECONDARY_MOBILE_FALLBACK = "/banner-celular-2.avif";
const CATEGORY_FALLBACK_IMAGES = [
  "/demo-products/colar-constelacao.svg",
  "/demo-products/kit-elegance.svg",
  "/demo-products/brinco-gota.svg",
  "/demo-products/anel-aura.svg",
  "/demo-products/argola-glam.svg",
  "/demo-products/pulseira-elos.svg",
  "/demo-products/colar-perola.svg",
  "/demo-products/pulseira-zirconia.svg",
];

function useDragScroll() {
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    hasMoved: false,
  });

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const container = event.currentTarget;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
      hasMoved: false,
    };
    setIsDragging(true);
    container.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    if (!isDragging || dragState.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.current.startX;
    if (Math.abs(deltaX) > 6) {
      dragState.current.hasMoved = true;
    }

    if (dragState.current.hasMoved) {
      event.preventDefault();
    }

    container.scrollLeft = dragState.current.startScrollLeft - deltaX;
  }

  function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (dragState.current.hasMoved) {
      event.preventDefault();
      event.stopPropagation();
      dragState.current.hasMoved = false;
    }
  }

  function stopDragging(event: React.PointerEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    if (dragState.current.pointerId === event.pointerId && container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  }

  return {
    isDragging,
    dragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: stopDragging,
      onPointerCancel: stopDragging,
      onClickCapture,
      onDragStart: (event: React.DragEvent<HTMLDivElement>) => event.preventDefault(),
    },
  };
}

function useSwipeCarousel(totalItems: number) {
  const pointerState = useRef({ startX: 0, pointerId: -1, hasMoved: false });

  function createHandlers(setActiveIndex: React.Dispatch<React.SetStateAction<number>>) {
    function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
      pointerState.current = { startX: event.clientX, pointerId: event.pointerId, hasMoved: false };
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
      if (pointerState.current.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - pointerState.current.startX;
      if (Math.abs(deltaX) > 8) {
        pointerState.current.hasMoved = true;
        event.preventDefault();
      }
    }

    function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
      if (pointerState.current.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - pointerState.current.startX;
      if (Math.abs(deltaX) > 50) {
        setActiveIndex((current) => {
          const nextIndex = deltaX < 0 ? current + 1 : current - 1;
          return (nextIndex + totalItems) % totalItems;
        });
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      pointerState.current.pointerId = -1;
    }

    function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
      if (pointerState.current.hasMoved) {
        event.preventDefault();
        event.stopPropagation();
        pointerState.current.hasMoved = false;
      }
    }

    return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onClickCapture };
  }

  return { createHandlers };
}

function resolveBannerImageUrl(imageUrl: string | null | undefined, fallbackUrl: string) {
  if (!imageUrl) return fallbackUrl;

  if (imageUrl.includes("images.unsplash.com") || imageUrl.includes("plus.unsplash.com")) {
    return fallbackUrl;
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
      draggable={false}
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
  const { isDragging, dragProps } = useDragScroll();

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
          className={`flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar pb-2 pr-6 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ touchAction: "pan-x" }}
          {...dragProps}
        >
          {benefits.map((benefit, i) => (
            <div key={i} className="min-w-[85vw] snap-center rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center gap-4">
                <benefit.icon className="h-8 w-8 shrink-0 stroke-[1.75] text-[#1A1A1A]" />
                <div className="flex flex-col text-left">
                  <strong className="block text-sm font-medium font-serif text-[#1A1A1A] leading-tight">{benefit.title}</strong>
                  <span className="text-xs text-[#666666]">{benefit.subtitle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button 
          type="button"
          onClick={() => scroll("left")}
          aria-label="Ver benefícios anteriores"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md z-20 text-[#1A1A1A]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          type="button"
          onClick={() => scroll("right")}
          aria-label="Ver próximos benefícios"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md z-20 text-[#1A1A1A]"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="hidden md:grid md:grid-cols-4 md:overflow-hidden md:rounded-[26px] md:border md:border-zinc-200 md:bg-white">
        {benefits.map((benefit, i) => (
          <div key={i} className="p-6 lg:p-7 border-r border-zinc-200 last:border-r-0">
            <div className="flex items-center gap-4">
              <benefit.icon className="h-8 w-8 shrink-0 stroke-[1.75] text-[#1A1A1A]" />
              <div className="flex flex-col text-left">
                <strong className="block text-[15px] font-medium font-serif text-[#1A1A1A] leading-tight">{benefit.title}</strong>
                <span className="text-[13px] text-[#666666]">{benefit.subtitle}</span>
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
  const secondaryMobileBannerImage = HERO_SECONDARY_MOBILE_FALLBACK;

  const scroll = (direction: "left" | "right") => {
    setActiveIndex((current) => {
      const nextIndex = direction === "right" ? current + 1 : current - 1;
      return (nextIndex + items.length) % items.length;
    });
  };

  const fallbackBanners: StoreBanner[] = [
    { id: "hero-1", title: "Banner principal", subtitle: null, imageUrl: HERO_PRIMARY_FALLBACK, mobileUrl: HERO_PRIMARY_MOBILE_FALLBACK, href: null, placement: "hero", position: 0 },
    { id: "hero-2", title: "Banner secundário", subtitle: null, imageUrl: secondaryBannerImage, mobileUrl: secondaryMobileBannerImage, href: null, placement: "hero", position: 1 },
  ];

  const items = banners.length >= 2
    ? banners.slice(0, 2)
    : banners.length === 1
      ? [banners[0], fallbackBanners[1]]
      : fallbackBanners;
  const { createHandlers } = useSwipeCarousel(items.length);
  const swipeHandlers = createHandlers(setActiveIndex);

  useEffect(() => {
    if (items.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [items.length]);

  return (
    <section className="group relative mt-4 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 md:mt-6">
      <div className="relative overflow-hidden rounded-2xl shadow-sm md:rounded-3xl" style={{ touchAction: "pan-y pinch-zoom" }} {...swipeHandlers}>
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {items.map((banner) => {
            const isFirstBanner = banner.id === items[0]?.id;
            const desktopImage = resolveBannerImageUrl(
              banner.imageUrl,
              isFirstBanner ? HERO_PRIMARY_FALLBACK : secondaryBannerImage,
            );
            const mobileImage = resolveBannerImageUrl(
              banner.mobileUrl || banner.imageUrl,
              isFirstBanner ? HERO_PRIMARY_MOBILE_FALLBACK : secondaryMobileBannerImage,
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
                    fallbackSrc={isFirstBanner ? HERO_PRIMARY_MOBILE_FALLBACK : secondaryMobileBannerImage}
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
              <Link key={banner.id} href={href} draggable={false} className="relative block h-[50vh] min-w-full select-none cursor-grab active:cursor-grabbing md:h-[480px]" onDragStart={(event) => event.preventDefault()}>
                {content}
              </Link>
            );
          })}
        </div>

        {items.length > 1 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Ir para banner ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`pointer-events-auto h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-white" : "w-2.5 bg-white/50"}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function SecondaryBanners({ banners = [] }: { banners?: StoreBanner[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { isDragging, dragProps } = useDragScroll();

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
        className={`flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar pb-2 pr-6 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 ${isDragging ? "cursor-grabbing" : "cursor-grab md:cursor-default"}`}
        style={{ touchAction: "pan-x" }}
        {...dragProps}
      >
        {items.map((banner, index) => {
          const imageUrl = resolveBannerImageUrl(banner.imageUrl, fallbackImages[index] || fallbackImages[0]);

          return (
          <Link key={banner.id} href={banner.href || "/"} draggable={false} className="relative block h-[220px] min-w-[85vw] snap-center overflow-hidden rounded-xl bg-white select-none md:h-[250px] md:min-w-0">
            <Image
              src={imageUrl}
              alt={banner.title || "Banner promocional da Luxijóias"}
              fill
              draggable={false}
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
  const { isDragging, dragProps } = useDragScroll();

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

  const items = (categories.length ? categories : fallbackCategories).slice(0, 8);

  useEffect(() => {
    const container = scrollRef.current;
    const child = container?.children[activeIndex] as HTMLElement | undefined;
    if (!container || !child) return;
    container.scrollTo({ left: child.offsetLeft - 12, behavior: "smooth" });
  }, [activeIndex]);

  return (
    <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative">
      <h2 className="mb-8 text-center font-serif text-[clamp(2.2rem,3.6vw,3rem)] font-medium tracking-[-0.03em] text-[#1A1A1A]">Compre por Categoria</h2>
      
      <div className="relative group">
        <div 
          ref={scrollRef}
          className={`flex overflow-x-auto snap-x snap-mandatory gap-5 no-scrollbar px-1 pb-2 pr-8 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ touchAction: "pan-x pinch-zoom" }}
          {...dragProps}
        >
          {items.map((cat, i) => (
            <Link key={i} href={"/categoria/" + cat.slug} draggable={false} onDragStart={(event) => event.preventDefault()} className="block min-w-[150px] shrink-0 snap-start select-none group/cat sm:min-w-[180px]">
              <div className="relative h-[180px] w-[150px] overflow-hidden rounded-[22px] border border-zinc-200 bg-zinc-100 shadow-sm transition-all duration-300 group-hover/cat:shadow-md sm:h-[220px] sm:w-[180px]">
                <Image
                  src={CATEGORY_FALLBACK_IMAGES[i % CATEGORY_FALLBACK_IMAGES.length]}
                  alt={cat.name}
                  fill
                  draggable={false}
                  sizes="(max-width: 640px) 150px, 180px"
                  className="object-cover transform group-hover/cat:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover/cat:opacity-90" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-center">
                  <span className="text-[15px] font-medium leading-tight text-white drop-shadow-lg sm:text-[18px]">
                    {cat.name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button 
          type="button"
          onClick={() => scroll("left")}
          aria-label="Ver categorias anteriores"
          className="hidden md:flex absolute -left-4 md:left-0 top-[33%] -translate-y-1/2 w-12 h-12 items-center justify-center bg-zinc-200/80 rounded-full z-10 text-[#666666] xl:hidden"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          type="button"
          onClick={() => scroll("right")}
          aria-label="Ver próximas categorias"
          className="hidden md:flex absolute -right-4 md:right-0 top-[33%] -translate-y-1/2 w-12 h-12 items-center justify-center bg-zinc-200/80 rounded-full z-10 text-[#666666] xl:hidden"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
