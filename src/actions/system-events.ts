"use server";

import { auth } from "@/auth";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function checkReportsManage() {
  const session = await auth();

  if (!session || !hasAdminPermission(session.user.role, "reports:manage")) {
    throw new Error("Unauthorized");
  }
}

export async function resolveSystemEvent(formData: FormData) {
  await checkReportsManage();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Incidente inválido.");
  }

  await prisma.systemEventLog.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });

  revalidatePath("/admin/incidents");
  revalidatePath("/admin/reports");
}

export async function reopenSystemEvent(formData: FormData) {
  await checkReportsManage();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Incidente inválido.");
  }

  await prisma.systemEventLog.update({
    where: { id },
    data: {
      status: "OPEN",
      resolvedAt: null,
    },
  });

  revalidatePath("/admin/incidents");
  revalidatePath("/admin/reports");
}