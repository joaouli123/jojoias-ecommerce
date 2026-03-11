import assert from "node:assert/strict";
import test from "node:test";
import { estimateReadingMinutes, parseBlogTags } from "@/lib/blog";

test("`parseBlogTags()` normaliza tags separadas por vírgula", () => {
  assert.deepEqual(parseBlogTags("seo, presentes,  cuidados "), ["seo", "presentes", "cuidados"]);
  assert.deepEqual(parseBlogTags(null), []);
});

test("`estimateReadingMinutes()` nunca retorna menos que 1", () => {
  assert.equal(estimateReadingMinutes("texto curto"), 1);
  assert.equal(estimateReadingMinutes(new Array(361).fill("palavra").join(" ")), 3);
});