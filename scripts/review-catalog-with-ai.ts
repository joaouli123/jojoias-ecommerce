import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { normalizeDisplayText, normalizeInputText } from "@/lib/admin-display";
import {
  buildProductMetaDescription,
  buildProductSeoTitle,
  generateProductSlug,
} from "@/lib/product-seo";
import {
  type ProductSpecItem,
} from "@/lib/product-content";

type CatalogReviewAiInput = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  comparePrice: number | null;
  description: string;
  highlights: string[];
  specs: ProductSpecItem[];
  variants: string[];
};

type CatalogReviewAiOutput = {
  id: string;
  category: string;
  description: string;
  infoItems: string[];
  seoTitle: string;
  metaDescription: string;
};

type ReviewPlan = {
  categoryName: string;
  brandName: string;
  description: string;
  highlights: string[];
  specItems: ProductSpecItem[];
  seoTitle: string;
  metaDescription: string;
};

type ExistingInfoItem = {
  label: string;
  value: string;
};

const MODEL = "gemini-3.1-pro-preview";
const DEFAULT_BATCH_SIZE = Math.max(1, Number.parseInt(process.env.CATALOG_REVIEW_BATCH_SIZE || "10", 10) || 10);
const BATCH_DELAY_MS = Math.max(0, Number.parseInt(process.env.CATALOG_REVIEW_DELAY_MS || "350", 10) || 350);

const CANONICAL_CATEGORIES = [
  "Anéis",
  "Brincos",
  "Pulseiras",
  "Colares",
  "Gargantilhas",
  "Conjuntos",
  "Pingentes",
  "Correntes",
  "Braceletes",
  "Berloques",
  "Tornozeleiras",
  "Piercings",
  "Relógios",
  "Óculos",
  "Bolsas",
  "Acessórios",
] as const;

const SUPPLIER_BRAND_RENAMES: Array<{ slug: string; name: string }> = [
  { slug: "lunoze-joias", name: "Lunozê" },
  { slug: "luna-acessorios-atacado", name: "Luna Acessórios Atacado" },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseFlagValue(flag: string) {
  const index = process.argv.findIndex((argument) => argument === flag);
  if (index < 0) {
    return null;
  }

  return process.argv[index + 1] || null;
}

function normalizeComparableText(value: string | null | undefined) {
  return normalizeDisplayText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function stripHtmlEntities(value: string) {
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
    .replace(/&agrave;/gi, "à")
    .replace(/&uuml;/gi, "ü");
}

function cleanWhitespace(value: string | null | undefined) {
  return normalizeDisplayText(stripHtmlEntities(value || ""))
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripPromotionalNoise(description: string) {
  const blockedLinePatterns = [
    /pre[çc]o de atacado/i,
    /frete gr[áa]tis/i,
    /a partir de 3 itens/i,
    /85%\s*off/i,
    /cupom:\s*atacado/i,
    /o valor com desconto aparecer[aá]/i,
    /kits, acess[oó]rios e pe[çc]as personalizadas/i,
    /considerado o valor l[ií]quido final/i,
    /acima de r\$/i,
    /ative o pre[çc]o de atacado/i,
  ];

  return description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !blockedLinePatterns.some((pattern) => pattern.test(line)))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(" ");
}

function parseLegacySpecLines(lines: string[]) {
  return lines
    .map((line) => cleanWhitespace(line.replace(/^[-•]\s*/, "")))
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/^([^:]{2,80}):\s*(.+)$/);
      if (!match) {
        return [] as ProductSpecItem[];
      }

      return [{
        label: titleCase(match[1]),
        value: cleanWhitespace(match[2]),
      }];
    });
}

function parseExistingInfoBlock(description: string) {
  const match = description.match(/^Informações importantes:\n((?:- .+\n?)*)\n*/i);
  if (!match) {
    return {
      descriptionBody: description,
      infoItems: [] as ExistingInfoItem[],
    };
  }

  const infoItems = match[1]
    .split("\n")
    .map((line) => cleanWhitespace(line.replace(/^[-•]\s*/, "")))
    .filter(Boolean)
    .map((value) => ({ label: "Detalhe", value }));

  return {
    descriptionBody: description.slice(match[0].length).trim(),
    infoItems,
  };
}

