"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";

type ProductRailItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  image: string;
  category: string;
  variantId?: string | null;
  requiresSelection?: boolean;
  whatsappBaseUrl?: string;
};

type ProductRailProps = {
  products: ProductRailItem[];
  size?: "compact" | "regular" | "spacious";
};

function animateHorizontalScroll(container: HTMLDivElement, targetLeft: number, duration = 760) {
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

export function ProductRail({ products, size = "regular" }: ProductRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const itemClassName = size === "compact"
    ? "min-w-[220px] max-w-[220px] sm:min-w-[250px] sm:max-w-[250px]"
    : size === "spacious"
      ? "min-w-[280px] max-w-[280px] sm:min-w-[320px] sm:max-w-[320px]"
      : "min-w-[260px] max-w-[260px] sm:min-w-[290px] sm:max-w-[290px]";

  function scroll(direction: "left" | "right") {
    const container = scrollRef.current;
    if (!container) return;

    const viewportWidth = container.clientWidth;
    const distance = Math.max(viewportWidth * 0.82, 280);
    const targetLeft = direction === "right"
      ? container.scrollLeft + distance
      : container.scrollLeft - distance;

    animateHorizontalScroll(container, targetLeft, 820);
  }

  return (
    <div className="relative group/rail">
      <div
        ref={scrollRef}
        className="-mx-4 flex overflow-x-auto px-4 pb-2 no-scrollbar sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        <div className="flex gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className={itemClassName}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Ver produtos anteriores"
        className="absolute left-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/92 text-[#1A1A1A] shadow-[0_16px_28px_-20px_rgba(26,26,26,0.8)] backdrop-blur transition-all hover:border-[#D4AF37] hover:text-[#D4AF37] md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Ver próximos produtos"
        className="absolute right-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/92 text-[#1A1A1A] shadow-[0_16px_28px_-20px_rgba(26,26,26,0.8)] backdrop-blur transition-all hover:border-[#D4AF37] hover:text-[#D4AF37] md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}