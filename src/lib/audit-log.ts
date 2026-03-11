import { prisma } from "@/lib/prisma";

type AuditActor = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type AuditPayload = {
  actor: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function logAdminAudit(payload: AuditPayload) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorUserId: payload.actor.id || null,
        actorName: payload.actor.name || payload.actor.email || "Operador",
        actorEmail: payload.actor.email || null,
        actorRole: payload.actor.role || null,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId || null,
        summary: payload.summary,
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to write admin audit log", error);
  }
}