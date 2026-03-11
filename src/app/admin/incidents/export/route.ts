import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { buildSystemEventWhere, escapeSystemEventCsv, formatSystemEventPayload } from "@/lib/system-events";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasAdminPermission(session.user.role, "reports:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const where = buildSystemEventWhere({
    level: searchParams.get("level") || undefined,
    source: searchParams.get("source") || undefined,
    status: searchParams.get("status") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  const incidents = await prisma.systemEventLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = ["id", "created_at", "level", "source", "event_code", "message", "status", "alert_sent_at", "alert_error", "resolved_at", "payload"];
  const rows = incidents.map((incident) => [
    incident.id,
    incident.createdAt.toISOString(),
    incident.level,
    incident.source,
    incident.eventCode,
    incident.message,
    incident.status,
    incident.alertSentAt?.toISOString() || "",
    incident.alertError || "",
    incident.resolvedAt?.toISOString() || "",
    formatSystemEventPayload(incident.payload),
  ].map(escapeSystemEventCsv).join(";"));

  const csv = `\uFEFF${header.join(";")}\n${rows.join("\n")}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="incidentes-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}