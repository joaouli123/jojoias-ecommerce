import type { Metadata } from "next";
import { ProductPageContent, generateProductPageMetadata } from "../../../product/product-page-content";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { productSlug } = await params;
  return generateProductPageMetadata(productSlug);
}

export default async function CategoryProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string; productSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { categorySlug, productSlug } = await params;
  const { tab } = await searchParams;

  return <ProductPageContent slug={productSlug} tab={tab} expectedCategorySlug={categorySlug} />;
}