"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type SearchSuggestionProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  category: string;
};

type SearchSuggestionFacet = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

type SearchSuggestionsResponse = {
  products: SearchSuggestionProduct[];
  categories: SearchSuggestionFacet[];
  brands: SearchSuggestionFacet[];
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchSuggestionsResponse>({ products: [], categories: [], brands: [] });
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const normalized = query.trim();

    if (normalized.length < 2) {
      setResults({ products: [], categories: [], brands: [] });
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(normalized)}&limit=5`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setResults({ products: [], categories: [], brands: [] });
          return;
        }

        const payload = (await response.json()) as SearchSuggestionsResponse;
        setResults(payload);
      } catch {
        if (!controller.signal.aborted) {
          setResults({ products: [], categories: [], brands: [] });
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }
  }, []);

  const hasResults = useMemo(
    () => results.products.length > 0 || results.categories.length > 0 || results.brands.length > 0,
    [results],
  );

  function scheduleClose() {
    closeTimeoutRef.current = window.setTimeout(() => setIsOpen(false), 120);
  }

  function cancelClose() {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  return (
    <div className="relative w-full group" onFocus={cancelClose} onBlur={scheduleClose}>
      <form action="/search" method="get" className="relative w-full">
        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Digite o que você procura..."
          aria-label="Buscar produtos"
          className="h-[52px] w-full rounded-[20px] border border-zinc-500 lg:border-zinc-200 bg-white lg:bg-zinc-50/50 pl-4 pr-14 text-sm outline-none transition-all focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:bg-white placeholder:text-zinc-600 sm:h-12"
        />
        <button type="submit" className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-zinc-900 transition-colors hover:text-[#D4AF37] lg:text-zinc-400 sm:h-10 sm:w-10" aria-label="Buscar produtos">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </button>
      </form>

      {isOpen && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-2xl">
          {hasResults ? (
            <div className="max-h-[420px] overflow-y-auto">
              <div className="p-2">
                {results.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/produto/${product.slug}`}
                    className="flex items-center justify-between gap-3 rounded-[20px] px-3 py-3 hover:bg-zinc-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{product.name}</p>
                      <p className="text-xs text-zinc-500">{product.category}</p>
                    </div>
                    <span className="text-sm font-bold text-[#D4AF37]">{formatCurrency(product.price)}</span>
                  </Link>
                ))}
              </div>

              {results.categories.length ? (
                <div className="border-t border-zinc-100 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Categorias</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {results.categories.map((category) => (
                      <Link key={category.id} href={`/categoria/${category.slug}`} className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">
                        <Tag className="h-3.5 w-3.5" /> {category.name} ({category.productCount})
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {results.brands.length ? (
                <div className="border-t border-zinc-100 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Marcas</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {results.brands.map((brand) => (
                      <Link key={brand.id} href={`/marca/${brand.slug}`} className="inline-flex rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-[#D4AF37] hover:text-[#D4AF37]">
                        {brand.name} ({brand.productCount})
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="border-t border-zinc-100 px-4 py-3">
                <Link href={`/search?q=${encodeURIComponent(query.trim())}`} className="text-sm font-semibold text-[#111111] hover:text-[#D4AF37]">
                  Ver todos os resultados para “{query.trim()}”
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-4 py-5 text-sm text-zinc-500">
              Nenhuma sugestão encontrada. Pressione Enter para buscar por “{query.trim()}”.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
