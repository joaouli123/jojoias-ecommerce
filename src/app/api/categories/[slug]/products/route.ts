import { NextResponse } from "next/server";
import { getProductsByCategorySlug } from "@/lib/store-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const products = await getProductsByCategorySlug(slug);
  return NextResponse.json({ products });
}

