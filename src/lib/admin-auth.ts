import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasAdminPermission, type AdminPermission } from "@/lib/admin-permissions";

export type AuthenticatedAdminUser = NonNullable<Session["user"]> & {
  id: string;
  role?: string | null;
};

export async function getAdminUserIfAllowed(permission: AdminPermission): Promise<AuthenticatedAdminUser | null> {
  const session = await auth();

  if (!session || !hasAdminPermission(session.user.role, permission)) {
    return null;
  }

  return session.user;
}

export async function requireAdminPermission(permission: AdminPermission): Promise<AuthenticatedAdminUser> {
  const user = await getAdminUserIfAllowed(permission);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireAdminPagePermission(permission: AdminPermission) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!hasAdminPermission(session.user.role, permission)) {
    redirect("/admin");
  }

  return session.user as AuthenticatedAdminUser;
}

export function unauthorizedJson(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}