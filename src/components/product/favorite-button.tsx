"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Heart } from "lucide-react";

type FavoriteResponse = {
  ids: string[];
};

export function FavoriteButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFavorite() {
      try {
        const response = await fetch("/api/favorites", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as FavoriteResponse;
        if (isMounted) {
          setIsFavorite(payload.ids.includes(productId));
        }
      } catch {
        // noop
      }
    }

    void loadFavorite();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  async function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsLoading(true);
    try {
      const response = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) return;
      const payload = (await response.json()) as FavoriteResponse;
      setIsFavorite(payload.ids.includes(productId));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={`inline-flex items-center justify-center rounded-full border transition-colors ${
        isFavorite
          ? "border-[#c93737] bg-[#c93737] text-white"
          : "border-[#c93737]/35 bg-white text-[#c93737] hover:border-[#c93737] hover:bg-[#c93737] hover:text-white"
      } touch-manipulation disabled:opacity-60 ${className}`}
    >
      <Heart className={`relative -translate-y-px h-4 w-4 stroke-[2.3] ${isFavorite ? "fill-current" : ""}`} />
    </button>
  );
}
