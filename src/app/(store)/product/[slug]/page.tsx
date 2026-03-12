import { notFound, redirect } from "next/navigation";
import { getProductBySlugAction } from "@/actions/products";
import { getProductPath } from "@/lib/product-url";
import { generateProductPageMetadata } from "../product-page-content";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return generateProductPageMetadata(slug);
}

export default async function ProductLegacyRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const product = await getProductBySlugAction(slug);

  if (!product) {
    notFound();
  }

  const destination = getProductPath(product);
  redirect(tab ? `${destination}?tab=${encodeURIComponent(tab)}` : destination);
}




