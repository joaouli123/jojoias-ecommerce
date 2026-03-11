import { Prisma } from "@prisma/client";

export type AuditLogFilters = {
  actor?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
};

function normalizeDate(value?: string, endOfDay = false) {
  if (!value) return undefined;

  const normalized = new Date(`${value}${endOfDay ? "T23:59:59.999" : "T00:00:00.000"}`);
  return Number.isNaN(normalized.getTime()) ? undefined : normalized;
}

export function buildAuditLogWhere(filters: AuditLogFilters): Prisma.AdminAuditLogWhereInput {
  const actor = filters.actor?.trim();
  const action = filters.action?.trim();
  const entityType = filters.entityType?.trim();
  const from = normalizeDate(filters.from);
  const to = normalizeDate(filters.to, true);

  return {
    ...(actor
      ? {
        OR: [
          { actorName: { contains: actor } },
          { actorEmail: { contains: actor } },
        ],
      }
      : {}),
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(from || to
      ? {
        createdAt: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
      }
      : {}),
  };
}

export function formatAuditMetadata(metadata: string | null) {
  if (!metadata) return "—";

  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>;
    const preview = Object.entries(parsed)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" • ");

    return preview || "—";
  } catch {
    return metadata;
  }
}

export function escapeCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);
  if (!/[";,\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}