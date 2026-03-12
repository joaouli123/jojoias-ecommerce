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

const CATEGORY_EDITORIAL_IMAGES: Record<string, string> = {
  acessorios: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80",
  colares: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80",
  aneis: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=80",
  pulseiras: "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?auto=format&fit=crop&w=900&q=80",
  brincos: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=900&q=80",
  presentes: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=80",
  promocoes: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80",
};

const SLIDE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function animateHorizontalScroll(container: HTMLDivElement, targetLeft: number, duration = 820) {
  const startLeft = container.scrollLeft;
  const delta = targetLeft - startLeft;

  if (Math.abs(delta) < 1) return;

  const startTime = performance.now();

  const easeOutQuint = (progress: number) => 1 - Math.pow(1 - progress, 5);

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    container.scrollLeft = startLeft + delta * easeOutQuint(progress);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

export function useDragScroll() {
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    hasMoved: false,
    isTouch: false,
  });

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const container = event.currentTarget;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
      hasMoved: false,
      isTouch: event.pointerType === "touch",
    };
    setIsDragging(true);

    if (event.pointerType !== "touch") {
      container.setPointerCapture(event.pointerId);
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    if (dragState.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.current.startX;
    if (Math.abs(deltaX) > 6) {
      dragState.current.hasMoved = true;
    }

    if (dragState.current.isTouch) {
      return;
    }

    if (dragState.current.hasMoved) {
      event.preventDefault();
    }

    container.scrollLeft = dragState.current.startScrollLeft - deltaX;
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;

    dragState.current = {
      pointerId: -1,
      startX: touch.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      hasMoved: false,
      isTouch: true,
    };
    setIsDragging(true);
  }

  function onTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;

    if (Math.abs(touch.clientX - dragState.current.startX) > 6) {
      dragState.current.hasMoved = true;
    }
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
    dragState.current.pointerId = -1;
    setIsDragging(false);
  }

  function stopTouchDragging() {
    setIsDragging(false);
  }

  return {
    isDragging,
    dragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: stopDragging,
      onPointerCancel: stopDragging,
      onTouchStart,
      onTouchMove,
      onTouchEnd: stopTouchDragging,
      onTouchCancel: stopTouchDragging,
      onClickCapture,
      onDragStart: (event: React.DragEvent<HTMLDivElement>) => event.preventDefault(),
    },
  };
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
    animateHorizontalScroll(container, child.offsetLeft, 760);
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
          style={{ touchAction: "pan-x pan-y pinch-zoom", WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
          {...dragProps}
        >
          {benefits.map((benefit, i) => (
            <div key={i} className="min-w-[85vw] snap-center rounded-2xl border border-zinc-200 bg-white p-6 transition-transform duration-500 ease-out will-change-transform">
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
  const secondaryBannerImage = HERO_SECONDARY_FALLBACK;
  const secondaryMobileBannerImage = HERO_SECONDARY_MOBILE_FALLBACK;
  const sliderRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef({ startX: 0, startY: 0, currentX: 0, pointerId: -1, hasMoved: false, lockAxis: null as "x" | "y" | null });
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const fallbackBanners: StoreBanner[] = [
    { id: "hero-1", title: "Banner principal", subtitle: null, imageUrl: HERO_PRIMARY_FALLBACK, mobileUrl: HERO_PRIMARY_MOBILE_FALLBACK, href: null, placement: "hero", position: 0 },
    { id: "hero-2", title: "Banner secundário", subtitle: null, imageUrl: secondaryBannerImage, mobileUrl: secondaryMobileBannerImage, href: null, placement: "hero", position: 1 },
  ];

  const baseItems = banners.length >= 2
    ? banners.slice(0, 2)
    : banners.length === 1
      ? [banners[0], fallbackBanners[1]]
      : fallbackBanners;

  const loopedItems = baseItems.length > 1
    ? [baseItems[baseItems.length - 1], ...baseItems, baseItems[0]]
    : baseItems;

  const [activeIndex, setActiveIndex] = useState(baseItems.length > 1 ? 1 : 0);
  const [isAnimating, setIsAnimating] = useState(true);
  const logicalIndex = baseItems.length > 1 ? (activeIndex - 1 + baseItems.length) % baseItems.length : activeIndex;

  useEffect(() => {
    setIsAnimating(false);
    setActiveIndex(baseItems.length > 1 ? 1 : 0);

    const animationFrame = window.requestAnimationFrame(() => {
      setIsAnimating(true);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [baseItems.length]);

  function moveSlide(direction: "left" | "right") {
    if (baseItems.length <= 1) return;

    setIsAnimating(true);
    setActiveIndex((current) => current + (direction === "right" ? 1 : -1));
  }

  function jumpToSlide(index: number) {
    if (baseItems.length <= 1) return;

    setIsAnimating(true);
    setActiveIndex(index + 1);
  }

  function beginSwipe(startX: number, startY: number, pointerId = -1) {
    pointerState.current = { startX, startY, currentX: startX, pointerId, hasMoved: false, lockAxis: null };
    setIsDragging(true);
    setIsAutoPaused(true);
  }

  function updateSwipe(currentX: number, currentY: number) {
    const deltaX = currentX - pointerState.current.startX;
    const deltaY = currentY - pointerState.current.startY;

    if (!pointerState.current.lockAxis && (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6)) {
      pointerState.current.lockAxis = Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y";
    }

    if (pointerState.current.lockAxis === "y") {
      return false;
    }

    pointerState.current.currentX = currentX;
    pointerState.current.hasMoved = Math.abs(deltaX) > 8;
    setDragOffset(deltaX);
    return pointerState.current.hasMoved;
  }

  function finishSwipe() {
    const deltaX = pointerState.current.currentX - pointerState.current.startX;

    if (pointerState.current.lockAxis !== "y" && Math.abs(deltaX) > 30) {
      moveSlide(deltaX < 0 ? "right" : "left");
    }

    pointerState.current = { startX: 0, startY: 0, currentX: 0, pointerId: -1, hasMoved: false, lockAxis: null };
    setDragOffset(0);
    setIsDragging(false);
    setIsAutoPaused(false);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    beginSwipe(event.clientX, event.clientY, event.pointerId);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerState.current.pointerId !== event.pointerId || !isDragging) return;

    if (updateSwipe(event.clientX, event.clientY)) {
      event.preventDefault();
    }
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerState.current.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    finishSwipe();
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;

    beginSwipe(touch.clientX, touch.clientY);
  }

  function onTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch || !isDragging) return;

    if (updateSwipe(touch.clientX, touch.clientY)) {
      event.preventDefault();
    }
  }

  function onTouchEnd() {
    finishSwipe();
  }

  function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (pointerState.current.hasMoved) {
      event.preventDefault();
      event.stopPropagation();
      pointerState.current.hasMoved = false;
    }
  }

  function onTransitionEnd() {
    if (baseItems.length <= 1) return;

    if (activeIndex === 0) {
      setIsAnimating(false);
      setActiveIndex(baseItems.length);
      return;
    }

    if (activeIndex === loopedItems.length - 1) {
      setIsAnimating(false);
      setActiveIndex(1);
      return;
    }
  }

  useEffect(() => {
    if (isAnimating) return;

    const animationFrame = window.requestAnimationFrame(() => {
      setIsAnimating(true);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [isAnimating]);

  useEffect(() => {
    if (baseItems.length <= 1) return;
    if (isAutoPaused) return;

    const intervalId = window.setInterval(() => {
      moveSlide("right");
    }, 6800);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [baseItems.length, isAutoPaused]);

  return (
    <section className="group relative mt-4 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 md:mt-6">
      <div
        ref={sliderRef}
        className="relative overflow-hidden rounded-[28px] border border-white/70 shadow-[0_22px_60px_-34px_rgba(26,26,26,0.45)] md:rounded-[36px]"
        style={{ touchAction: "pan-y pinch-zoom" }}
        onMouseEnter={() => setIsAutoPaused(true)}
        onMouseLeave={() => setIsAutoPaused(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClickCapture={onClickCapture}
      >
        <div
          className={`flex will-change-transform ${isDragging ? "transition-none" : isAnimating ? "transition-transform duration-[620ms]" : "transition-none"}`}
          style={{
            transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))`,
            transitionTimingFunction: isAnimating ? SLIDE_EASE : undefined,
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {loopedItems.map((banner, index) => {
            const realIndex = baseItems.length > 1 ? (index - 1 + baseItems.length) % baseItems.length : index;
            const isFirstBanner = realIndex === 0;
            const isActiveSlide = realIndex === logicalIndex;
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
                    className={`object-cover transition-transform duration-[1400ms] ${isActiveSlide ? "scale-100" : "scale-[1.035]"}`}
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
                    className={`object-cover transition-transform duration-[1400ms] ${isActiveSlide ? "scale-100" : "scale-[1.03]"}`}
                  />
                </div>
              </>
            );

            const href = banner.href || "/";

            return (
              <Link key={banner.id} href={href} draggable={false} className="relative block h-[50vh] min-w-full select-none cursor-grab active:cursor-grabbing md:h-[480px]" onDragStart={(event) => event.preventDefault()}>
                {content}
                <div className={`absolute inset-0 bg-gradient-to-t from-[#120f0b]/20 via-transparent to-transparent transition-opacity duration-[1000ms] ${isActiveSlide ? "opacity-100" : "opacity-70"}`} />
                <div className="absolute inset-x-0 bottom-0 hidden md:flex items-end justify-between p-6 lg:p-8">
                  <div className={`max-w-md rounded-[24px] border border-white/35 bg-white/12 px-5 py-4 text-white backdrop-blur-md transition-all duration-[1100ms] ${isActiveSlide ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/80">Coleção em destaque</p>
                    <p className="mt-2 font-serif text-[clamp(1.2rem,1.6vw,1.7rem)] leading-tight text-white">
                      {banner.title || "Brilho autoral para ocasiões especiais"}
                    </p>
                  </div>
                  <span className={`rounded-full border border-white/40 bg-black/20 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-all duration-[1100ms] ${isActiveSlide ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
                    Deslize para ver mais
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {baseItems.length > 1 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
            {baseItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Ir para banner ${index + 1}`}
                onClick={() => jumpToSlide(index)}
                className={`pointer-events-auto h-2.5 rounded-full transition-all ${index === logicalIndex ? "w-8 bg-white" : "w-2.5 bg-white/50"}`}
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
    animateHorizontalScroll(container, child.offsetLeft, 800);
  }, [activeIndex]);

  return (
    <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 relative group">
      <div 
        ref={scrollRef}
        className={`flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar pb-2 pr-6 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 ${isDragging ? "cursor-grabbing" : "cursor-grab md:cursor-default"}`}
        style={{ touchAction: "pan-x pan-y pinch-zoom", WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
        {...dragProps}
      >
        {items.map((banner, index) => {
          const imageUrl = resolveBannerImageUrl(banner.imageUrl, fallbackImages[index] || fallbackImages[0]);

          return (
          <Link key={banner.id} href={banner.href || "/"} draggable={false} className="relative block h-[220px] min-w-[85vw] snap-center overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white select-none shadow-[0_18px_38px_-30px_rgba(26,26,26,0.4)] transition-transform duration-500 ease-out will-change-transform md:h-[250px] md:min-w-0">
            <Image
              src={imageUrl}
              alt={banner.title || "Banner promocional da Luxijóias"}
              fill
              draggable={false}
              quality={55}
              sizes="(max-width: 768px) 85vw, 33vw"
              className="object-cover transition-transform duration-[900ms] ease-out hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/40 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/70">Seleção especial</p>
              <p className="mt-2 max-w-[18ch] font-serif text-xl leading-tight">{banner.title || "Descubra novos detalhes"}</p>
            </div>
          </Link>
          );
        })}
      </div>
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
    animateHorizontalScroll(container, child.offsetLeft - 12, 860);
  }, [activeIndex]);

  return (
    <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative">
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#D4AF37]">Categorias em destaque</p>
        <h2 className="mt-3 text-center font-serif text-[clamp(2.2rem,3.6vw,3rem)] font-medium tracking-[-0.03em] text-[#1A1A1A]">Compre por Categoria</h2>
      </div>
      
      <div className="relative group">
        <div 
          ref={scrollRef}
          className={`flex overflow-x-auto snap-x snap-mandatory gap-5 no-scrollbar px-2 pb-12 pt-6 pr-8 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ touchAction: "pan-x pan-y pinch-zoom", WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
          {...dragProps}
        >
          {items.map((cat, i) => (
            <Link key={i} href={"/categoria/" + cat.slug} draggable={false} onDragStart={(event) => event.preventDefault()} className="block min-w-[124px] shrink-0 snap-start select-none group/cat sm:min-w-[156px]">
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-[124px] w-[124px] overflow-hidden rounded-full border border-zinc-200 bg-white p-[3px] shadow-[0_18px_35px_-26px_rgba(26,26,26,0.55)] transition-all duration-500 ease-out group-hover/cat:-translate-y-1 group-hover/cat:border-zinc-300 group-hover/cat:shadow-[0_24px_42px_-24px_rgba(26,26,26,0.65)] sm:h-[156px] sm:w-[156px]">
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    <Image
                      src={CATEGORY_EDITORIAL_IMAGES[cat.slug] || CATEGORY_FALLBACK_IMAGES[i % CATEGORY_FALLBACK_IMAGES.length]}
                      alt={cat.name}
                      fill
                      draggable={false}
                      sizes="(max-width: 640px) 124px, 156px"
                      className="object-cover transform transition-transform duration-[1100ms] ease-out group-hover/cat:scale-[1.08]"
                    />
                    <div className="absolute inset-0 rounded-full ring-1 ring-zinc-200/70" />
                  </div>
                </div>
                <span className="sr-only">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
