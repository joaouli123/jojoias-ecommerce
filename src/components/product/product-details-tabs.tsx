"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { ProductReviewForm } from "@/components/product/product-review-form";
import type { ProductInfoItem } from "@/lib/product-content";
import type { ProductReview } from "@/lib/store-data";

type ProductDetailsTabsProps = {
  description: string;
  infoItems: ProductInfoItem[];
  sku: string;
  brand: string;
  category: string;
  quantity: number;
  reviewsCount: number;
  averageRating: number;
  reviews: ProductReview[];
  productId: string;
  initialTab?: TabKey;
};

type TabKey = "description" | "specs" | "reviews";

const tabLabels: Record<TabKey, string> = {
  description: "Descrição",
  specs: "Especificações",
  reviews: "Avaliações",
};

export function ProductDetailsTabs({
  description,
  infoItems,
  sku,
  brand,
  category,
  quantity,
  reviewsCount,
  averageRating,
  reviews,
  productId,
  initialTab = "description",
}: ProductDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let isMounted = true;

    async function loadReviewAccess() {
      try {
        const response = await fetch(`/api/products/${productId}/review-access`, { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { isAuthenticated?: boolean; canReview?: boolean };
        if (!isMounted) return;

        setIsAuthenticated(Boolean(payload.isAuthenticated));
        setCanReview(Boolean(payload.canReview));
      } catch {
        if (!isMounted) return;
        setIsAuthenticated(false);
        setCanReview(false);
      }
    }

    void loadReviewAccess();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const descriptionParagraphs = useMemo(
    () => description.split("\n\n").filter(Boolean),
    [description],
  );

  const specs = [
    { label: "SKU", value: sku },
    { label: "Marca", value: brand },
    { label: "Categoria", value: category },
    { label: "Disponibilidade", value: quantity > 0 ? `${quantity} em estoque` : "Sob consulta" },
    ...infoItems,
    { label: "Envio", value: "Cálculo automático por CEP no checkout" },
  ];

  const handleTabClick = (tab: TabKey) => {
    setActiveTab(tab);

    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    url.hash = "detalhes-produto";
    window.history.replaceState(null, "", url.toString());
  };

  return (
    <div id="detalhes-produto" className="w-full scroll-mt-28 border-t border-zinc-200 pt-8 md:pt-10">
      <div
        role="tablist"
        aria-label="Detalhes do produto"
        className="flex items-center gap-6 md:gap-8 border-b border-zinc-200 mb-6 md:mb-8 overflow-x-auto"
      >
        {(Object.keys(tabLabels) as TabKey[]).map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              id={`product-tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`product-tab-panel-${tab}`}
              onClick={() => handleTabClick(tab)}
              className={`pb-4 text-[16px] font-bold transition-colors relative top-[1px] ${
                isActive
                  ? "text-[#D4AF37] border-b-2 border-[#D4AF37]"
                  : "text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              {tabLabels[tab]}
            </button>
          );
        })}
      </div>

      <div
        id="product-tab-panel-description"
        role="tabpanel"
        aria-labelledby="product-tab-description"
        hidden={activeTab !== "description"}
        className={`max-w-4xl text-[15px] text-[#4b5563] leading-[1.8] space-y-5 md:space-y-6 ${activeTab !== "description" ? "hidden" : "block"}`}
      >
        {descriptionParagraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div
        id="product-tab-panel-specs"
        role="tabpanel"
        aria-labelledby="product-tab-specs"
        hidden={activeTab !== "specs"}
        className={`max-w-4xl overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-[0_12px_32px_-28px_rgba(15,23,42,0.35)] ${activeTab !== "specs" ? "hidden" : "block"}`}
      >
        <table className="w-full border-collapse text-left text-sm md:text-[15px]">
          <tbody className="divide-y divide-zinc-200">
            {specs.map((item, index) => (
              <tr key={item.label} className={index % 2 === 0 ? "bg-white" : "bg-zinc-50/80"}>
                <th
                  scope="row"
                  className="w-[38%] px-4 py-4 align-top font-semibold text-zinc-900 md:px-6"
                >
                  {item.label}
                </th>
                <td className="px-4 py-4 align-top text-zinc-600 md:px-6">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        id="product-tab-panel-reviews"
        role="tabpanel"
        aria-labelledby="product-tab-reviews"
        hidden={activeTab !== "reviews"}
        className={`grid gap-6 lg:grid-cols-[260px_1fr] ${activeTab !== "reviews" ? "hidden" : "grid"}`}
      >
        <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-6 text-center">
          <div className="text-5xl font-black text-zinc-900">{averageRating ? averageRating.toFixed(1) : "0.0"}</div>
          <div className="mt-3 flex items-center justify-center gap-1 text-[#facc15]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className={`h-4 w-4 ${index < Math.round(averageRating) ? "fill-current" : ""}`} />
            ))}
          </div>
          <p className="mt-3 text-sm text-zinc-600">Baseado em {reviewsCount} avaliações verificadas.</p>
        </div>

        <div className="space-y-4">
          <ProductReviewForm productId={productId} canReview={canReview} isAuthenticated={isAuthenticated} />

          {reviews.length ? reviews.map((review) => (
            <div key={review.id} className="rounded-[20px] border border-zinc-200 p-5">
              <div className="flex items-center gap-1 text-[#facc15]">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={starIndex} className={`h-4 w-4 ${starIndex < review.rating ? "fill-current" : ""}`} />
                ))}
              </div>
              {review.title ? <p className="mt-3 text-sm font-bold text-zinc-900">{review.title}</p> : null}
              <p className="mt-2 text-sm leading-6 text-zinc-600">{review.content}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {review.userName} • {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(review.createdAt)}
              </p>
            </div>
          )) : (
            <div className="rounded-[20px] border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">
              Ainda não há avaliações para este produto.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}