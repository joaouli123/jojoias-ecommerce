import path from "node:path";
import {
  DEFAULT_IMPORTED_VARIANT_QUANTITY,
  type SourceProduct,
  type SourceVariant,
  absolutizeUrl,
  buildCategorySlug,
  buildImportedDescription,
  closeCatalogImportResources,
  decodeJsonEscapedString,
  extractFirstGroup,
  fetchText,
  normalizeWhitespace,
  parseCurrencyValue,
  persistImportedProducts,
  readImportProgress,
  stripTags,
  unique,
  writeImportProgress,
} from "./import-catalog-common";

const SOURCE_LABEL = "dmanu-import";
const SOURCE_BASE_URL = "https://dmanusemijoias.com.br";
const SOURCE_SITEMAP_URL = `${SOURCE_BASE_URL}/sitemap.xml`;
const SOURCE_DEFAULT_BRAND = "DManu Semijoias";
const IMPORT_PROGRESS_FILE = path.resolve(process.cwd(), ".cache", "dmanu-import-progress.json");

type DManuVariantPayload = {
  product_id: number;
  price_short: string | null;
  price_number: number | null;
  compare_at_price_short: string | null;
  compare_at_price_number: number | null;
  stock: number | null;
  sku: string | null;
  available: boolean;
  is_visible: boolean;
  option0: string | null;
  option1: string | null;
  option2: string | null;
  id: number;
  image_url: string | null;
};

function parseVariantPayload(html: string) {
  const rawVariants = extractFirstGroup(html, /LS\.variants = (\[[\s\S]*?\]);/);
  if (!rawVariants) {
    return [] as DManuVariantPayload[];
  }

  try {
    return JSON.parse(rawVariants) as DManuVariantPayload[];
  } catch {
    return [] as DManuVariantPayload[];
  }
}

function extractOptionLabels(html: string) {
  const labels = new Map<number, string>();
  for (const match of html.matchAll(/<label[^>]+for="variation_(\d+)"[^>]*>([^<]+)<\/label>/gi)) {
    labels.set(Number.parseInt(match[1], 10) - 1, normalizeWhitespace(match[2].replace(/:$/, "")));
  }
  return labels;
}

