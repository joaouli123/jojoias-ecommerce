import assert from "node:assert/strict";
import test from "node:test";
import { summarizeCatalogFacets } from "@/lib/store-data";

test("`summarizeCatalogFacets()` agrega marcas e categorias corretamente", () => {
  const facets = summarizeCatalogFacets([
    {
      brand: { id: "brand-1", name: "Aurora", slug: "aurora" },
      category: { id: "cat-1", name: "Anéis", slug: "aneis" },
    },
    {
      brand: { id: "brand-1", name: "Aurora", slug: "aurora" },
      category: { id: "cat-2", name: "Colares", slug: "colares" },
    },
    {
      brand: { id: "brand-2", name: "Bella", slug: "bella" },
      category: { id: "cat-1", name: "Anéis", slug: "aneis" },
    },
    {
      brand: null,
      category: { id: "cat-1", name: "Anéis", slug: "aneis" },
    },
  ]);

  assert.deepEqual(facets.brands, [
    { id: "brand-1", name: "Aurora", slug: "aurora", productCount: 2 },
    { id: "brand-2", name: "Bella", slug: "bella", productCount: 1 },
  ]);

  assert.deepEqual(facets.categories, [
    { id: "cat-1", name: "Anéis", slug: "aneis", productCount: 3 },
    { id: "cat-2", name: "Colares", slug: "colares", productCount: 1 },
  ]);
});