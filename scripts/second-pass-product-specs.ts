import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { buildStructuredProductDescription, extractProductInfoFromDescription, type ProductSpecItem } from "../src/lib/product-content";

declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
  exit(code?: number): never;
};

const parsedDefaultLimit = Number.parseInt(process.env.SPEC_PASS_LIMIT || "0", 10) || 0;
const DEFAULT_LIMIT = parsedDefaultLimit > 0 ? parsedDefaultLimit : 0;
const parsedDefaultConcurrency = Number.parseInt(process.env.SPEC_PASS_CONCURRENCY || "8", 10) || 8;
const DEFAULT_CONCURRENCY = Math.max(1, parsedDefaultConcurrency);

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
};

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function pushSpec(specs: ProductSpecItem[], label: string, value: string) {
  const normalizedLabel = cleanLine(label);
  const normalizedValue = cleanLine(value);

  if (!normalizedLabel || !normalizedValue) {
    return;
  }

  const key = `${normalizedLabel.toLowerCase()}|${normalizedValue.toLowerCase()}`;
  if (specs.some((item) => `${item.label.toLowerCase()}|${item.value.toLowerCase()}` === key)) {
    return;
  }

  specs.push({ label: normalizedLabel, value: normalizedValue });
}

function extractSentenceSpecs(text: string) {
  const specs: ProductSpecItem[] = [];
  const normalizedText = text.replace(/\r/g, "");
  const normalizedLines = normalizedText
    .split("\n")
    .map((line) => cleanLine(line))
    .filter(Boolean);

  for (const match of normalizedText.matchAll(/comprimento(?: total)?(?: da corrente aberta)? de ([\d,.]+\s*(?:cm|mm))(?: acompanhado de extensor de ([\d,.]+\s*(?:cm|mm)))?/gi)) {
    pushSpec(specs, "Comprimento", match[1]);
    if (match[2]) {
      pushSpec(specs, "Extensor", match[2]);
    }
  }

  for (const match of normalizedText.matchAll(/extensor(?: adicional| integrado)? de ([\d,.]+\s*(?:cm|mm))/gi)) {
    pushSpec(specs, "Extensor", match[1]);
  }

  for (const match of normalizedText.matchAll(/corrente(?: modelo [^,.\n]+)?(?: com)?(?: comprimento de)?\s*([\d,.]+\s*(?:cm|mm))/gi)) {
    pushSpec(specs, "Comprimento da corrente", match[1]);
  }

  for (const match of normalizedText.matchAll(/pingente(?: [^,.\n]+)?(?: com)?\s*([\d,.]+\s*(?:cm|mm))(?: de tamanho)?/gi)) {
    pushSpec(specs, "Tamanho do pingente", match[1]);
  }

  for (const match of normalizedText.matchAll(/espessura(?: da [^,.]+)? de ([\d,.]+\s*(?:cm|mm|mil[ií]metros?))/gi)) {
    pushSpec(specs, "Espessura", match[1]);
  }

  for (const match of normalizedText.matchAll(/dimens(?:õ|o)es? aproximadas? de ([^.,\n]+)/gi)) {
    pushSpec(specs, "Dimensões aproximadas", match[1]);
  }

  for (const match of normalizedText.matchAll(/medindo ([\d,.]+\s*(?:cm|mm)[^.,\n]*)/gi)) {
    pushSpec(specs, "Dimensões", match[1]);
  }

  for (const match of normalizedText.matchAll(/(folhead[oa] a [^.,\n]+|folhead[oa] [^.,\n]+|banhad[oa] a [^.,\n]+)/gi)) {
    pushSpec(specs, "Acabamento", match[1]);
  }

  for (const match of normalizedText.matchAll(/(\d+[\d,.]*\s*mil[eé]simos?)/gi)) {
    pushSpec(specs, "Camada de banho", match[1]);
  }

  for (const line of normalizedLines) {
    const currentMatch = line.match(/^corrente\s*[:\-]?\s*([\d,.]+\s*(?:cm|mm))$/i);
    if (currentMatch) {
      pushSpec(specs, "Comprimento da corrente", currentMatch[1]);
      continue;
    }

    const pendantMatch = line.match(/^pingente\s*[:\-]?\s*([\d,.]+\s*(?:cm|mm))$/i);
    if (pendantMatch) {
      pushSpec(specs, "Tamanho do pingente", pendantMatch[1]);
      continue;
    }

    const thicknessMatch = line.match(/^(?:espessura|largura)\s*[:\-]?\s*([\d,.]+\s*(?:cm|mm))$/i);
    if (thicknessMatch) {
      pushSpec(specs, "Espessura", thicknessMatch[1]);
      continue;
    }

    const platingMatch = line.match(/^(?:banhad[oa].*?|folhead[oa].*?)\s+em\s+(\d+[\d,.]*\s*mil[eé]simos?)$/i);
    if (platingMatch) {
      pushSpec(specs, "Camada de banho", platingMatch[1]);
    }
  }

  if (/antial[eé]rg/i.test(normalizedText)) {
    pushSpec(specs, "Tecnologia", "Antialérgica");
  }

  return specs;
}

