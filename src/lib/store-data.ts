import { unstable_cache } from "next/cache";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export type StoreProduct = {
  id: string;
  image: string | null;
  images: Array<{ id: string; url: string; alt: string | null; position: number }>;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  quantity: number;
  brand: string | null;
  brandSlug: string | null;
  category: string;
  categorySlug: string;
  status: ProductStatus;
  variants: Array<{
    id: string;
    name: string;
    sku: string | null;
    price: number;
    quantity: number;
    image: string | null;
    isActive: boolean;
  }>;
};

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
};

export type StoreBrand = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type StoreBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  mobileUrl: string | null;
  href: string | null;
  placement: string;
  position: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

export type ProductReview = {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  createdAt: Date;
  userName: string;
};

export type SearchSuggestionProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  category: string;
};

export type SearchSuggestionFacet = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type SearchSuggestionsResult = {
  products: SearchSuggestionProduct[];
  categories: SearchSuggestionFacet[];
  brands: SearchSuggestionFacet[];
};

export type ProductReviewsSummary = {
  reviews: ProductReview[];
  averageRating: number;
  totalReviews: number;
};

export type CartLine = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export type HydratedCartItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  variantName: string | null;
  sku: string | null;
};

export type CatalogSort = "relevance" | "price-asc" | "price-desc" | "newest";

export type CatalogFilters = {
  categorySlug?: string;
  brandSlug?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
};

export type CatalogResult = {
  products: StoreProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CatalogFacetsResult = {
  brands: SearchSuggestionFacet[];
  categories: SearchSuggestionFacet[];
};

const SEARCH_SYNONYM_GROUPS = [
  ["anel", "aro", "ring"],
  ["colar", "gargantilha", "corrente"],
  ["pulseira", "bracelete"],
  ["brinco", "argola"],
  ["luxo", "premium", "sofisticado", "elegante"],
  ["dourado", "ouro", "gold"],
  ["prata", "prateado", "silver"],
  ["delicado", "minimalista"],
  ["pedra", "cristal", "zirconia", "zircônia"],
  ["presente", "gift"],
] as const;

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function tokenizeSearchQuery(query: string) {
  return normalizeSearchText(query)
    .split(/\s+/)
    .filter(Boolean);
}

export function expandSearchTerms(query: string) {
  const tokens = tokenizeSearchQuery(query);
  const expanded = new Set(tokens);

  for (const token of tokens) {
    for (const group of SEARCH_SYNONYM_GROUPS) {
      if ((group as readonly string[]).includes(token)) {
        for (const synonym of group) {
          expanded.add(synonym);
        }
      }
    }
  }

  return [...expanded];
}

export function scoreSearchFields(query: string, fields: Array<string | null | undefined>) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeSearchQuery(query);
  const expandedTokens = expandSearchTerms(query);

  if (!normalizedQuery || tokens.length === 0) return 0;

  let score = 0;

  for (const field of fields) {
    const normalizedField = normalizeSearchText(field ?? "");
    if (!normalizedField) continue;

    if (normalizedField === normalizedQuery) score += 120;
    if (normalizedField.startsWith(normalizedQuery)) score += 80;
    if (normalizedField.includes(normalizedQuery)) score += 35;

    for (const token of tokens) {
      if (normalizedField === token) score += 35;
      else if (normalizedField.startsWith(token)) score += 18;
      else if (normalizedField.includes(token)) score += 8;
    }

    for (const token of expandedTokens) {
      if (tokens.includes(token)) continue;
      if (normalizedField === token) score += 16;
      else if (normalizedField.startsWith(token)) score += 10;
      else if (normalizedField.includes(token)) score += 4;
    }
  }

  const concatenated = normalizeSearchText(fields.filter(Boolean).join(" "));
  if (concatenated) {
    const matchedTokens = tokens.filter((token) => concatenated.includes(token)).length;
    const matchedExpandedTokens = expandedTokens.filter((token) => !tokens.includes(token) && concatenated.includes(token)).length;
    if (matchedTokens === tokens.length) {
      score += 25;
    } else {
      score += matchedTokens * 5;
    }

    score += matchedExpandedTokens * 3;
  }

  return score;
}

