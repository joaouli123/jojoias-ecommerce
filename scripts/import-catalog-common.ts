import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, ProductStatus } from "@prisma/client";
import { buildImportedDescription } from "../src/lib/product-content";
import { buildProductMetaDescription, buildProductSeoTitle, generateProductSlug } from "../src/lib/product-seo";
import { generateProductSeoWithAi } from "../src/lib/product-seo-ai";

export { buildImportedDescription };

export const prisma = new PrismaClient();
export const DEFAULT_IMPORTED_VARIANT_QUANTITY = 20;
const ENABLE_AI_SEO = process.env.IMPORT_AI_SEO === "1";

export type SourceVariant = {
  type: string;
  label: string;
  sku?: string;
  quantity: number;
  image?: string;
  price?: number;
};

export type SourceProduct = {
  sourceUrl: string;
  sourceTitle: string;
  sourceDescription: string;
  topHighlights: string[];
  categoryName: string;
  categorySlug: string;
  brandName: string;
  brandSlug: string;
  price: number;
  comparePrice?: number;
  image: string;
  images: string[];
  variants: SourceVariant[];
  sku: string;
};

export type ImportProgress = {
  completedUrls: string[];
  failedUrls: string[];
  mappedProducts: SourceProduct[];
  updatedAt: string;
};

export function buildImageAlt(productTitle: string, position: number) {
  return position === 0
    ? `${productTitle} da Luxijóias`
    : `${productTitle} da Luxijóias - imagem ${position + 1}`;
}

export function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export function shouldPersistImportedVariants(variants: SourceVariant[]) {
  return variants.length > 1;
}

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&eacute;/gi, "é")
    .replace(/&aacute;/gi, "á")
    .replace(/&atilde;/gi, "ã")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&otilde;/gi, "õ")
    .replace(/&uacute;/gi, "ú")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&agrave;/gi, "à");
}

export function decodeJsonEscapedString(value: string) {
  return value.replace(/\\u([\da-f]{4})/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

export function stripTags(value: string) {
  return decodeHtmlEntities(value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, " "));
}

export function normalizeWhitespace(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

export function extractFirstGroup(content: string, pattern: RegExp) {
  const match = content.match(pattern);
  return match?.[1]?.trim() || null;
}

export function extractFirstMatch(content: string, pattern: RegExp) {
  const match = content.match(pattern);
  return match?.[1] ? normalizeWhitespace(stripTags(match[1])) : null;
}

export function parseCurrencyValue(rawValue?: string | null) {
  if (!rawValue) {
    return undefined;
  }

  const cleaned = rawValue.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) {
    return undefined;
  }

  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(/,/g, ".");
  } else if (/^-?\d+\.\d{3,}$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, "");
  }

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : undefined;
}

export function absolutizeUrl(url: string, baseUrl: string) {
  if (!url) {
    return url;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  return new URL(url, baseUrl).toString();
}

export function buildCategorySlug(categoryName: string) {
  return generateProductSlug(categoryName || "sem-categoria");
}

export function buildSkuSlugSuffix(sku: string) {
  const normalizedSku = generateProductSlug(sku).replace(/^-+|-+$/g, "");
  const compactSku = normalizedSku.replace(/-/g, "");
  return compactSku.slice(-10) || normalizedSku || "item";
}

export function buildVariantSku(productKey: string, _variantSku: string | undefined, index: number) {
  return `${productKey}-${String(index + 1).padStart(2, "0")}`.toUpperCase();
}

export function resolveImportSlug(baseSlug: string, sourceSku: string, duplicateSlugCounts: Map<string, number>) {
  const normalizedBaseSlug = generateProductSlug(baseSlug || sourceSku);
  if ((duplicateSlugCounts.get(normalizedBaseSlug) || 0) <= 1) {
    return normalizedBaseSlug;
  }

  return `${normalizedBaseSlug}-${buildSkuSlugSuffix(sourceSku)}`;
}

export async function readImportProgress(filePath: string): Promise<ImportProgress> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<ImportProgress>;
    return {
      completedUrls: Array.isArray(parsed.completedUrls) ? parsed.completedUrls : [],
      failedUrls: Array.isArray(parsed.failedUrls) ? parsed.failedUrls : [],
      mappedProducts: Array.isArray(parsed.mappedProducts) ? (parsed.mappedProducts as SourceProduct[]) : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return {
      completedUrls: [],
      failedUrls: [],
      mappedProducts: [],
      updatedAt: new Date(0).toISOString(),
    };
  }
}

export async function writeImportProgress(filePath: string, progress: ImportProgress) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(progress, null, 2));
}

export async function fetchText(url: string, referer?: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": process.env.IMPORT_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: referer || url,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar ${url}: ${response.status}`);
  }

  return response.text();
}

