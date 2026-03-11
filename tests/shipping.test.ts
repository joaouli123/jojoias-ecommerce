import assert from "node:assert/strict";
import test from "node:test";
import { buildRuleBasedShippingOptions, normalizeZipcode } from "@/lib/shipping";

test("`normalizeZipcode()` remove caracteres não numéricos", () => {
  assert.equal(normalizeZipcode("01310-930"), "01310930");
  assert.equal(normalizeZipcode("01.310-930 Brasil"), "01310930");
});

test("`buildRuleBasedShippingOptions()` gera frete por regra com padrão, expresso e retirada", () => {
  const options = buildRuleBasedShippingOptions({
    zipcode: "01310-930",
    subtotal: 150,
    itemsCount: 2,
  });

  assert.equal(options.length, 3);
  assert.equal(options[0].id, "standard");
  assert.equal(options[0].region, "Sudeste");
  assert.equal(options[0].amount, 21.4);
  assert.equal(options[0].isFree, false);
  assert.equal(options[0].missingForFree, 49);
  assert.equal(options[1].id, "express");
  assert.equal(options[1].amount, 34.3);
  assert.equal(options[2].id, "pickup");
  assert.equal(options[2].amount, 0);
});

test("`buildRuleBasedShippingOptions()` libera frete grátis quando atinge o mínimo", () => {
  const options = buildRuleBasedShippingOptions({
    zipcode: "01310930",
    subtotal: 250,
    itemsCount: 1,
  });

  assert.equal(options[0].id, "standard");
  assert.equal(options[0].service, "Frete grátis");
  assert.equal(options[0].amount, 0);
  assert.equal(options[0].isFree, true);
  assert.equal(options[0].missingForFree, 0);
});