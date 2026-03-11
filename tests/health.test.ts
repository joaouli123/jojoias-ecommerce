import assert from "node:assert/strict";
import test from "node:test";
import { buildIntegrationChecks, getIncidentHealthState, isConfiguredSecret, resolveHealthStatus } from "@/lib/health";

test("`resolveHealthStatus()` retorna o pior estado entre os checks", () => {
  assert.equal(resolveHealthStatus(["healthy", "healthy"]), "healthy");
  assert.equal(resolveHealthStatus(["healthy", "degraded"]), "degraded");
  assert.equal(resolveHealthStatus(["healthy", "degraded", "down"]), "down");
});

test("`getIncidentHealthState()` escalona o status conforme incidentes abertos", () => {
  assert.equal(getIncidentHealthState(0), "healthy");
  assert.equal(getIncidentHealthState(3), "degraded");
  assert.equal(getIncidentHealthState(12), "down");
});

test("`isConfiguredSecret()` rejeita placeholders conhecidos", () => {
  assert.equal(isConfiguredSecret("troque-por-um-segredo-forte"), false);
  assert.equal(isConfiguredSecret("admin@minhaloja.com"), false);
  assert.equal(isConfiguredSecret("segredo-super-forte-2026"), true);
  assert.equal(isConfiguredSecret(null), false);
});

test("`buildIntegrationChecks()` retorna checks acionáveis para integrações críticas", () => {
  const checks = buildIntegrationChecks([
    {
      provider: "mercado_pago",
      name: "Mercado Pago",
      isEnabled: true,
      publicKey: "app_123",
      secretKey: "segredo-super-forte-2026",
      endpointUrl: null,
      extraConfig: JSON.stringify({ pixDiscountPercent: 8 }),
      webhookSecret: "segredo-super-forte-2026",
    },
    {
      provider: "resend",
      name: "Resend",
      isEnabled: true,
      publicKey: null,
      secretKey: "segredo-super-forte-2026",
      endpointUrl: null,
      extraConfig: JSON.stringify({ fromEmail: "Loja <noreply@loja.test>" }),
      webhookSecret: null,
    },
    {
      provider: "melhor_envio",
      name: "Melhor Envio",
      isEnabled: false,
      publicKey: null,
      secretKey: null,
      endpointUrl: null,
      extraConfig: JSON.stringify({ fallbackToRules: false }),
      webhookSecret: null,
    },
    {
      provider: "alerting",
      name: "Alerting",
      isEnabled: false,
      publicKey: null,
      secretKey: null,
      endpointUrl: null,
      extraConfig: JSON.stringify({ minLevel: "warning" }),
      webhookSecret: null,
    },
  ]);

  const mercadoPagoCheck = checks.find((check) => check.key === "mercado-pago");
  const shippingCheck = checks.find((check) => check.key === "shipping-provider");
  const alertingCheck = checks.find((check) => check.key === "external-alerting");

  assert.equal(mercadoPagoCheck?.status, "healthy");
  assert.equal(mercadoPagoCheck?.details?.pixDiscountPercent, 8);
  assert.equal(checks.some((check) => check.key === "stripe"), false);
  assert.equal(shippingCheck?.status, "down");
  assert.equal(alertingCheck?.status, "degraded");
  assert.equal(alertingCheck?.details?.minLevel, "WARNING");
});