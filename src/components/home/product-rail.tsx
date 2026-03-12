"use client";

import { useRef, useState } from "react";
import { useDragScroll } from "@/components/home/carousels";
import { ProductCard } from "@/components/product/product-card";

type ProductRailItem = {
  id: string;
  name: string;
  slug: string;
  categorySlug?: string | null;
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
  const { isDragging, dragProps } = useDragScroll();

  const itemClassName = size === "compact"
    ? "snap-start min-w-[220px] max-w-[220px] sm:min-w-[250px] sm:max-w-[250px]"
    : size === "spacious"
      ? "snap-start min-w-[280px] max-w-[280px] sm:min-w-[320px] sm:max-w-[320px]"
      : "snap-start min-w-[260px] max-w-[260px] sm:min-w-[290px] sm:max-w-[290px]";

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
        className={`-mx-4 flex overflow-x-auto snap-x snap-proximity px-4 pb-12 pt-4 no-scrollbar sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ touchAction: "pan-x pan-y pinch-zoom", WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
        {...dragProps}
      >
        <div className="flex gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className={itemClassName}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}