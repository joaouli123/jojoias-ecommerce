import { readFile } from "node:fs/promises";

async function main() {
  const raw = await readFile(".cache/dmanu-import-progress.json", "utf8");
  const progress = JSON.parse(raw) as {
    mappedProducts: Array<{
      sourceTitle: string;
      sku: string;
      variants: Array<{ sku?: string; label: string; type: string }>;
      sourceUrl: string;
    }>;
  };

  const lastProducts = progress.mappedProducts.slice(28, 36).map((product) => ({
    title: product.sourceTitle,
    sku: product.sku,
    url: product.sourceUrl,
    variants: product.variants,
  }));

  console.log(JSON.stringify(lastProducts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