function parseExistingSpecsBlock(description: string) {
  const match = description.match(/\n*Especificações técnicas:\n((?:- .+\n?)*)/i);
  if (!match) {
    return {
      descriptionBody: description,
      specItems: [] as ProductSpecItem[],
    };
  }

  return {
    descriptionBody: `${description.slice(0, match.index ?? 0)}${description.slice((match.index ?? 0) + match[0].length)}`.trim(),
    specItems: parseLegacySpecLines(match[1].split("\n")),
  };
}

function buildStructuredCatalogDescription(description: string, highlights: string[], specItems: ProductSpecItem[]) {
  const normalizedDescription = cleanWhitespace(description);
  const normalizedHighlights = Array.from(new Set(highlights.map((item) => cleanWhitespace(item)).filter(Boolean)));
  const normalizedSpecs = Array.from(new Set(specItems
    .map((item) => ({ label: titleCase(cleanWhitespace(item.label)), value: cleanWhitespace(item.value) }))
    .filter((item) => item.label && item.value)
    .map((item) => `${item.label}:::${item.value}`)))
    .map((entry) => {
      const [label, value] = entry.split(":::");
      return { label, value };
    });

  const sections: string[] = [];
  if (normalizedHighlights.length > 0) {
    sections.push(`Informações importantes:\n${normalizedHighlights.map((item) => `- ${item}`).join("\n")}`);
  }

  if (normalizedDescription) {
    sections.push(normalizedDescription);
  }

  if (normalizedSpecs.length > 0) {
    sections.push(`Especificações técnicas:\n${normalizedSpecs.map((item) => `- ${item.label}: ${item.value}`).join("\n")}`);
  }

  return sections.join("\n\n").trim();
}

function extractLegacySpecsFallback(description: string) {
  const bodyLines: string[] = [];
  const dimensionLines: string[] = [];
  const sheetLines: string[] = [];
  const featureLines: string[] = [];
  let section: "dimensions" | "sheet" | "features" | null = null;

  for (const rawLine of description.split("\n")) {
    const line = cleanWhitespace(rawLine);
    const normalized = normalizeComparableText(line).replace(/:+$/, "");

    if (normalized === "dimensoes aproximadas") {
      section = "dimensions";
      continue;
    }

    if (normalized === "ficha tecnica") {
      section = "sheet";
      continue;
    }

    if (normalized === "caracteristicas") {
      section = "features";
      continue;
    }

    if (!line) {
      if (section === null && bodyLines[bodyLines.length - 1] !== "") {
        bodyLines.push("");
      }
      continue;
    }

    if (section === "dimensions") {
      dimensionLines.push(line);
      continue;
    }

    if (section === "sheet") {
      sheetLines.push(line);
      continue;
    }

    if (section === "features") {
      featureLines.push(line);
      continue;
    }

    bodyLines.push(line);
  }

  const specs: ProductSpecItem[] = [];
  if (dimensionLines.length > 0) {
    specs.push({
      label: "Dimensões aproximadas",
      value: dimensionLines.join("; "),
    });
  }

  specs.push(...parseLegacySpecLines(sheetLines));
  specs.push(...parseLegacySpecLines(featureLines));

  return {
    descriptionBody: bodyLines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    specItems: specs,
  };
}

function normalizeBrandName(brandName: string | null | undefined, brandSlug: string | null | undefined) {
  const normalizedName = cleanWhitespace(brandName);
  const rename = SUPPLIER_BRAND_RENAMES.find((entry) => entry.slug === brandSlug);
  if (rename) {
    return rename.name;
  }

  if (/^\d+\s*-\s*$/.test(normalizedName)) {
    return "Lunozê";
  }

  return normalizedName || "Luxijóias";
}

