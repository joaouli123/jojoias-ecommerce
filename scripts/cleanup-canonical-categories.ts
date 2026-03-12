import "dotenv/config";
import { prisma } from "../src/lib/prisma";

declare const process: {
  argv: string[];
  exit(code?: number): never;
};

const CANONICAL_CATEGORY_SLUGS = [
  "aneis",
  "brincos",
  "pulseiras",
  "colares",
  "gargantilhas",
  "conjuntos",
  "pingentes",
  "correntes",
  "braceletes",
  "berloques",
  "tornozeleiras",
  "piercings",
  "relogios",
  "oculos",
  "bolsas",
  "acessorios",
] as const;

const DEFAULT_CONCURRENCY = 16;

function normalize(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseNumericFlag(flag: string, fallback: number) {
  const index = process.argv.findIndex((argument) => argument === flag);
  if (index < 0) {
    return fallback;
  }

  const parsed = Number.parseInt(process.argv[index + 1] || String(fallback), 10) || fallback;
  return parsed > 0 ? parsed : fallback;
}

function resolveTargetSlug(categorySlug: string, categoryName: string, productName: string) {
  const normalizedSlug = normalize(categorySlug);
  const normalizedName = normalize(categoryName);
  const source = `${normalizedSlug} ${normalizedName} ${normalize(productName)}`;
  const forceAccessorySlugs = new Set([
    "dupla-grande",
    "tripla-grande",
    "acrilico",
    "veludo",
    "saquinhos-adesivos",
    "papelao",
    "corino",
    "embalagens",
    "etiquetas",
    "saquinhos-organza",
    "expositores-mdf",
    "medidores",
    "eva",
    "misto",
    "papelaria",
    "variadas",
    "kits-empreendedora",
    "bandeja-quadriculado",
    "alfinetes",
    "limpa-joias",
    "alicates",
    "cartelas",
    "bandeja-relogio",
    "balancas",
    "acessorios-para-montagem-de-semijoias",
    "media",
    "envelopes-ziper",
    "bandeja-mista",
    "mix-de-pecas",
    "bandeja-oculos-e-relogio",
    "bandeja-lisa",
    "sublime",
    "bandeja-para-conjunto",
  ]);

  if (CANONICAL_CATEGORY_SLUGS.includes(normalizedSlug as (typeof CANONICAL_CATEGORY_SLUGS)[number])) {
    return normalizedSlug;
  }

  if (forceAccessorySlugs.has(normalizedSlug)) {
    return "acessorios";
  }

  if (normalizedSlug === "kits") {
    if (/\banel/.test(source)) return "aneis";
    if (/\bpulseira/.test(source)) return "pulseiras";
    if (/\bbrinco|argola|argolinha/.test(source)) return "brincos";
    if (/\bconjunto/.test(source)) return "conjuntos";
    return "acessorios";
  }

  if (normalizedSlug === "berloqueira") {
    if (/\bpulseira/.test(source)) return "pulseiras";
    return "berloques";
  }

  if (normalizedSlug === "dupla-grande" || normalizedSlug === "tripla-grande") {
    return "acessorios";
  }

  if (/(pingente)/.test(source)) return "pingentes";
  if (/(berloque)/.test(source)) return "berloques";
  if (/(anel|alianca)/.test(source)) return "aneis";
  if (/(choker|gargantilha)/.test(source)) return "gargantilhas";
  if (/(brinco|argola|argolinha|trio|duo|dupla)/.test(source)) return "brincos";
  if (/(pulseira)/.test(source)) return "pulseiras";
  if (/(bracelete)/.test(source)) return "braceletes";
  if (/(tornozeleira)/.test(source)) return "tornozeleiras";
  if (/(colar|escapulario)/.test(source)) return "colares";
  if (/(corrente)/.test(source)) return "correntes";
  if (/(bolsa)/.test(source)) return "bolsas";
  if (/(piercing|nostril)/.test(source)) return "piercings";

  if (/(maleta|estojo|expositor|porta joia|porta-joia|caixinha|caixa|sacolinha|papelao|acrilico|veludo|corino|embalagen|etiqueta|organza|saquinho|mdf|mostruario|mostruário)/.test(source)) {
    return "acessorios";
  }

  return null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const concurrency = parseNumericFlag("--concurrency", DEFAULT_CONCURRENCY);

  const canonicalCategories = await prisma.category.findMany({
    where: { slug: { in: [...CANONICAL_CATEGORY_SLUGS] } },
    select: { id: true, slug: true, name: true },
  });
  const canonicalMap = new Map(canonicalCategories.map((category) => [normalize(category.slug), category.id]));

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      categoryId: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const candidates = products
    .map((product) => {
      const categorySlug = product.category?.slug || "";
      const categoryName = product.category?.name || "";
      const targetSlug = resolveTargetSlug(categorySlug, categoryName, product.name);
      const targetCategoryId = targetSlug ? canonicalMap.get(targetSlug) : null;

      if (!targetSlug || !targetCategoryId || targetCategoryId === product.categoryId) {
        return null;
      }

      return {
        id: product.id,
        name: product.name,
        fromSlug: categorySlug,
        targetSlug,
        targetCategoryId,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      name: string;
      fromSlug: string;
      targetSlug: string;
      targetCategoryId: string;
    }>;

  let updated = 0;
  let failed = 0;
  const movedByTarget = new Map<string, number>();

  for (let index = 0; index < candidates.length; index += concurrency) {
    const chunk = candidates.slice(index, index + concurrency);
    const results = await Promise.allSettled(
      chunk.map(async (candidate) => {
        if (!dryRun) {
          await prisma.product.update({
            where: { id: candidate.id },
            data: { categoryId: candidate.targetCategoryId },
          });
        }

        return candidate;
      }),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        failed += 1;
        console.error("Falha ao remapear categoria:");
        console.error(result.reason);
        continue;
      }

      updated += 1;
      movedByTarget.set(result.value.targetSlug, (movedByTarget.get(result.value.targetSlug) || 0) + 1);
      console.log(`[${updated}] Categoria remapeada: ${result.value.name} (${result.value.fromSlug} -> ${result.value.targetSlug})`);
    }
  }

  console.log(JSON.stringify({
    scanned: products.length,
    candidates: candidates.length,
    updated,
    failed,
    dryRun,
    concurrency,
    movedByTarget: Object.fromEntries([...movedByTarget.entries()].sort((a, b) => b[1] - a[1])),
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