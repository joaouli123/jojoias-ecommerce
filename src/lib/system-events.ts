import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getIntegrationSettings } from "@/lib/integrations";
import { getSiteUrl } from "@/lib/site-url";

type SystemEventPayload = {
  level: "info" | "warning" | "error";
  source: string;
  eventCode: string;
  message: string;
  payload?: Record<string, unknown>;
  status?: "OPEN" | "RESOLVED";
};

function levelRank(level: string) {
  switch (level.toUpperCase()) {
    case "ERROR":
      return 3;
    case "WARNING":
      return 2;
    default:
      return 1;
  }
}

async function sendExternalSystemAlert(eventId: string, event: SystemEventPayload) {
  const alerting = await getIntegrationSettings("alerting");

  if (!alerting?.isEnabled || !alerting.endpointUrl) {
    return;
  }

  const minLevel = typeof alerting.extraConfig.minLevel === "string" ? alerting.extraConfig.minLevel : "ERROR";
  if (levelRank(event.level) < levelRank(minLevel)) {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const payload = {
      siteUrl: getSiteUrl(),
      eventId,
      level: event.level.toUpperCase(),
      source: event.source,
      eventCode: event.eventCode,
      message: event.message,
      status: event.status ?? "OPEN",
      payload: event.payload ?? {},
      occurredAt: new Date().toISOString(),
    };

    const response = await fetch(alerting.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(alerting.secretKey ? { Authorization: `Bearer ${alerting.secretKey}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      await prisma.systemEventLog.update({
        where: { id: eventId },
        data: {
          alertError: text.slice(0, 500),
        },
      });
      return;
    }

    await prisma.systemEventLog.update({
      where: { id: eventId },
      data: {
        alertSentAt: new Date(),
        alertError: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida ao enviar alerta externo.";
    await prisma.systemEventLog.update({
      where: { id: eventId },
      data: {
        alertError: message.slice(0, 500),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function recordSystemEvent(event: SystemEventPayload) {
  try {
    const created = await prisma.systemEventLog.create({
      data: {
        level: event.level.toUpperCase(),
        source: event.source,
        eventCode: event.eventCode,
        message: event.message,
        payload: event.payload ? JSON.stringify(event.payload) : null,
        status: event.status ?? "OPEN",
      },
    });

    await sendExternalSystemAlert(created.id, event);
  } catch (error) {
    console.error("Failed to record system event", error);
  }
}

export type SystemEventFilters = {
  level?: string;
  source?: string;
  status?: string;
  from?: string;
  to?: string;
};

function normalizeDate(value?: string, endOfDay = false) {
  if (!value) return undefined;

  const normalized = new Date(`${value}${endOfDay ? "T23:59:59.999" : "T00:00:00.000"}`);
  return Number.isNaN(normalized.getTime()) ? undefined : normalized;
}

export function buildSystemEventWhere(filters: SystemEventFilters): Prisma.SystemEventLogWhereInput {
  const level = filters.level?.trim();
  const source = filters.source?.trim();
  const status = filters.status?.trim();
  const from = normalizeDate(filters.from);
  const to = normalizeDate(filters.to, true);

  return {
    ...(level ? { level } : {}),
    ...(source ? { source } : {}),
    ...(status ? { status } : {}),
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

export function formatSystemEventPayload(payload: string | null) {
  if (!payload) return "—";

  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return Object.entries(parsed)
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" • ") || "—";
  } catch {
    return payload;
  }
}

export function escapeSystemEventCsv(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);
  if (!/[";,\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}