function resolveCanonicalCategory(candidate: string, fallbackName: string) {
  const normalizedCandidate = normalizeComparableText(candidate);
  const normalizedFallback = normalizeComparableText(fallbackName);

  const match = CANONICAL_CATEGORIES.find((category) => normalizeComparableText(category) === normalizedCandidate);
  if (match) {
    return match;
  }

  const aliasMap: Array<[RegExp, (typeof CANONICAL_CATEGORIES)[number]]> = [
    [/(anel|alianca)/i, "Anéis"],
    [/(brinco|argola|argolinha|dupla|trio|ear\s*hook)/i, "Brincos"],
    [/(pulseira)/i, "Pulseiras"],
    [/(gargantilha|choker)/i, "Gargantilhas"],
    [/(colar|escapulario)/i, "Colares"],
    [/(conjunto)/i, "Conjuntos"],
    [/(pingente)/i, "Pingentes"],
    [/(corrente)/i, "Correntes"],
    [/(bracelete)/i, "Braceletes"],
    [/(berloque)/i, "Berloques"],
    [/(tornozeleira)/i, "Tornozeleiras"],
    [/(piercing|nostril)/i, "Piercings"],
    [/(relogio|rel[oó]gio|casio)/i, "Relógios"],
    [/(oculos|[óo]culos)/i, "Óculos"],
    [/(bolsa)/i, "Bolsas"],
    [/(cartela|espelho|veludo|saquinho|acessorio|acess[oó]rio|organza|kit|acr[ií]lico)/i, "Acessórios"],
  ];

  const source = `${normalizedCandidate} ${normalizedFallback}`;
  for (const [pattern, category] of aliasMap) {
    if (pattern.test(source)) {
      return category;
    }
  }

  return "Acessórios";
}

function buildHeuristicHighlights(input: {
  name: string;
  description: string;
  specItems: ProductSpecItem[];
}) {
  const sourceText = `${input.name}\n${input.description}\n${input.specItems.map((item) => `${item.label}: ${item.value}`).join("\n")}`;
  const highlights: string[] = [];

  if (/garantia de 1 ano|garantia: 1 ano|1 ano ap[oó]s/i.test(sourceText)) {
    highlights.push("Garantia de 1 ano");
  }

  if (/antial[eé]rg/i.test(sourceText)) {
    highlights.push("Tecnologia antialérgica");
  }

  const materialMatch = sourceText.match(/(folhead[oa][^\n,.]*ouro 18k|folhead[oa][^\n,.]*r[oó]dio branco|banhad[oa][^\n,.]*prata(?:\s*1000)?|a[çc]o inox[^\n,.]*)/i);
  if (materialMatch) {
    highlights.push(titleCase(cleanWhitespace(materialMatch[1])));
  }

  const corSpec = input.specItems.find((item) => normalizeComparableText(item.label) === "cor");
  if (corSpec) {
    highlights.push(`Cor ${titleCase(corSpec.value)}`);
  }

  return Array.from(new Set(highlights.map((item) => cleanWhitespace(item)).filter(Boolean))).slice(0, 4);
}

function buildFallbackBody(name: string, description: string, categoryName: string, brandName: string) {
  const normalizedDescription = cleanWhitespace(description);
  if (normalizedDescription) {
    return normalizedDescription;
  }

  return `${name} da ${brandName}, com curadoria para quem busca ${categoryName.toLowerCase()} com acabamento refinado e apresentação profissional.`;
}

function extractJsonFromText(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function generateBatchReviewWithAi(products: CatalogReviewAiInput[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || products.length === 0) {
    return null;
  }

  const payload = products.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    currentCategory: product.category,
    price: product.price,
    comparePrice: product.comparePrice,
    description: product.description.slice(0, 1200),
    highlights: product.highlights.slice(0, 5),
    specs: product.specs.slice(0, 12),
    variants: product.variants.slice(0, 8),
  }));

  const prompt = [
    "Você está revisando um catálogo de e-commerce brasileiro de joias e acessórios premium.",
    "Retorne EXCLUSIVAMENTE um JSON válido no formato {\"products\":[...]}, sem markdown e sem texto fora do JSON.",
    "Para cada produto, retorne um objeto com as chaves exatas: id, category, description, infoItems, seoTitle, metaDescription.",
    "Regras obrigatórias:",
    `- category deve ser EXATAMENTE uma destas opções: ${CANONICAL_CATEGORIES.join(", ")}.`,
    "- description deve ter 2 ou 3 parágrafos curtos, escrita profissional, natural, persuasiva e sem inventar atributos que não aparecem nos dados.",
    "- infoItems deve ter de 2 a 4 frases curtas, factuais, sem emojis e sem promoções.",
    "- Nunca inclua preço de atacado, frete grátis, cupons, promoções de pagamento ou observações comerciais.",
    "- Nunca invente materiais, medidas, pedras, tamanhos, banho ou garantia que não estejam nos dados.",
    "- seoTitle deve ser altamente profissional e caber em até 65 caracteres.",
    "- metaDescription deve ser altamente profissional e caber entre 140 e 155 caracteres.",
    "- Se o texto original estiver ruim, reorganize e melhore, mas preserve os fatos concretos.",
    "Dados a revisar:",
    JSON.stringify(payload),
  ].join("\n");

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: "application/json",
        },
      }),
    });

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    if (!response.ok) {
      return null;
    }

    const rawText = json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
    const jsonText = extractJsonFromText(rawText);
    if (!jsonText) {
      return null;
    }

    const parsed = JSON.parse(jsonText) as { products?: CatalogReviewAiOutput[] };
    return Array.isArray(parsed.products) ? parsed.products : null;
  } catch {
    return null;
  }
}

