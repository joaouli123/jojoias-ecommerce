"use server";

import {
  getCatalogProducts,
  getCatalogFacets,
  getFeaturedProducts,
  getProductBySlug,
  getProductReviews,
  getProductsByCategorySlug,
  getRelatedProducts,
  getSearchSuggestions,
  getStoreBanners,
  getStoreBrands,
  getStoreCategories,
  type CatalogFilters,
} from "@/lib/store-data";

export async function getFeaturedProductsAction(limit = 8) {
  return getFeaturedProducts(limit);
}

export async function getCategoriesAction(limit = 8) {
  return getStoreCategories(limit);
}

export async function getBrandsAction(limit = 24) {
  return getStoreBrands(limit);
}

export async function getProductsByCategoryAction(slug: string, limit?: number) {
  return getProductsByCategorySlug(slug, limit);
}

export async function getProductBySlugAction(slug: string) {
  return getProductBySlug(slug);
}

export async function getRelatedProductsAction(productId: string, categorySlug: string, limit = 4) {
  return getRelatedProducts(productId, categorySlug, limit);
}

export async function getProductReviewsAction(productId: string) {
  return getProductReviews(productId);
}

export async function getStoreBannersAction(placement: "hero" | "secondary") {
  return getStoreBanners(placement);
}

export async function getCatalogProductsAction(filters: CatalogFilters) {
  return getCatalogProducts(filters);
}

export async function getCatalogFacetsAction(filters: CatalogFilters) {
  return getCatalogFacets(filters);
}

export async function getSearchSuggestionsAction(query: string, limit = 5) {
  return getSearchSuggestions(query, limit);
}


