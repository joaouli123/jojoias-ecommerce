import { NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/store-data";
import { getCacheValue, setCacheValue } from "@/lib/upstash";

const SEARCH_CACHE_TTL_SECONDS = 60 * 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "";
  const limit = Number.parseInt(searchParams.get("limit") ?? "5", 10);
  const normalizedLimit = Number.isNaN(limit) ? 5 : Math.min(Math.max(limit, 1), 10);

  if (query.length < 2) {
    return NextResponse.json({ products: [], categories: [], brands: [] });
  }

  const cacheKey = `search:suggestions:${query.toLowerCase()}:${normalizedLimit}`;
  const cached = await getCacheValue<Awaited<ReturnType<typeof getSearchSuggestions>>>(cacheKey);

  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "X-Search-Cache": "HIT",
      },
    });
  }

  const suggestions = await getSearchSuggestions(query, normalizedLimit);
  await setCacheValue(cacheKey, suggestions, SEARCH_CACHE_TTL_SECONDS);

  return NextResponse.json(suggestions, {
    headers: {
      "X-Search-Cache": "MISS",
    },
  });
}
