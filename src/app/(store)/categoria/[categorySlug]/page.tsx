import type { Metadata } from "next";
import CategoryPage, { generateMetadata as generateCategoryMetadata } from "../../category/[slug]/page";

function normalizeCategorySlug(slug: string) {
  return slug === "todos" ? "all" : slug;
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const resolved = await params;
  return generateCategoryMetadata({ params: Promise.resolve({ slug: normalizeCategorySlug(resolved.categorySlug) }) });
}

export default async function CategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ sort?: string; price?: string; page?: string; brand?: string }>;
}) {
  const resolved = await params;

  return CategoryPage({
    params: Promise.resolve({ slug: normalizeCategorySlug(resolved.categorySlug) }),
    searchParams,
  });
}