function buildProductSearchClauses(search: string): Prisma.ProductWhereInput[] {
  const rawSearch = search.trim();
  const terms = Array.from(new Set([rawSearch, ...expandSearchTerms(search)])).filter((term) => term.length >= 2);

  return terms.flatMap((term) => ([
    { name: { contains: term } },
    { description: { contains: term } },
    { sku: { contains: term } },
    { category: { name: { contains: term } } },
    { brand: { name: { contains: term } } },
  ]));
}

function normalizePage(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) return 1;
  return Math.floor(value);
}

function normalizePageSize(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) return 12;
  return Math.min(Math.floor(value), 48);
}

function buildCatalogWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const search = filters.query?.trim();

  return {
    status: "ACTIVE",
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.brandSlug ? { brand: { slug: filters.brandSlug } } : {}),
    ...((typeof filters.minPrice === "number" || typeof filters.maxPrice === "number")
      ? {
        price: {
          ...(typeof filters.minPrice === "number" ? { gte: filters.minPrice } : {}),
          ...(typeof filters.maxPrice === "number" ? { lte: filters.maxPrice } : {}),
        },
      }
      : {}),
    ...(search
      ? {
        OR: buildProductSearchClauses(search),
      }
      : {}),
  };
}

function buildCatalogOrderBy(sort: CatalogSort = "relevance"): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }, { createdAt: "desc" }];
    case "price-desc":
      return [{ price: "desc" }, { createdAt: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "relevance":
    default:
      return [{ createdAt: "desc" }];
  }
}

function mapProduct(product: {
  id: string;
  image: string | null;
  galleryImages?: Array<{ id: string; url: string; alt: string | null; position: number }>;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  quantity: number;
  status: ProductStatus;
  brand?: { name: string; slug: string } | null;
  category: { name: string; slug: string };
  variants?: Array<{
    id: string;
    name: string;
    sku: string | null;
    price: number;
    quantity: number;
    image: string | null;
    isActive: boolean;
  }>;
}): StoreProduct {
  return {
    id: product.id,
    image: product.image,
    images: product.galleryImages?.sort((a, b) => a.position - b.position).map((image) => ({ id: image.id, url: image.url, alt: image.alt, position: image.position })) ?? [],
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    price: product.price,
    comparePrice: product.comparePrice,
    quantity: product.quantity,
    brand: product.brand?.name ?? null,
    brandSlug: product.brand?.slug ?? null,
    category: product.category.name,
    categorySlug: product.category.slug,
    status: product.status,
    variants: (product.variants ?? []).filter((variant) => variant.isActive),
  };
}

function sortFacetList(items: SearchSuggestionFacet[]) {
  return items.sort((left, right) => right.productCount - left.productCount || left.name.localeCompare(right.name, "pt-BR"));
}

export function summarizeCatalogFacets(entries: Array<{
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
}>): CatalogFacetsResult {
  const brands = new Map<string, SearchSuggestionFacet>();
  const categories = new Map<string, SearchSuggestionFacet>();

  for (const entry of entries) {
    if (entry.brand) {
      const current = brands.get(entry.brand.id);
      brands.set(entry.brand.id, {
        id: entry.brand.id,
        name: entry.brand.name,
        slug: entry.brand.slug,
        productCount: (current?.productCount ?? 0) + 1,
      });
    }

    if (entry.category) {
      const current = categories.get(entry.category.id);
      categories.set(entry.category.id, {
        id: entry.category.id,
        name: entry.category.name,
        slug: entry.category.slug,
        productCount: (current?.productCount ?? 0) + 1,
      });
    }
  }

  return {
    brands: sortFacetList([...brands.values()]),
    categories: sortFacetList([...categories.values()]),
  };
}

