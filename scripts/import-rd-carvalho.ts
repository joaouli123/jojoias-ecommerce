import path from "node:path";
import {
  DEFAULT_IMPORTED_VARIANT_QUANTITY,
  type SourceProduct,
  type SourceVariant,
  absolutizeUrl,
  buildCategorySlug,
  buildImportedDescription,
  closeCatalogImportResources,
  extractFirstGroup,
  extractFirstMatch,
  fetchText,
  normalizeWhitespace,
  parseCurrencyValue,
  persistImportedProducts,
  readImportProgress,
  stripTags,
  unique,
  writeImportProgress,
} from "./import-catalog-common";

const SOURCE_LABEL = "rdcarvalho-import";
const SOURCE_BASE_URL = "https://www.rdcarvalhojoias.com.br";
const SOURCE_SITEMAP_URL = `${SOURCE_BASE_URL}/sitemap-produtos.xml`;
const SOURCE_DEFAULT_BRAND = "RD Carvalho Joias";
const IMPORT_PROGRESS_FILE = path.resolve(process.cwd(), ".cache", "rdcarvalho-import-progress.json");

function extractBreadcrumbItems(html: string) {
  const breadcrumbSection = extractFirstGroup(html, /<section class="caminho">([\s\S]*?)<\/section>/i) || html;
  return Array.from(breadcrumbSection.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => normalizeWhitespace(match[1].replace(/<i[^>]*><\/i>/gi, "").replace(/<a[^>]*>/gi, "").replace(/<\/a>/gi, "")))
    .map((value) => value.replace(/^>+/, "").trim())
    .filter(Boolean)
    .filter((value) => !/^home$/i.test(value));
}

function extractImages(html: string) {
  const galleryBoundary = html.indexOf('<section class="produto-descricao');
  const galleryHtml = galleryBoundary > 0 ? html.slice(0, galleryBoundary) : html;

  return unique([
    ...Array.from(galleryHtml.matchAll(/bwProduto\.Imagens\.abrirZoom\(event, '([^']+)'\)/g)).map((match) => absolutizeUrl(match[1], SOURCE_BASE_URL)),
    ...Array.from(galleryHtml.matchAll(/bwProduto\.Imagens\.trocarImagem\('([^']+)'\)/g)).map((match) => absolutizeUrl(match[1], SOURCE_BASE_URL)),
    ...Array.from(galleryHtml.matchAll(/<img[^>]+src="([^"]+\/produtos\/[^"]+)"/gi)).map((match) => absolutizeUrl(match[1], SOURCE_BASE_URL)),
  ].filter(Boolean));
}

function extractReference(html: string) {
  const rawReference = extractFirstMatch(html, /<h4 class="traducao-referencia">([\s\S]*?)<\/h4>/i);
  return rawReference?.replace(/^:/, "").trim() || null;
}

function extractVariants(html: string, defaultImage: string, productSku: string) {
  const matches = Array.from(html.matchAll(/<div class="row variacoes-grade-lista-item">([\s\S]*?)<\/div>\s*<\/div>/gi));
  const variants = matches
    .map((match) => {
      const block = match[1];
      const label = extractFirstMatch(block, /<h5>([\s\S]*?)<\/h5>/i);
      const gradeId = extractFirstGroup(block, /grade="(\d+)"/i);
      const quantity = Number.parseInt(extractFirstGroup(block, /max="(\d+)"/i) || "", 10) || DEFAULT_IMPORTED_VARIANT_QUANTITY;
      const price = parseCurrencyValue(extractFirstGroup(block, /<strong>\s*R\$\s*([\d.,]+)/i));

      if (!label || !gradeId) {
        return null;
      }

      return {
        type: "Variação",
        label,
        quantity,
        price,
        sku: `${productSku}-${gradeId}`,
        image: defaultImage,
      } satisfies SourceVariant;
    })
    .filter((variant): variant is SourceVariant => Boolean(variant));

  if (variants.length <= 1) {
    return [
      {
        type: "Padrão",
        label: "Padrão",
        quantity: variants[0]?.quantity || DEFAULT_IMPORTED_VARIANT_QUANTITY,
        price: variants[0]?.price,
        sku: productSku,
        image: defaultImage,
      },
    ];
  }

  return variants;
}

function parseProductPage(url: string, html: string): SourceProduct | null {
  const sourceTitle = extractFirstMatch(html, /<h1>\s*([\s\S]*?)\s*<\/h1>/i);
  if (!sourceTitle) {
    return null;
  }

  const breadcrumbItems = extractBreadcrumbItems(html);
  const categoryName = breadcrumbItems.filter((item) => item.toLowerCase() !== sourceTitle.toLowerCase()).at(-1) || "Sem categoria";
  if (/sob encomenda/i.test(categoryName)) {
    return null;
  }

  const price = parseCurrencyValue(extractFirstGroup(html, /<h2 class="produto-preco">[\s\S]*?R\$\s*([\d.,]+)/i));
  if (!price) {
    return null;
  }

  const comparePrice = parseCurrencyValue(extractFirstGroup(html, /<strike>\s*R\$\s*([\d.,]+)/i));
  const description = extractFirstGroup(html, /<div class="descricao-completa"[^>]*>([\s\S]*?)<\/div>/i);
  const images = extractImages(html);
  const primaryImage = images[0] || "";
  if (!primaryImage) {
    return null;
  }

  const reference = extractReference(html);
  const hiddenSku = extractFirstGroup(html, /<input type="hidden" id="sku" value="([^"]+)"/i);
  const productSku = `RDC-${reference || hiddenSku || sourceTitle}`;
  const variants = extractVariants(html, primaryImage, productSku);

  return {
    sourceUrl: url,
    sourceTitle,
    sourceDescription: buildImportedDescription(description ? normalizeWhitespace(stripTags(description)) : sourceTitle, []),
    topHighlights: [],
    categoryName,
    categorySlug: buildCategorySlug(categoryName),
    brandName: SOURCE_DEFAULT_BRAND,
    brandSlug: "rd-carvalho-joias",
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
  return unique(Array.from(xml.matchAll(/<loc>(https:\/\/www\.rdcarvalhojoias\.com\.br\/produto\/[^<]+)<\/loc>/g)).map((match) => match[1]));
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