export async function generateSeo(product: SourceProduct) {
  const fallbackTitle = buildProductSeoTitle({
    name: product.sourceTitle,
    category: product.categoryName,
    brand: product.brandName,
    price: product.price,
    siteName: "Luxijóias",
  });
  const fallbackDescription = buildProductMetaDescription({
    name: product.sourceTitle,
    description: product.sourceDescription,
    category: product.categoryName,
    brand: product.brandName,
    price: product.price,
    siteName: "Luxijóias",
  });

  if (!ENABLE_AI_SEO) {
    return {
      title: product.sourceTitle,
      slug: generateProductSlug(product.sourceTitle),
      description: buildImportedDescription(product.sourceDescription, product.topHighlights),
      metaTitle: fallbackTitle,
      metaDescription: fallbackDescription,
    };
  }

  try {
    const parsed = await generateProductSeoWithAi({
      name: product.sourceTitle,
      description: product.sourceDescription,
      brand: product.brandName,
      category: product.categoryName,
      price: product.price,
      comparePrice: product.comparePrice,
    });

    return {
      title: (parsed.title || product.sourceTitle).trim(),
      slug: generateProductSlug(parsed.slug || parsed.title || product.sourceTitle),
      description: buildImportedDescription((parsed.description || product.sourceDescription).trim(), product.topHighlights),
      metaTitle: (parsed.seoTitle || fallbackTitle).trim(),
      metaDescription: (parsed.metaDescription || fallbackDescription).trim(),
    };
  } catch {
    return {
      title: product.sourceTitle,
      slug: generateProductSlug(product.sourceTitle),
      description: buildImportedDescription(product.sourceDescription, product.topHighlights),
      metaTitle: fallbackTitle,
      metaDescription: fallbackDescription,
    };
  }
}

export async function persistImportedProducts(products: SourceProduct[], sourceLabel: string, archiveMissing: boolean) {
  const currentActiveCount = await prisma.product.count({ where: { status: ProductStatus.ACTIVE } });
  const minimumSafeImportCount = Math.max(10, currentActiveCount);

  if (products.length === 0) {
    throw new Error(`Nenhum produto foi identificado para ${sourceLabel}.`);
  }

  if (archiveMissing && products.length < minimumSafeImportCount) {
    throw new Error(`Coleta parcial detectada em ${sourceLabel}. Importados ${products.length}, mínimo seguro ${minimumSafeImportCount}.`);
  }

  const categoryMap = new Map<string, string>();
  for (const entry of Array.from(new Set(products.map((item) => `${item.categorySlug}|${item.categoryName}`)))) {
    const [slug, name] = entry.split("|");
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
    categoryMap.set(slug, category.id);
  }

  const brandMap = new Map<string, string>();
  for (const entry of Array.from(new Set(products.map((item) => `${item.brandSlug}|${item.brandName}`)))) {
    const [slug, name] = entry.split("|");
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
    brandMap.set(slug, brand.id);
  }

  const importedProductIds: string[] = [];
  const duplicateSlugCounts = products.reduce((counts, product) => {
    const slug = generateProductSlug(product.sourceTitle);
    counts.set(slug, (counts.get(slug) || 0) + 1);
    return counts;
  }, new Map<string, number>());

  let importedCount = 0;

  for (const source of products) {
    const seo = await generateSeo(source);
    let resolvedSlug = resolveImportSlug(seo.slug, source.sku, duplicateSlugCounts);
    const galleryImages = unique([source.image, ...source.images].filter(Boolean));
    const importedVariantQuantity = source.variants.reduce((total, variant) => total + (variant.quantity || 0), 0);
    const persistVariants = shouldPersistImportedVariants(source.variants);
    const primaryImage = galleryImages[0] ?? source.image;

    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ sku: source.sku }, { slug: resolvedSlug }],
      },
      select: { id: true },
    });

    const slugOwner = await prisma.product.findUnique({
      where: { slug: resolvedSlug },
      select: { id: true },
    });

    if (slugOwner && slugOwner.id !== existing?.id) {
      resolvedSlug = `${resolvedSlug}-${buildSkuSlugSuffix(source.sku)}`;
    }

    const productData = {
      name: seo.title,
      slug: resolvedSlug,
      description: seo.description,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      image: primaryImage,
      price: source.price,
      comparePrice: source.comparePrice ?? null,
      sku: source.sku,
      quantity: importedVariantQuantity || DEFAULT_IMPORTED_VARIANT_QUANTITY,
      status: ProductStatus.ACTIVE,
      categoryId: categoryMap.get(source.categorySlug)!,
      brandId: brandMap.get(source.brandSlug) ?? null,
    };

    const created = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: productData,
        })
      : await prisma.product.create({
          data: productData,
        });

    await prisma.productImage.deleteMany({ where: { productId: created.id } });
    await prisma.productImage.createMany({
      data: galleryImages.map((imageUrl, index) => ({
        productId: created.id,
        url: imageUrl,
        position: index,
        alt: buildImageAlt(seo.title, index),
      })),
    });

    await prisma.productVariant.deleteMany({ where: { productId: created.id } });
    if (persistVariants) {
      await prisma.productVariant.createMany({
        data: source.variants.map((variant, index) => ({
          productId: created.id,
          name: variant.type === "Padrão" ? variant.label : `${variant.type}: ${variant.label}`,
          sku: buildVariantSku(created.id, variant.sku, index),
          price: variant.price ?? source.price,
          quantity: variant.quantity || DEFAULT_IMPORTED_VARIANT_QUANTITY,
          image: variant.image ?? primaryImage,
          isActive: true,
        })),
      });
    }

    importedCount += 1;
    importedProductIds.push(created.id);
    console.log(`[${sourceLabel}] Produto importado ${importedCount}/${products.length}: ${seo.title}`);
  }

  if (archiveMissing) {
    await prisma.product.updateMany({
      where: {
        id: {
          notIn: importedProductIds,
        },
      },
      data: {
        status: ProductStatus.ARCHIVED,
      },
    });
  }

  return importedCount;
}

export async function closeCatalogImportResources() {
  await prisma.$disconnect();
}