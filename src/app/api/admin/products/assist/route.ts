import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { normalizeInputText } from "@/lib/admin-display";
import { generateProductSeoWithAi } from "@/lib/product-seo-ai";

export async function POST(request: NextRequest) {
  await requireAdminPermission("products:manage");

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    brand?: string;
    category?: string;
    price?: number;
    comparePrice?: number;
  };
  const name = normalizeInputText(body.name);
  const description = normalizeInputText(body.description);
  const brand = normalizeInputText(body.brand);
  const category = normalizeInputText(body.category);
  const price = Number.isFinite(body.price) ? body.price : undefined;
  const comparePrice = Number.isFinite(body.comparePrice) ? body.comparePrice : undefined;

  if (!name) {
    return NextResponse.json({ error: "Informe pelo menos o nome do produto para usar a IA." }, { status: 400 });
  }

  const generated = await generateProductSeoWithAi({
    name,
    description,
    brand,
    category,
    price,
    comparePrice,
  });

  return NextResponse.json({
    title: generated.title,
    slug: generated.slug,
    description: generated.description,
    seoTitle: generated.seoTitle,
    metaDescription: generated.metaDescription,
    focusKeyword: generated.focusKeyword,
  });
}