export async function getFeaturedProducts(limit = 8): Promise<StoreProduct[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const products = await unstable_cache(
      async () => prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
          galleryImages: true,
          variants: { where: { isActive: true }, orderBy: [{ createdAt: "asc" }] },
        },
        orderBy: [{ createdAt: "desc" }],
        take: limit,
      }),
      ["store-featured-products", String(limit)],
      { revalidate: 300, tags: ["store:products"] },
    )();

    return products.map(mapProduct);
  } catch {
    return [];
  }
}

export async function getProductsByCategorySlug(slug: string): Promise<StoreProduct[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const products = await unstable_cache(
      async () => prisma.product.findMany({
        where: {
          status: "ACTIVE",
          category: { slug },
        },
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
          galleryImages: true,
          variants: { where: { isActive: true }, orderBy: [{ createdAt: "asc" }] },
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      ["store-products-by-category", slug],
      { revalidate: 300, tags: ["store:products", `store:category:${slug}`] },
    )();

    return products.map(mapProduct);
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  if (!hasDatabaseUrl()) return null;

  try {
    const product = await unstable_cache(
      async () => prisma.product.findFirst({
        where: {
          slug,
          status: "ACTIVE",
        },
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
          galleryImages: true,
          variants: { where: { isActive: true }, orderBy: [{ createdAt: "asc" }] },
        },
      }),
      ["store-product-by-slug", slug],
      { revalidate: 300, tags: ["store:products", `store:product:${slug}`] },
    )();

    return product ? mapProduct(product) : null;
  } catch {
    return null;
  }
}

export async function getRelatedProducts(productId: string, categorySlug: string, limit = 4): Promise<StoreProduct[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const [primary, fallback] = await unstable_cache(
      async () => {
        const primaryResults = await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            id: { not: productId },
            category: { slug: categorySlug },
          },
          include: {
            category: { select: { name: true, slug: true } },
            brand: { select: { name: true, slug: true } },
            galleryImages: true,
            variants: { where: { isActive: true }, orderBy: [{ createdAt: "asc" }] },
          },
          orderBy: [{ createdAt: "desc" }],
          take: limit,
        });

        if (primaryResults.length >= limit) {
          return [primaryResults, []] as const;
        }

        const fallbackResults = await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            id: {
              notIn: [productId, ...primaryResults.map((item) => item.id)],
            },
          },
          include: {
            category: { select: { name: true, slug: true } },
            brand: { select: { name: true, slug: true } },
            galleryImages: true,
            variants: { where: { isActive: true }, orderBy: [{ createdAt: "asc" }] },
          },
          orderBy: [{ createdAt: "desc" }],
          take: limit - primaryResults.length,
        });

        return [primaryResults, fallbackResults] as const;
      },
      ["store-related-products", productId, categorySlug, String(limit)],
      { revalidate: 300, tags: ["store:products", `store:category:${categorySlug}`] },
    )();

    return [...primary, ...fallback].map(mapProduct);
  } catch {
    return [];
  }
}

export async function getProductReviews(productId: string): Promise<ProductReviewsSummary> {
  if (!hasDatabaseUrl()) {
    return { reviews: [], averageRating: 0, totalReviews: 0 };
  }

  try {
    const reviews = await unstable_cache(
      async () => prisma.review.findMany({
        where: { productId },
        include: {
          user: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      ["store-product-reviews", productId],
      { revalidate: 300, tags: ["store:reviews", `store:reviews:${productId}`] },
    )();

    const totalReviews = reviews.length;
    const averageRating = totalReviews
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    return {
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt,
        userName: review.user.name,
      })),
      averageRating,
      totalReviews,
    };
  } catch {
    return { reviews: [], averageRating: 0, totalReviews: 0 };
  }
}