function splitInfoAndSpecCandidates(infoItems: Array<{ label: string; value: string }>) {
  const retainedInfo: string[] = [];
  const derivedSpecs: ProductSpecItem[] = [];

  for (const item of infoItems) {
    if (/garantia/i.test(item.value)) {
      retainedInfo.push(item.value);
      continue;
    }

    const extracted = extractSentenceSpecs(item.value);
    if (extracted.length > 0) {
      for (const spec of extracted) {
        pushSpec(derivedSpecs, spec.label, spec.value);
      }
      continue;
    }

    retainedInfo.push(item.value);
  }

  return { retainedInfo, derivedSpecs };
}

function parseNumericFlag(flag: string, fallback: number) {
  const index = process.argv.findIndex((argument: string) => argument === flag);
  if (index < 0) {
    return fallback;
  }

  const parsed = Number.parseInt(process.argv[index + 1] || String(fallback), 10) || fallback;
  return parsed > 0 ? parsed : fallback;
}

async function processProduct(product: ProductRow, dryRun: boolean) {
  const currentDescription = product.description ?? "";
  const parsed = extractProductInfoFromDescription(currentDescription);
  const fromInfo = splitInfoAndSpecCandidates(parsed.infoItems);
  const fromBody = extractSentenceSpecs(parsed.descriptionBody);
  const mergedSpecs = [...parsed.specItems];

  for (const spec of [...fromInfo.derivedSpecs, ...fromBody]) {
    pushSpec(mergedSpecs, spec.label, spec.value);
  }

  const nextDescription = buildStructuredProductDescription(
    parsed.descriptionBody,
    fromInfo.retainedInfo,
    mergedSpecs,
  );

  if (nextDescription === currentDescription) {
    return { updated: false, name: product.name };
  }

  if (!dryRun) {
    await prisma.product.update({
      where: { id: product.id },
      data: { description: nextDescription },
    });
  }

  return { updated: true, name: product.name };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limit = parseNumericFlag("--limit", DEFAULT_LIMIT);
  const concurrency = parseNumericFlag("--concurrency", DEFAULT_CONCURRENCY);

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      description: { not: null },
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit || undefined,
  });

  let updated = 0;
  let failed = 0;

  for (let index = 0; index < products.length; index += concurrency) {
    const chunk = products.slice(index, index + concurrency);
    const results = await Promise.allSettled(chunk.map((product) => processProduct(product, dryRun)));

    for (const result of results) {
      if (result.status === "rejected") {
        failed += 1;
        console.error("Falha ao revisar especificações:");
        console.error(result.reason);
        continue;
      }

      if (!result.value.updated) {
        continue;
      }

      updated += 1;
      console.log(`[${updated}] Especificações revisadas: ${result.value.name}`);
    }
  }

  console.log(JSON.stringify({ processed: products.length, updated, failed, dryRun, concurrency }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
