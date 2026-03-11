import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { buildAuditLogWhere, escapeCsvValue, formatAuditMetadata } from "@/lib/admin-audit";
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
  const where = buildAuditLogWhere({
    actor: searchParams.get("actor") || undefined,
    action: searchParams.get("action") || undefined,
    entityType: searchParams.get("entityType") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  const logs = await prisma.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = ["id", "created_at", "actor_name", "actor_email", "actor_role", "action", "entity_type", "entity_id", "summary", "metadata"];
  const rows = logs.map((log) => [
    log.id,
    log.createdAt.toISOString(),
    log.actorName,
    log.actorEmail || "",
    log.actorRole || "",
    log.action,
    log.entityType,
    log.entityId || "",
    log.summary,
    formatAuditMetadata(log.metadata),
  ].map(escapeCsvValue).join(";"));

  const csv = `\uFEFF${header.join(";")}\n${rows.join("\n")}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auditoria-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}