export async function getProductsByIds(ids: string[]): Promise<StoreProduct[]> {
  if (!ids.length) return [];
  if (!hasDatabaseUrl()) return [];

  try {
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        status: "ACTIVE",
      },
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } },
        galleryImages: true,
        variants: { where: { isActive: true }, orderBy: [{ createdAt: "asc" }] },
      },
    });

    const ordered = new Map(products.map((product) => [product.id, product]));
    return ids.map((id) => ordered.get(id)).filter((product): product is NonNullable<typeof product> => Boolean(product)).map(mapProduct);
  } catch {
    return [];
  }
}

export async function getStoreCategories(limit = 8): Promise<StoreCategory[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const categories = await unstable_cache(
      async () => prisma.category.findMany({
        orderBy: [{ name: "asc" }],
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),
      ["store-categories", String(limit)],
      { revalidate: 600, tags: ["store:categories"] },
    )();

    return categories;
  } catch {
    return [];
  }
}

export async function getStoreBrands(limit = 24): Promise<StoreBrand[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const brands = await unstable_cache(
      async () => prisma.brand.findMany({
        orderBy: [{ name: "asc" }],
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              products: {
                where: {
                  status: "ACTIVE",
                },
              },
            },
          },
        },
      }),
      ["store-brands", String(limit)],
      { revalidate: 600, tags: ["store:brands", "store:products"] },
    )();

    return brands
      .map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        productCount: brand._count.products,
      }))
      .filter((brand) => brand.productCount > 0);
  } catch {
    return [];
  }
}

