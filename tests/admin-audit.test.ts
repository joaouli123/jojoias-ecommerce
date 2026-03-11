import assert from "node:assert/strict";
import test from "node:test";
import { buildAuditLogWhere, escapeCsvValue, formatAuditMetadata } from "@/lib/admin-audit";

test("`buildAuditLogWhere()` monta filtros compostos de auditoria", () => {
  const where = buildAuditLogWhere({
    actor: "joao",
    action: "product.update",
    entityType: "product",
    from: "2026-03-01",
    to: "2026-03-06",
  });

  assert.deepEqual(where.action, "product.update");
  assert.deepEqual(where.entityType, "product");
  assert.ok(Array.isArray(where.OR));
  assert.equal(where.OR?.length, 2);
  assert.equal(where.createdAt?.gte?.getFullYear(), 2026);
  assert.equal(where.createdAt?.gte?.getMonth(), 2);
  assert.equal(where.createdAt?.gte?.getDate(), 1);
  assert.equal(where.createdAt?.gte?.getHours(), 0);
  assert.equal(where.createdAt?.lte?.getFullYear(), 2026);
  assert.equal(where.createdAt?.lte?.getMonth(), 2);
  assert.equal(where.createdAt?.lte?.getDate(), 6);
  assert.equal(where.createdAt?.lte?.getHours(), 23);
});

test("`formatAuditMetadata()` resume JSON e preserva texto bruto inválido", () => {
  assert.equal(
    formatAuditMetadata(JSON.stringify({ slug: "anel-prata", status: "ACTIVE", quantity: 8, extra: true })),
    "slug: anel-prata • status: ACTIVE • quantity: 8",
  );

  assert.equal(formatAuditMetadata("texto solto"), "texto solto");
  assert.equal(formatAuditMetadata(null), "—");
});

test("`escapeCsvValue()` protege separadores e aspas", () => {
  assert.equal(escapeCsvValue("simples"), "simples");
  assert.equal(escapeCsvValue("valor;com;separador"), '"valor;com;separador"');
  assert.equal(escapeCsvValue('valor "com" aspas'), '"valor ""com"" aspas"');
});