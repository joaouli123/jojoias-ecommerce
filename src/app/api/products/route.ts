import { NextResponse } from "next/server";
import { getFeaturedProducts, getProductBySlug } from "@/lib/store-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const limitRaw = searchParams.get("limit");
  const limit = Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 12;

  if (slug) {
    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ product });
  }

  const products = await getFeaturedProducts(limit);
  return NextResponse.json({ products });
}