export async function getCatalogProducts(filters: CatalogFilters = {}): Promise<CatalogResult> {
  if (!hasDatabaseUrl()) {
    return {
      products: [],
      total: 0,
      page: 1,
      pageSize: normalizePageSize(filters.pageSize),
      totalPages: 0,
    };
  }

  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const where = buildCatalogWhere(filters);

  try {
    const total = await prisma.product.count({ where });

    const baseQuery = {
      where,
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } },
        galleryImages: true,
        variants: { where: { isActive: true }, orderBy: [{ createdAt: "asc" as const }] },
      },
    };

    const products = filters.query?.trim() && (filters.sort ?? "relevance") === "relevance"
      ? (await prisma.product.findMany({
          ...baseQuery,
          orderBy: [{ createdAt: "desc" }],
        })).sort((left, right) => {
          const leftScore = scoreSearchFields(filters.query ?? "", [left.name, left.sku, left.description, left.brand?.name, left.category.name]);
          const rightScore = scoreSearchFields(filters.query ?? "", [right.name, right.sku, right.description, right.brand?.name, right.category.name]);
          if (rightScore !== leftScore) return rightScore - leftScore;
          return right.createdAt.getTime() - left.createdAt.getTime();
        }).slice((page - 1) * pageSize, page * pageSize)
      : await prisma.product.findMany({
          ...baseQuery,
          orderBy: buildCatalogOrderBy(filters.sort),
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

    return {
      products: products.map(mapProduct),
      total,
      page,
      pageSize,
      totalPages: total ? Math.ceil(total / pageSize) : 0,
    };
  } catch {
    return {
      products: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

export async function getCatalogFacets(filters: CatalogFilters = {}): Promise<CatalogFacetsResult> {
  if (!hasDatabaseUrl()) {
    return { brands: [], categories: [] };
  }

  const brandWhere = buildCatalogWhere({
    ...filters,
    brandSlug: undefined,
    page: undefined,
    pageSize: undefined,
  });
  const categoryWhere = buildCatalogWhere({
    ...filters,
    categorySlug: undefined,
    page: undefined,
    pageSize: undefined,
  });

  try {
    const [brandEntries, categoryEntries] = await Promise.all([
      prisma.product.findMany({
        where: brandWhere,
        select: {
          brand: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.findMany({
        where: categoryWhere,
        select: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    return {
      brands: summarizeCatalogFacets(brandEntries).brands,
      categories: summarizeCatalogFacets(categoryEntries).categories,
    };
  } catch {
    return { brands: [], categories: [] };
  }
}

export async function getStoreBanners(placement: "hero" | "secondary"): Promise<StoreBanner[]> {
  if (!hasDatabaseUrl()) return [];

  const now = new Date();

  try {
    const banners = await prisma.banner.findMany({
      where: {
        placement,
        isActive: true,
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
        ],
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });

    return banners.map((banner) => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl,
      mobileUrl: banner.mobileUrl,
      href: banner.href,
      placement: banner.placement,
      position: banner.position,
      startsAt: banner.startsAt,
      endsAt: banner.endsAt,
    }));
  } catch {
    return [];
  }
}

export async function getSearchSuggestions(query: string, limit = 5): Promise<SearchSuggestionsResult> {
  const search = query.trim();

  if (!search || !hasDatabaseUrl()) {
    return { products: [], categories: [], brands: [] };
  }

  try {
    const [products, categories, brands] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          OR: buildProductSearchClauses(search),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          image: true,
          category: { select: { name: true } },
          brand: { select: { name: true } },
          description: true,
          sku: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }],
        take: Math.max(limit * 4, 12),
      }),
      prisma.category.findMany({
        where: {
          OR: [
            ...Array.from(new Set([search, ...expandSearchTerms(search)])).filter((term) => term.length >= 2).map((term) => ({ name: { contains: term } })),
            {
              products: {
                some: {
                  status: "ACTIVE",
                  OR: buildProductSearchClauses(search),
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        take: 3,
      }),
      prisma.brand.findMany({
        where: {
          OR: [
            ...Array.from(new Set([search, ...expandSearchTerms(search)])).filter((term) => term.length >= 2).map((term) => ({ name: { contains: term } })),
            {
              products: {
                some: {
                  status: "ACTIVE",
                  OR: buildProductSearchClauses(search),
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        take: 3,
      }),
    ]);

    const [categoryCounts, brandCounts] = await Promise.all([
      Promise.all(categories.map((category) => prisma.product.count({ where: { status: "ACTIVE", categoryId: category.id } }))),
      Promise.all(brands.map((brand) => prisma.product.count({ where: { status: "ACTIVE", brandId: brand.id } }))),
    ]);

    return {
      products: products
        .sort((left, right) => {
          const leftScore = scoreSearchFields(search, [left.name, left.sku, left.description, left.brand?.name, left.category.name]);
          const rightScore = scoreSearchFields(search, [right.name, right.sku, right.description, right.brand?.name, right.category.name]);
          if (rightScore !== leftScore) return rightScore - leftScore;
          return right.createdAt.getTime() - left.createdAt.getTime();
        })
        .slice(0, limit)
        .map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image,
          category: product.category.name,
        })),
      categories: categories.map((category, index) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        productCount: categoryCounts[index] ?? 0,
      })),
      brands: brands.map((brand, index) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        productCount: brandCounts[index] ?? 0,
      })),
    };
  } catch {
    return { products: [], categories: [], brands: [] };
  }
}

export async function hydrateCart(lines: CartLine[]): Promise<HydratedCartItem[]> {
  if (!lines.length) return [];
  if (!hasDatabaseUrl()) return [];

  try {
    const products = await prisma.product.findMany({
      where: {
        id: { in: lines.map((line) => line.productId) },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        price: true,
        sku: true,
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            image: true,
          },
        },
      },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    return lines
      .map((line) => {
        const product = productMap.get(line.productId);
        if (!product) return null;

        const variant = line.variantId
          ? product.variants.find((item) => item.id === line.variantId) ?? null
          : null;

        const unitPrice = variant?.price ?? product.price;
        const image = variant?.image ?? product.image;
        const sku = variant?.sku ?? product.sku;

        return {
          productId: product.id,
          variantId: variant?.id ?? null,
          slug: product.slug,
          name: product.name,
          image,
          unitPrice,
          quantity: line.quantity,
          lineTotal: unitPrice * line.quantity,
          variantName: variant?.name ?? null,
          sku,
        };
      })
      .filter((item): item is HydratedCartItem => Boolean(item));
  } catch {
    return [];
  }
}

