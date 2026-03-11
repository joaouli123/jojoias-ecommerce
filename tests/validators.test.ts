import assert from "node:assert/strict";
import test from "node:test";
import { checkoutSubmissionSchema, couponValidationSchema, shippingCalculationSchema } from "@/lib/validators";

test("`checkoutSubmissionSchema` aceita payload válido do checkout", () => {
  const parsed = checkoutSubmissionSchema.safeParse({
    checkoutToken: "550e8400-e29b-41d4-a716-446655440000",
    name: "João Cliente",
    email: "joao@example.com",
    document: "12345678901",
    phone: "81999999999",
    zipcode: "01310930",
    street: "Av. Paulista",
    number: "1000",
    district: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    complement: "Sala 10",
    shippingOptionId: "express",
    paymentMethod: "PIX",
    couponCode: "BEMVINDO10",
    notes: "Entregar em horário comercial",
  });

  assert.equal(parsed.success, true);
});

test("`checkoutSubmissionSchema` rejeita token inválido e estado fora do padrão", () => {
  const parsed = checkoutSubmissionSchema.safeParse({
    checkoutToken: "invalido",
    name: "João Cliente",
    email: "joao@example.com",
    zipcode: "01310930",
    street: "Av. Paulista",
    number: "1000",
    district: "Bela Vista",
    city: "São Paulo",
    state: "SPO",
    shippingOptionId: "standard",
    paymentMethod: "PIX",
  });

  assert.equal(parsed.success, false);
});

test("`shippingCalculationSchema` e `couponValidationSchema` validam payloads básicos", () => {
  assert.equal(
    shippingCalculationSchema.safeParse({ zipcode: "01310930", subtotal: 150, itemsCount: 2 }).success,
    true,
  );

  assert.equal(
    couponValidationSchema.safeParse({ code: "BEMVINDO10", subtotal: 150 }).success,
    true,
  );

  assert.equal(
    shippingCalculationSchema.safeParse({ zipcode: "123", subtotal: -1, itemsCount: 0 }).success,
    false,
  );
});