function extractImages(html: string, variants: DManuVariantPayload[]) {
  const galleryBoundary = html.indexOf('id="product-description"');
  const galleryHtml = galleryBoundary > 0 ? html.slice(0, galleryBoundary) : html;

  return unique([
    ...variants.map((variant) => (variant.image_url ? absolutizeUrl(variant.image_url, SOURCE_BASE_URL) : "")),
    ...Array.from(galleryHtml.matchAll(/(?:https?:)?\/\/acdn-us\.mitiendanube\.com\/stores\/[^"'\s]+\/products\/[^"'\s]+\.(?:webp|jpg|jpeg|png)/gi)).map((match) => absolutizeUrl(match[0].replace(/^http:\/\//i, "https://"), SOURCE_BASE_URL)),
  ].filter(Boolean));
}

function extractCategoryName(html: string) {
  const rawCategory = extractFirstGroup(html, /"item_category2":"([^\"]+)"/i) || extractFirstGroup(html, /"item_category":"([^\"]+)"/i);
  if (rawCategory) {
    return normalizeWhitespace(decodeJsonEscapedString(rawCategory));
  }

  const breadcrumbNames = Array.from(html.matchAll(/"name":\s*"([^\"]+)"\s*,\s*"item":\s*"https:\/\/dmanusemijoias\.com\.br\/[^\"]+"/g))
    .map((match) => normalizeWhitespace(decodeJsonEscapedString(match[1])))
    .filter((item) => !/^in[ií]cio$/i.test(item));
  return breadcrumbNames.at(-2) || breadcrumbNames.at(-1) || "Sem categoria";
}

function buildVariantLabel(variant: DManuVariantPayload, optionLabels: Map<number, string>) {
  const optionValues = [variant.option0, variant.option1, variant.option2]
    .map((value) => (value ? normalizeWhitespace(value) : null))
    .filter((value): value is string => Boolean(value));

  if (optionValues.length === 0) {
    return null;
  }

  return optionValues
    .map((value, index) => {
      const optionLabel = optionLabels.get(index);
      return optionLabel ? `${optionLabel}: ${value}` : value;
    })
    .join(" | ");
}

function extractVariants(html: string, defaultImage: string, productSku: string) {
  const variantPayload = parseVariantPayload(html)
    .filter((variant) => variant.is_visible)
    .filter((variant) => variant.available || typeof variant.stock === "number");
  const optionLabels = extractOptionLabels(html);

  if (variantPayload.length === 0) {
    return [
      {
        type: "Padrão",
        label: "Padrão",
        quantity: DEFAULT_IMPORTED_VARIANT_QUANTITY,
        sku: productSku,
        image: defaultImage,
      },
    ] satisfies SourceVariant[];
  }

  const variantLabels = variantPayload.map((variant) => buildVariantLabel(variant, optionLabels)).filter(Boolean) as string[];
  const hasMeaningfulVariants = new Set(variantLabels).size > 1;

  if (!hasMeaningfulVariants) {
    const primaryVariant = variantPayload[0];
    return [
      {
        type: "Padrão",
        label: "Padrão",
        quantity: primaryVariant.stock || DEFAULT_IMPORTED_VARIANT_QUANTITY,
        price: primaryVariant.price_number || undefined,
        sku: primaryVariant.sku ? `DMN-${primaryVariant.sku}` : productSku,
        image: primaryVariant.image_url ? absolutizeUrl(primaryVariant.image_url, SOURCE_BASE_URL) : defaultImage,
      },
    ] satisfies SourceVariant[];
  }

  return variantPayload.map((variant) => ({
    type: "Variação",
    label: buildVariantLabel(variant, optionLabels) || "Padrão",
    quantity: variant.stock || DEFAULT_IMPORTED_VARIANT_QUANTITY,
    price: variant.price_number || undefined,
    sku: variant.sku ? `DMN-${variant.sku}` : `${productSku}-${variant.id}`,
    image: variant.image_url ? absolutizeUrl(variant.image_url, SOURCE_BASE_URL) : defaultImage,
  })) satisfies SourceVariant[];
}

function parseProductPage(url: string, html: string): SourceProduct | null {
  if (/\/personalizados\//i.test(url)) {
    return null;
  }

  const sourceTitle = normalizeWhitespace(
    extractFirstGroup(html, /<meta property="og:title" content="([^"]+)"/i) || extractFirstGroup(html, /<title>([^<]+)<\/title>/i) || "",
  );
  if (!sourceTitle) {
    return null;
  }

  const variantsPayload = parseVariantPayload(html);
  const visibleVariant = variantsPayload.find((variant) => variant.is_visible) || variantsPayload[0];
  const price = visibleVariant?.price_number || parseCurrencyValue(extractFirstGroup(html, /<meta property="nuvemshop:price" content="([^"]+)"/i));
  if (!price) {
    return null;
  }

  const comparePrice = visibleVariant?.compare_at_price_number || undefined;
  const categoryName = extractCategoryName(html);
  if (/personalizados/i.test(categoryName)) {
    return null;
  }

  const description = extractFirstGroup(html, /<div class="product-description user-content">([\s\S]*?)<\/div>/i);
  const images = extractImages(html, variantsPayload);
  const primaryImage = images[0] || (visibleVariant?.image_url ? absolutizeUrl(visibleVariant.image_url, SOURCE_BASE_URL) : "");
  if (!primaryImage) {
    return null;
  }

  const productId = visibleVariant?.product_id || Number.parseInt(extractFirstGroup(html, /data-store="product-form-(\d+)"/i) || "", 10) || sourceTitle.length;
  const productSku = `DMN-${productId}`;
  const variants = extractVariants(html, primaryImage, productSku);

  return {
    sourceUrl: url,
    sourceTitle,
    sourceDescription: buildImportedDescription(description ? normalizeWhitespace(stripTags(description)) : sourceTitle, []),
    topHighlights: [],
    categoryName,
    categorySlug: buildCategorySlug(categoryName),
    brandName: SOURCE_DEFAULT_BRAND,
    brandSlug: "dmanu-semijoias",
    price,
    comparePrice,
    image: primaryImage,
    images,
    variants,
    sku: productSku,
  };
}

async function fetchCatalogUrls() {
  const xml = await fetchText(SOURCE_SITEMAP_URL, SOURCE_BASE_URL);
  return unique(
    Array.from(xml.matchAll(/<loc>(https:\/\/dmanusemijoias\.com\.br\/[^<]+)<\/loc>/g))
      .map((match) => match[1])
      .filter((url) => /\/produtos\//i.test(url))
      .filter((url) => !/\/pt\//i.test(url))
      .filter((url) => !/\/personalizados\//i.test(url)),
  );
}

async function collectSourceProducts() {
  const urls = await fetchCatalogUrls();
  const progress = await readImportProgress(IMPORT_PROGRESS_FILE);
  const resume = process.argv.includes("--resume");
  const pendingUrls = resume ? urls.filter((url) => !progress.completedUrls.includes(url)) : urls;
  const products: SourceProduct[] = resume ? [...progress.mappedProducts] : [];
  const seenKeys = new Set(products.map((product) => product.sku));
  const completedUrls = new Set(progress.completedUrls);
  const failedUrls = new Set<string>();

  console.log(`[${SOURCE_LABEL}] URLs encontradas: ${urls.length}`);

  for (const [index, url] of pendingUrls.entries()) {
    try {
      const html = await fetchText(url, SOURCE_BASE_URL);
      const product = parseProductPage(url, html);
      completedUrls.add(url);

      if (product && !seenKeys.has(product.sku)) {
        seenKeys.add(product.sku);
        products.push(product);
        console.log(`[${SOURCE_LABEL}] ${products.length} produto(s) mapeado(s) | ${index + 1}/${pendingUrls.length}: ${product.sourceTitle}`);
      }

      await writeImportProgress(IMPORT_PROGRESS_FILE, {
        completedUrls: Array.from(completedUrls),
        failedUrls: Array.from(failedUrls),
        mappedProducts: products,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      failedUrls.add(url);
      await writeImportProgress(IMPORT_PROGRESS_FILE, {
        completedUrls: Array.from(completedUrls),
        failedUrls: Array.from(failedUrls),
        mappedProducts: products,
        updatedAt: new Date().toISOString(),
      });
      console.error(`[${SOURCE_LABEL}] Falha ao ler ${url}:`, error);
    }
  }

  return products;
}

async function debugSingleProduct(url: string) {
  const html = await fetchText(url, SOURCE_BASE_URL);
  const product = parseProductPage(url, html);

  if (!product) {
    throw new Error(`Nenhum produto identificado na URL ${url}`);
  }

  console.log(JSON.stringify(product, null, 2));
}

async function main() {
  const debugUrlIndex = process.argv.findIndex((argument) => argument === "--debug-url");
  if (debugUrlIndex >= 0) {
    const debugUrl = process.argv[debugUrlIndex + 1];
    if (!debugUrl) {
      throw new Error("Informe uma URL após --debug-url.");
    }

    await debugSingleProduct(debugUrl);
    return;
  }

  const products = await collectSourceProducts();
  const archiveMissing = process.argv.includes("--archive-missing");
  const importedCount = await persistImportedProducts(products, SOURCE_LABEL, archiveMissing);
  console.log(`[${SOURCE_LABEL}] Importação concluída com ${importedCount} produtos ativos.`);
}

main()
  .catch((error) => {
    console.error(`[${SOURCE_LABEL}] Falha:`, error);
    process.exit(1);
  })
  .finally(async () => {
    await closeCatalogImportResources();
  });