import type { UserRole } from "@prisma/client";

export const STAFF_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "SUPPORT"];

export type AdminPermission =
  | "dashboard:view"
  | "products:manage"
  | "orders:view"
  | "orders:manage"
  | "customers:view"
  | "catalog:manage"
  | "marketing:manage"
  | "reports:view"
  | "reports:manage"
  | "settings:manage";

const PERMISSION_MATRIX: Record<AdminPermission, UserRole[]> = {
  "dashboard:view": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "SUPPORT"],
  "products:manage": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR"],
  "orders:view": ["SUPER_ADMIN", "ADMIN", "MANAGER", "SUPPORT"],
  "orders:manage": ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  "customers:view": ["SUPER_ADMIN", "ADMIN", "MANAGER", "SUPPORT"],
  "catalog:manage": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR"],
  "marketing:manage": ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR"],
  "reports:view": ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  "reports:manage": ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  "settings:manage": ["SUPER_ADMIN", "ADMIN"],
};

export function isStaffRole(role?: string | null): role is UserRole {
  return Boolean(role && STAFF_ROLES.includes(role as UserRole));
}

export function hasAdminPermission(role: string | null | undefined, permission: AdminPermission) {
  if (!role) return false;
  return PERMISSION_MATRIX[permission].includes(role as UserRole);
}