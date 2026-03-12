import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, ProductStatus } from "@prisma/client";
import type { Browser, BrowserContext, Page } from "playwright";
import { buildProductMetaDescription, buildProductSeoTitle, generateProductSlug } from "../src/lib/product-seo";
import { generateProductSeoWithAi } from "../src/lib/product-seo-ai";
import { buildImportedDescription } from "../src/lib/product-content";

const prisma = new PrismaClient();
const DEFAULT_IMPORTED_VARIANT_QUANTITY = 20;
const SOURCE_BASE_URL = "https://www.lunaacessorios.com.br";
const SOURCE_SITEMAP_URL = `${SOURCE_BASE_URL}/sitemap.xml`;
const SOURCE_DEFAULT_BRAND = "Luna Acessórios";
const REQUEST_DELAY_MS = Math.max(800, Number.parseInt(process.env.LUNA_IMPORT_DELAY_MS || "1500", 10) || 1500);
const MAX_FETCH_RETRIES = Math.max(1, Number.parseInt(process.env.LUNA_IMPORT_RETRIES || "3", 10) || 3);
const BROWSER_NAVIGATION_TIMEOUT_MS = Math.max(15000, Number.parseInt(process.env.LUNA_IMPORT_BROWSER_TIMEOUT_MS || "45000", 10) || 45000);
const ENABLE_BROWSER_FETCH = process.env.LUNA_IMPORT_BROWSER !== "0";
const ENABLE_AI_SEO = process.env.LUNA_IMPORT_AI_SEO === "1";
const BROWSER_HEADLESS = process.env.LUNA_IMPORT_HEADLESS !== "0";
const BROWSER_USER_AGENT = process.env.LUNA_IMPORT_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const IMPORT_PROGRESS_FILE = path.resolve(process.cwd(), ".cache", "luna-import-progress.json");
const LOCAL_SITEMAP_FILE = path.resolve(process.cwd(), "scripts", "luna-sitemap.xml");
const SKIP_PATH_PREFIXES = ["m", "blog", "faq", "sobre", "termos", "politica-privacidade", "politica", "login", "carrinho", "central", "selo", "avaliacoes", "ser-afiliado", "p"];
const SKIP_EXACT_SLUGS = new Set(["", "aco-inox", "aneis", "berloques", "bolsas", "brincos", "colares", "kit-revenda", "masculino", "oculos", "outrositens", "personalizados-a-laser", "piercings", "pingentes", "pulseiras", "relogios"]);

type BrowserSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
};

type SourceVariant = {
  type: string;
  label: string;
  sku?: string;
  quantity: number;
  image?: string;
};

