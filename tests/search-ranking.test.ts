import assert from "node:assert/strict";
import test from "node:test";
import { expandSearchTerms, scoreSearchFields, tokenizeSearchQuery } from "@/lib/store-data";

test("`tokenizeSearchQuery()` normaliza acentos e separa termos", () => {
  assert.deepEqual(tokenizeSearchQuery("  Anel Dourado  Luxo "), ["anel", "dourado", "luxo"]);
  assert.deepEqual(tokenizeSearchQuery("Colar Áurea"), ["colar", "aurea"]);
});

test("`expandSearchTerms()` adiciona sinônimos comerciais úteis", () => {
  const expanded = expandSearchTerms("anel dourado luxo");

  assert.ok(expanded.includes("anel"));
  assert.ok(expanded.includes("aro"));
  assert.ok(expanded.includes("ouro"));
  assert.ok(expanded.includes("premium"));
});

test("`scoreSearchFields()` prioriza correspondência exata e prefixo no nome", () => {
  const exactNameScore = scoreSearchFields("anel luxo", ["Anel Luxo", null, null, "Aurora", "Anéis"]);
  const categoryOnlyScore = scoreSearchFields("anel luxo", ["Pulseira Premium", null, null, "Aurora", "Anéis"]);
  const brandOnlyScore = scoreSearchFields("aurora", ["Pulseira Premium", null, null, "Aurora", "Pulseiras"]);

  assert.ok(exactNameScore > categoryOnlyScore);
  assert.ok(brandOnlyScore > 0);
});

test("`scoreSearchFields()` recompensa SKU e múltiplos campos combinados", () => {
  const skuScore = scoreSearchFields("sku-123", ["Produto X", "SKU-123", null, null, "Acessórios"]);
  const partialScore = scoreSearchFields("serum antioxidante", ["Sérum Facial", null, "Antioxidante com vitamina c", null, "Skincare"]);

  assert.ok(skuScore > 0);
  assert.ok(partialScore > 0);
  assert.ok(partialScore > scoreSearchFields("serum antioxidante", ["Creme Corporal", null, null, null, "Bem-estar"]));
});

test("`scoreSearchFields()` aproveita sinônimos para melhorar descoberta", () => {
  const synonymScore = scoreSearchFields("luxo dourado", ["Colar Premium", null, "acabamento ouro 18k", null, "Colares"]);
  const unrelatedScore = scoreSearchFields("luxo dourado", ["Pulseira Casual", null, "acabamento fosco", null, "Pulseiras"]);

  assert.ok(synonymScore > unrelatedScore);
});