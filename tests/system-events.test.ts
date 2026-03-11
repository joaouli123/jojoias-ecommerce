import assert from "node:assert/strict";
import test from "node:test";
import { buildSystemEventWhere, formatSystemEventPayload } from "@/lib/system-events";

test("`buildSystemEventWhere()` monta filtros por período e status", () => {
  const where = buildSystemEventWhere({
    level: "ERROR",
    source: "shipping",
    status: "OPEN",
    from: "2026-03-01",
    to: "2026-03-06",
  });

  assert.equal(where.level, "ERROR");
  assert.equal(where.source, "shipping");
  assert.equal(where.status, "OPEN");
  assert.equal(where.createdAt?.gte?.getDate(), 1);
  assert.equal(where.createdAt?.lte?.getDate(), 6);
});

test("`formatSystemEventPayload()` resume JSON e preserva texto livre", () => {
  assert.equal(
    formatSystemEventPayload(JSON.stringify({ zipcode: "01310930", subtotal: 150, itemsCount: 2, region: "Sudeste", extra: true })),
    "zipcode: 01310930 • subtotal: 150 • itemsCount: 2 • region: Sudeste",
  );

  assert.equal(formatSystemEventPayload("texto puro"), "texto puro");
  assert.equal(formatSystemEventPayload(null), "—");
});