type SourceProduct = {
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

type ImportProgress = {
  completedUrls: string[];
  failedUrls: string[];
  mappedProducts: SourceProduct[];
  updatedAt: string;
};

let browserSessionPromise: Promise<BrowserSession | null> | null = null;

function buildImageAlt(productTitle: string, position: number) {
  return position === 0
    ? `${productTitle} da Luxijóias`
    : `${productTitle} da Luxijóias - imagem ${position + 1}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getHumanDelayMs() {
  const minDelay = Math.max(350, REQUEST_DELAY_MS);
  const maxDelay = Math.max(minDelay + 250, REQUEST_DELAY_MS + 900);
  return randomBetween(minDelay, maxDelay);
}

async function readImportProgress(): Promise<ImportProgress> {
  try {
    const raw = await readFile(IMPORT_PROGRESS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<ImportProgress>;
    return {
      completedUrls: Array.isArray(parsed.completedUrls) ? parsed.completedUrls : [],
      failedUrls: Array.isArray(parsed.failedUrls) ? parsed.failedUrls : [],
      mappedProducts: Array.isArray(parsed.mappedProducts) ? parsed.mappedProducts as SourceProduct[] : [],
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

async function readLocalSitemapXml() {
  try {
    const raw = await readFile(LOCAL_SITEMAP_FILE, "utf8");
    return raw.trim() ? raw : null;
  } catch {
    return null;
  }
}

async function writeImportProgress(progress: ImportProgress) {
  await mkdir(path.dirname(IMPORT_PROGRESS_FILE), { recursive: true });
  await writeFile(IMPORT_PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function resetBrowserSession() {
  if (!browserSessionPromise) {
    return;
  }

  const activeSession = await browserSessionPromise.catch(() => null);
  browserSessionPromise = null;

  if (!activeSession) {
    return;
  }

  await activeSession.page.close().catch(() => null);
  await activeSession.context.close().catch(() => null);
  await activeSession.browser.close().catch(() => null);
}

async function createBrowserSession(): Promise<BrowserSession | null> {
  if (!ENABLE_BROWSER_FETCH) {
    return null;
  }

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      headless: BROWSER_HEADLESS,
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    });
    const context = await browser.newContext({
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
      viewport: { width: 1366, height: 900 },
      userAgent: BROWSER_USER_AGENT,
      extraHTTPHeaders: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: "https://www.google.com/",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Upgrade-Insecure-Requests": "1",
      },
    });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(BROWSER_NAVIGATION_TIMEOUT_MS);

    await page.goto(SOURCE_BASE_URL, { waitUntil: "domcontentloaded", referer: "https://www.google.com/" });
    await page.waitForTimeout(randomBetween(1200, 2600));
    console.log("[luna-import] Sessão headless inicializada com Playwright.");

    return { browser, context, page };
  } catch (error) {
    console.warn("[luna-import] Playwright indisponível, usando fetch padrão.", error);
    return null;
  }
}

async function getBrowserSession() {
  if (!browserSessionPromise) {
    browserSessionPromise = createBrowserSession();
  }

  return browserSessionPromise;
}

async function waitForProductPageReady(page: Page) {
  const criticalSelectors = [
    ".detalhes",
    ".nome_produto",
    ".codigo_produto",
    ".valores",
  ];

  for (const selector of criticalSelectors) {
    await page.waitForSelector(selector, {
      state: "attached",
      timeout: 12000,
    }).catch(() => null);
  }

  await page.waitForTimeout(randomBetween(1200, 2200));
}

function decodeHtmlEntities(value: string) {
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

function stripTags(value: string) {
  return decodeHtmlEntities(value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, " "));
}

function normalizeWhitespace(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

function extractFirstMatch(content: string, pattern: RegExp) {
  const match = content.match(pattern);
  return match?.[1] ? normalizeWhitespace(stripTags(match[1])) : null;
}

function extractFirstGroup(content: string, pattern: RegExp) {
  const match = content.match(pattern);
  return match?.[1]?.trim() || null;
}

function parseCurrencyValue(rawValue?: string | null) {
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

function extractBreadcrumbCategory(html: string, productTitle: string) {
  const breadcrumbHtml = extractFirstGroup(html, /<ol class="breadcrumb"[\s\S]*?<\/ol>/i);
  if (!breadcrumbHtml) {
    return null;
  }

  const items = Array.from(breadcrumbHtml.matchAll(/<span itemprop="name">([\s\S]*?)<\/span>/gi))
    .map((match) => normalizeWhitespace(stripTags(match[1])))
    .filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  const filteredItems = items.filter((item) => !/^p[áa]gina inicial$/i.test(item));
  if (filteredItems.length === 0) {
    return null;
  }

  const nonTitleItems = filteredItems.filter((item) => item.toLowerCase() !== productTitle.toLowerCase());
  return nonTitleItems[0] || nonTitleItems.at(-1) || null;
}

function extractInputAttribute(tag: string, attributeName: string) {
  const pattern = new RegExp(`${attributeName}="([^"]+)"`, "i");
  return tag.match(pattern)?.[1]?.trim() || null;
}

function extractSku(html: string) {
  const skuFromMeta = extractFirstGroup(html, /<meta itemprop="sku" content="([^"]+)"/i);
  if (skuFromMeta) {
    return skuFromMeta;
  }

  const skuText = extractFirstMatch(html, /<p class="codigo_produto">([\s\S]*?)<\/p>/i);
  if (!skuText) {
    return null;
  }

  return skuText.replace(/^c[oó]d\.?\s*:\s*/i, "").trim() || null;
}