function buildVariantSummary(variants: Array<{ name: string; price: number; quantity: number }>) {
  return variants
    .map((variant) => `${cleanWhitespace(variant.name)} | ${variant.quantity} un | R$ ${variant.price.toFixed(2)}`)
    .slice(0, 8);
}

function buildFallbackPlan(input: {
  id: string;
  name: string;
  brandName: string;
  currentCategory: string;
  description: string;
  specItems: ProductSpecItem[];
  highlights: string[];
  price: number;
  comparePrice: number | null;
}) {
  const categoryName = resolveCanonicalCategory(input.name, input.currentCategory);
  const description = buildFallbackBody(input.name, input.description, categoryName, input.brandName);
  const highlights = input.highlights;

  return {
    categoryName,
    brandName: input.brandName,
    description,
    highlights,
    specItems: input.specItems,
    seoTitle: buildProductSeoTitle({
      name: input.name,
      category: categoryName,
      brand: input.brandName,
      metaTitle: `${input.name} | ${input.brandName}`,
      price: input.price,
      comparePrice: input.comparePrice,
      siteName: "Luxijóias",
    }),
    metaDescription: buildProductMetaDescription({
      name: input.name,
      category: categoryName,
      brand: input.brandName,
      metaDescription: `${input.name} da ${input.brandName} com descrição organizada, ficha técnica clara e compra segura na Luxijóias.`,
      description,
      price: input.price,
      comparePrice: input.comparePrice,
      siteName: "Luxijóias",
    }),
  } satisfies ReviewPlan;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlyActive = !process.argv.includes("--all-statuses");
  const limit = Number.parseInt(parseFlagValue("--limit") || "0", 10) || 0;
  const offset = Number.parseInt(parseFlagValue("--offset") || "0", 10) || 0;
  const batchSize = Number.parseInt(parseFlagValue("--batch-size") || String(DEFAULT_BATCH_SIZE), 10) || DEFAULT_BATCH_SIZE;

  for (const rename of SUPPLIER_BRAND_RENAMES) {
    await prisma.brand.updateMany({
      where: { slug: rename.slug },
      data: { name: rename.name },
    });
  }

  const categoryMap = new Map<string, string>();
  for (const categoryName of CANONICAL_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: generateProductSlug(categoryName) },
      update: { name: categoryName },
      create: { name: categoryName, slug: generateProductSlug(categoryName) },
      select: { id: true, name: true },
    });
    categoryMap.set(category.name, category.id);
  }

  const products = await prisma.product.findMany({
    where: onlyActive ? { status: "ACTIVE" } : undefined,
    select: {
      id: true,
      name: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      price: true,
      comparePrice: true,
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } },
      variants: { select: { name: true, price: true, quantity: true } },
    },
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" },
    ],
    skip: offset,
    take: limit || undefined,
  });

  let updatedCount = 0;
  let failedCount = 0;
  let aiBatchCount = 0;

  for (let index = 0; index < products.length; index += batchSize) {
    const batch = products.slice(index, index + batchSize);
    const prepared = batch.map((product) => {
      const brandName = normalizeBrandName(product.brand?.name, product.brand?.slug);
      const sanitizedDescription = stripPromotionalNoise(cleanWhitespace(product.description));
      const existingInfo = parseExistingInfoBlock(sanitizedDescription);
      const existingSpecs = parseExistingSpecsBlock(existingInfo.descriptionBody);
      const legacyFallback = existingSpecs.specItems.length > 0
        ? { descriptionBody: existingSpecs.descriptionBody, specItems: existingSpecs.specItems }
        : extractLegacySpecsFallback(existingSpecs.descriptionBody);
      const effectiveExtraction = {
        descriptionBody: legacyFallback.descriptionBody,
        infoItems: existingInfo.infoItems,
        specItems: legacyFallback.specItems,
      };
      const highlights = buildHeuristicHighlights({
        name: product.name,
        description: effectiveExtraction.descriptionBody,
        specItems: effectiveExtraction.specItems,
      });

      return {
        product,
        brandName,
        sanitizedDescription,
        extracted: effectiveExtraction,
        highlights,
      };
    });

    const aiInput: CatalogReviewAiInput[] = prepared.map(({ product, brandName, sanitizedDescription, extracted, highlights }) => ({
      id: product.id,
      name: cleanWhitespace(product.name),
      brand: brandName,
      category: cleanWhitespace(product.category.name),
      price: product.price,
      comparePrice: product.comparePrice,
      description: extracted.descriptionBody || sanitizedDescription,
      highlights,
      specs: extracted.specItems,
      variants: buildVariantSummary(product.variants),
    }));

    const aiResult = await generateBatchReviewWithAi(aiInput);
    if (aiResult) {
      aiBatchCount += 1;
    }

    const aiMap = new Map((aiResult || []).map((item) => [item.id, item]));

    for (const entry of prepared) {
      try {
        const aiProduct = aiMap.get(entry.product.id);
        const fallback = buildFallbackPlan({
          id: entry.product.id,
          name: cleanWhitespace(entry.product.name),
          brandName: entry.brandName,
          currentCategory: entry.product.category.name,
          description: entry.extracted.descriptionBody || entry.sanitizedDescription,
          specItems: entry.extracted.specItems,
          highlights: entry.highlights,
          price: entry.product.price,
          comparePrice: entry.product.comparePrice,
        });

        const categoryName = resolveCanonicalCategory(aiProduct?.category || fallback.categoryName, entry.product.category.name);
        const descriptionBody = cleanWhitespace(aiProduct?.description || fallback.description);
        const mergedHighlights = Array.from(new Set([
          ...entry.extracted.infoItems.map((item) => item.value),
          ...entry.highlights,
          ...(Array.isArray(aiProduct?.infoItems) ? aiProduct.infoItems.map((item) => cleanWhitespace(item)) : []),
        ].filter((item) => Boolean(item) && item.length <= 110))).slice(0, 4);

        const seoTitle = buildProductSeoTitle({
          name: cleanWhitespace(entry.product.name),
          category: categoryName,
          brand: entry.brandName,
          metaTitle: cleanWhitespace(aiProduct?.seoTitle || fallback.seoTitle),
          price: entry.product.price,
          comparePrice: entry.product.comparePrice,
          siteName: "Luxijóias",
        });
        const metaDescription = buildProductMetaDescription({
          name: cleanWhitespace(entry.product.name),
          category: categoryName,
          brand: entry.brandName,
          description: descriptionBody,
          metaDescription: cleanWhitespace(aiProduct?.metaDescription || fallback.metaDescription),
          price: entry.product.price,
          comparePrice: entry.product.comparePrice,
          siteName: "Luxijóias",
        });

        const finalDescription = buildStructuredCatalogDescription(
          descriptionBody,
          mergedHighlights,
          entry.extracted.specItems,
        );

        if (!dryRun) {
          await prisma.product.update({
            where: { id: entry.product.id },
            data: {
              description: finalDescription,
              metaTitle: seoTitle,
              metaDescription,
              categoryId: categoryMap.get(categoryName),
            },
          });
        }

        updatedCount += 1;
        console.log(`[${updatedCount}/${products.length}] Revisado: ${entry.product.name} -> ${categoryName}`);
      } catch (error) {
        failedCount += 1;
        console.error(`Falha ao revisar produto: ${entry.product.name}`);
        console.error(error);
      }
    }

    if (BATCH_DELAY_MS > 0) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(JSON.stringify({
    processed: products.length,
    updatedCount,
    failedCount,
    aiBatchCount,
    dryRun,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });