type ProductPathInput = {
  slug: string;
  categorySlug?: string | null;
};

export function getProductPath({ slug, categorySlug }: ProductPathInput) {
  if (categorySlug) {
    return `/categoria/${categorySlug}/${slug}`;
  }

  return `/produto/${slug}`;
}

export function getAbsoluteProductUrl(siteUrl: string, product: ProductPathInput) {
  const normalizedSiteUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  return `${normalizedSiteUrl}${getProductPath(product)}`;
}