function extractPrice(html: string) {
  return parseCurrencyValue(extractFirstGroup(html, /class="valor_por"[^>]*>R\$\s*([\d.,]+)/i))
    || parseCurrencyValue(extractFirstGroup(html, /<meta itemprop="price" content="([\d.,]+)"/i))
    || parseCurrencyValue(extractFirstGroup(html, /'total_value':\s*parseFloat\('([\d.,]+)'\)/i))
    || parseCurrencyValue(extractFirstGroup(html, /data-include="inc\.php\?meio=inc_parcelamento&valor=([\d.,]+)/i));
}

function extractTopHighlights(html: string) {
  const badgesHtml = extractFirstGroup(html, /<div class="selos">([\s\S]*?)<\/div>/i);
  if (!badgesHtml) {
    return [];
  }

  return unique(
    Array.from(badgesHtml.matchAll(/<span class="selo"[^>]*>([\s\S]*?)<\/span>/gi))
      .map((match) => normalizeWhitespace(stripTags(match[1])))
      .filter(Boolean),
  );
}

function absolutizeUrl(url: string) {
  if (!url) {
    return url;
  }

  return url.startsWith("http") ? url : new URL(url, SOURCE_BASE_URL).toString();
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function inferBrandName(title: string, fallback: string) {
  if (/casio/i.test(title)) {
    return "Casio";
  }

  if (/luna/i.test(fallback)) {
    return SOURCE_DEFAULT_BRAND;
  }

  return fallback;
}

function buildCategorySlug(categoryName: string) {
  return generateProductSlug(categoryName || "sem-categoria");
}

function buildSkuSlugSuffix(sku: string) {
  const normalizedSku = generateProductSlug(sku).replace(/^-+|-+$/g, "");
  const compactSku = normalizedSku.replace(/-/g, "");
  return compactSku.slice(-10) || normalizedSku || "item";
}

function resolveImportSlug(baseSlug: string, sourceSku: string, duplicateSlugCounts: Map<string, number>) {
  const normalizedBaseSlug = generateProductSlug(baseSlug || sourceSku);
  if ((duplicateSlugCounts.get(normalizedBaseSlug) || 0) <= 1) {
    return normalizedBaseSlug;
  }

  return `${normalizedBaseSlug}-${buildSkuSlugSuffix(sourceSku)}`;
}

function isSkippableUrl(url: string) {
  if (!url.startsWith(SOURCE_BASE_URL)) {
    return true;
  }

  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return true;
  }

  if (SKIP_PATH_PREFIXES.includes(parts[0])) {
    return true;
  }

  if (parts.length === 1 && SKIP_EXACT_SLUGS.has(parts[0])) {
    return true;
  }

  return false;
}

async function fetchText(url: string) {
  let lastError: unknown;
  const isProductUrl = !isSkippableUrl(url);

  for (let attempt = 1; attempt <= MAX_FETCH_RETRIES; attempt += 1) {
    try {
      const browserSession = await getBrowserSession();
      if (browserSession) {
        const response = await browserSession.page.goto(url, {
          waitUntil: "domcontentloaded",
          referer: SOURCE_BASE_URL,
        });

        await browserSession.page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => null);
        if (isProductUrl) {
          await waitForProductPageReady(browserSession.page);
        } else {
          await browserSession.page.waitForTimeout(randomBetween(1000, 2400));
        }

        if (response && response.status() >= 400) {
          throw new Error(`Falha ao buscar ${url} via navegador: ${response.status()}`);
        }

        const html = await browserSession.page.content();
        if (/Request blocked|CloudFront|Request could not be satisfied/i.test(html)) {
          throw new Error(`Página bloqueada ao buscar ${url} via navegador.`);
        }

        return html;
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent": BROWSER_USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Referer: SOURCE_BASE_URL,
          "Upgrade-Insecure-Requests": "1",
        },
      });

      if (!response.ok) {
        throw new Error(`Falha ao buscar ${url}: ${response.status}`);
      }

      return response.text();
    } catch (error) {
      lastError = error;
      await resetBrowserSession();
      if (attempt < MAX_FETCH_RETRIES) {
        await sleep(getHumanDelayMs() * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Falha ao buscar ${url}`);
}

async function fetchCatalogUrls() {
  const envSitemap = process.env.LUNA_SITEMAP_XML;
  const localSitemap = envSitemap || (await readLocalSitemapXml());
  const xml = localSitemap ? localSitemap : await fetchText(SOURCE_SITEMAP_URL);
  const matches = Array.from(xml.matchAll(/<loc>(https:\/\/www\.lunaacessorios\.com\.br\/[^<]+)<\/loc>/g));
  const urls = unique(matches.map((match) => match[1]));
  console.log(localSitemap ? `[luna-import] Usando sitemap local (${LOCAL_SITEMAP_FILE}).` : `[luna-import] Usando sitemap remoto.`);
  return urls.filter((url) => !isSkippableUrl(url));
}

function extractImages(html: string) {
  const links = Array.from(html.matchAll(/<a href="([^"]+)"[^>]*class="fancybox"[^>]*data-fancybox-group="(?:d|m)-[^"]+"/g)).map((match) => absolutizeUrl(match[1]));
  const metaImage = extractFirstGroup(html, /<link itemprop="image" href="([^"]+)"/i);

  return unique([metaImage ? absolutizeUrl(metaImage) : "", ...links].filter(Boolean));
}

function extractVariants(html: string, defaultImage: string): SourceVariant[] {
  const varsBlock = extractFirstGroup(html, /<div class="vars">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<div class="botoes">/i) || html;
  const variants = Array.from(varsBlock.matchAll(/<div class="it"[^>]*>[\s\S]*?<div class="t"><p>([\s\S]*?)<\/p><\/div>\s*(<input[^>]+>)/gi))
    .map((match) => {
      const inputTag = match[2];
      const quantityRaw = extractInputAttribute(inputTag, "max") || extractInputAttribute(inputTag, "placeholder");
      const sku = extractInputAttribute(inputTag, "data-sku");
      const label = normalizeWhitespace(stripTags(match[1]));

      if (!label || !sku) {
        return null;
      }

      return {
        type: "Opção",
        label,
        quantity: Number.parseInt(quantityRaw || "", 10) || DEFAULT_IMPORTED_VARIANT_QUANTITY,
        sku,
        image: defaultImage,
      };
    })
    .filter((variant): variant is SourceVariant => Boolean(variant));

  if (variants.length > 0) {
    return variants;
  }

  const sku = extractSku(html);
  return [
    {
      type: "Padrão",
      label: "Padrão",
      quantity: DEFAULT_IMPORTED_VARIANT_QUANTITY,
      sku: sku || undefined,
      image: defaultImage,
    },
  ];
}

function parseProductPage(url: string, html: string): SourceProduct | null {
  if (!html.includes('itemtype="https://schema.org/Product"') || !html.includes('class="nome_produto"')) {
    return null;
  }

  const sourceTitle = extractFirstMatch(html, /<h3 class="nome_produto"[^>]*>([\s\S]*?)<\/h3>/i);
  if (!sourceTitle) {
    return null;
  }

  const categoryName = extractFirstGroup(html, /'item_category':\s*'([^']+)'/i)
    || extractFirstGroup(html, /'item_category2':\s*'([^']+)'/i)
    || extractBreadcrumbCategory(html, sourceTitle)
    || "Sem categoria";
  const description = extractFirstMatch(html, /<div class="descricao">[\s\S]*?<div class="texto">([\s\S]*?)<\/div>/i) || sourceTitle;
  const topHighlights = extractTopHighlights(html);
  const sourceSku = extractSku(html);
  const brandMeta = extractFirstGroup(html, /<meta itemprop="name" content="([^"]+)"\s*\/?>\s*<\/div>/i) || SOURCE_DEFAULT_BRAND;
  const brandName = inferBrandName(sourceTitle, normalizeWhitespace(decodeHtmlEntities(brandMeta)));
  const price = extractPrice(html);

  if (!price) {
    return null;
  }

  const images = extractImages(html);
  const primaryImage = images[0] || "";
  if (!primaryImage) {
    return null;
  }

  const variants = extractVariants(html, primaryImage);
  const fallbackSku = variants[0]?.sku || generateProductSlug(sourceTitle).toUpperCase();

  return {
    sourceUrl: url,
    sourceTitle,
    sourceDescription: buildImportedDescription(description, topHighlights),
    topHighlights,
    categoryName,
    categorySlug: buildCategorySlug(categoryName),
    brandName,
    brandSlug: generateProductSlug(brandName),
    price,
    comparePrice: undefined,
    image: primaryImage,
    images,
    variants,
    sku: sourceSku || fallbackSku,
  };
}

async function generateSeo(product: SourceProduct) {
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

async function collectSourceProducts() {
  const urls = await fetchCatalogUrls();
  const progress = await readImportProgress();
  const resume = process.argv.includes("--resume");
  const pendingUrls = resume ? urls.filter((url) => !progress.completedUrls.includes(url)) : urls;
  console.log(`[luna-import] URLs candidatas encontradas no sitemap: ${urls.length}`);
  if (resume) {
    console.log(`[luna-import] Retomando execução. URLs restantes: ${pendingUrls.length}`);
  }

  const products: SourceProduct[] = resume ? [...progress.mappedProducts] : [];
  const seenKeys = new Set<string>(products.map((product) => `${product.sku}|${product.sourceTitle}`.toLowerCase()));
  const completedUrls = new Set(progress.completedUrls);
  const failedUrls = new Set<string>();

  for (const [index, url] of pendingUrls.entries()) {
    try {
      if (index > 0) {
        await sleep(getHumanDelayMs());
      }

      const html = await fetchText(url);
      const product = parseProductPage(url, html);
      completedUrls.add(url);

      if (!product) {
        await writeImportProgress({
          completedUrls: Array.from(completedUrls),
          failedUrls: Array.from(failedUrls),
          mappedProducts: products,
          updatedAt: new Date().toISOString(),
        });
        continue;
      }

      const dedupeKey = `${product.sku}|${product.sourceTitle}`.toLowerCase();
      if (seenKeys.has(dedupeKey)) {
        await writeImportProgress({
          completedUrls: Array.from(completedUrls),
          failedUrls: Array.from(failedUrls),
          mappedProducts: products,
          updatedAt: new Date().toISOString(),
        });
        continue;
      }

      seenKeys.add(dedupeKey);
      products.push(product);
      await writeImportProgress({
        completedUrls: Array.from(completedUrls),
        failedUrls: Array.from(failedUrls),
        mappedProducts: products,
        updatedAt: new Date().toISOString(),
      });
      console.log(`[luna-import] ${products.length} produto(s) mapeado(s) | sitemap ${index + 1}/${pendingUrls.length}: ${product.sourceTitle}`);
    } catch (error) {
      failedUrls.add(url);
      await writeImportProgress({
        completedUrls: Array.from(completedUrls),
        failedUrls: Array.from(failedUrls),
        mappedProducts: products,
        updatedAt: new Date().toISOString(),
      });
      console.error(`[luna-import] Falha ao ler ${url}:`, error);
    }
  }

  return products;
}

async function debugSingleProduct(url: string) {
  console.log(`[luna-import] Validando URL individual: ${url}`);
  const html = await fetchText(url);
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

  console.log("[luna-import] Iniciando importação completa do catálogo...");
  const products = await collectSourceProducts();
  const archiveMissing = process.argv.includes("--archive-missing");
  const currentActiveCount = await prisma.product.count({ where: { status: ProductStatus.ACTIVE } });
  const minimumSafeImportCount = Math.max(10, currentActiveCount);

  if (products.length === 0) {
    throw new Error("Nenhum produto foi identificado no catálogo de origem.");
  }

  console.log(`[luna-import] Produtos válidos identificados: ${products.length}`);
  if (archiveMissing && products.length < minimumSafeImportCount) {
    throw new Error(`Coleta parcial detectada. Importados ${products.length}, mínimo seguro ${minimumSafeImportCount}. O catálogo atual foi preservado.`);
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

  let importedCount = 0;
  const importedProductIds: string[] = [];
  const duplicateSlugCounts = products.reduce((counts, product) => {
    const slug = generateProductSlug(product.sourceTitle);
    counts.set(slug, (counts.get(slug) || 0) + 1);
    return counts;
  }, new Map<string, number>());

  for (const source of products) {
    const seo = await generateSeo(source);
    let resolvedSlug = resolveImportSlug(seo.slug, source.sku, duplicateSlugCounts);
    const galleryImages = unique([source.image, ...source.images].filter(Boolean));
    const importedVariantQuantity = source.variants.reduce((total, variant) => total + (variant.quantity || 0), 0);
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
    await prisma.productVariant.createMany({
      data: source.variants.map((variant, index) => ({
        productId: created.id,
        name: variant.type === "Padrão" ? variant.label : `${variant.type}: ${variant.label}`,
        sku: variant.sku || `${source.sku}-${String(index + 1).padStart(2, "0")}`,
        price: source.price,
        quantity: variant.quantity || DEFAULT_IMPORTED_VARIANT_QUANTITY,
        image: variant.image ?? primaryImage,
        isActive: true,
      })),
    });

    importedCount += 1;
    importedProductIds.push(created.id);
    console.log(`[luna-import] Produto importado ${importedCount}/${products.length}: ${seo.title} (${seo.slug})`);
  }

  if (archiveMissing) {
    console.log("[luna-import] Arquivando itens não reencontrados apenas após coleta segura...");
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

  console.log(`[luna-import] Importação concluída com ${importedCount} produtos ativos.`);
}

main().catch((error) => {
  console.error("[luna-import] Falha:", error);
  process.exit(1);
}).finally(async () => {
  await resetBrowserSession();
  await prisma.$disconnect();
});