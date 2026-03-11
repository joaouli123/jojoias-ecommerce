import assert from "node:assert/strict";
import test from "node:test";
import type { Coupon } from "@prisma/client";
import { calculateCouponDiscount, normalizeCouponCode, parseCouponScopeSlugs, validateCouponEntity } from "@/lib/coupons";

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: "coupon_1",
    code: "BEMVINDO10",
    name: "Boas-vindas",
    description: "Cupom inicial",
    type: "PERCENTAGE",
    value: 10,
    minSubtotal: null,
    maxDiscount: null,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    usageLimit: null,
    usageCount: 0,
    appliesToBrandSlugs: null,
    appliesToCategorySlugs: null,
    firstOrderOnly: false,
    allowWithPixDiscount: true,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
    ...overrides,
  };
}

test("`parseCouponScopeSlugs()` normaliza listas com separadores diferentes", () => {
  assert.deepEqual(parseCouponScopeSlugs(" propria, aneis; luxo\npropria "), ["propria", "aneis", "luxo"]);
});

test("`normalizeCouponCode()` remove espaços e normaliza para maiúsculas", () => {
  assert.equal(normalizeCouponCode("  boasvindas10 "), "BOASVINDAS10");
});

test("`calculateCouponDiscount()` respeita percentual, limite máximo e subtotal", () => {
  const percentageCoupon = makeCoupon({ type: "PERCENTAGE", value: 15, maxDiscount: 30 });
  const fixedCoupon = makeCoupon({ type: "FIXED", value: 80 });

  assert.equal(calculateCouponDiscount(percentageCoupon, 400), 30);
  assert.equal(calculateCouponDiscount(fixedCoupon, 50), 50);
});

test("`validateCouponEntity()` aprova cupom válido e calcula desconto aplicado", () => {
  const coupon = makeCoupon({ type: "PERCENTAGE", value: 20, minSubtotal: 100 });
  const result = validateCouponEntity(coupon, 150, {}, new Date("2026-03-06T12:00:00.000Z"));

  assert.equal(result.isValid, true);
  if (result.isValid) {
    assert.equal(result.coupon.code, "BEMVINDO10");
    assert.equal(result.coupon.discount, 30);
    assert.equal(result.coupon.allowWithPixDiscount, true);
  }
});

test("`validateCouponEntity()` bloqueia cenários inválidos mais importantes", () => {
  const inactive = validateCouponEntity(makeCoupon({ isActive: false }), 150);
  const scheduled = validateCouponEntity(makeCoupon({ startsAt: new Date("2026-03-10T00:00:00.000Z") }), 150, {}, new Date("2026-03-06T12:00:00.000Z"));
  const limitReached = validateCouponEntity(makeCoupon({ usageLimit: 10, usageCount: 10 }), 150);
  const belowMinimum = validateCouponEntity(makeCoupon({ minSubtotal: 300 }), 150);

  assert.equal(inactive.isValid, false);
  assert.equal(scheduled.isValid, false);
  assert.equal(limitReached.isValid, false);
  assert.equal(belowMinimum.isValid, false);
});

test("`validateCouponEntity()` aplica escopo por marca, categoria e primeira compra", () => {
  const scopedCoupon = makeCoupon({
    appliesToBrandSlugs: "marca-propria",
    appliesToCategorySlugs: "aneis",
    firstOrderOnly: true,
    allowWithPixDiscount: false,
  });

  const invalidByScope = validateCouponEntity(scopedCoupon, 200, {
    brandSlugs: ["outra-marca"],
    categorySlugs: ["colares"],
    customerOrderCount: 0,
  });
  const invalidByHistory = validateCouponEntity(scopedCoupon, 200, {
    brandSlugs: ["marca-propria"],
    categorySlugs: ["aneis"],
    customerOrderCount: 2,
  });
  const valid = validateCouponEntity(scopedCoupon, 200, {
    brandSlugs: ["marca-propria"],
    categorySlugs: ["aneis"],
    customerOrderCount: 0,
  });

  assert.equal(invalidByScope.isValid, false);
  assert.equal(invalidByHistory.isValid, false);
  assert.equal(valid.isValid, true);
  if (valid.isValid) {
    assert.equal(valid.coupon.allowWithPixDiscount, false);
  }
});