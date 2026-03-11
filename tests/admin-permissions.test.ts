import assert from "node:assert/strict";
import test from "node:test";
import { hasAdminPermission, isStaffRole } from "@/lib/admin-permissions";

test("`isStaffRole()` reconhece apenas perfis internos", () => {
  assert.equal(isStaffRole("SUPER_ADMIN"), true);
  assert.equal(isStaffRole("SUPPORT"), true);
  assert.equal(isStaffRole("CUSTOMER"), false);
  assert.equal(isStaffRole(null), false);
});

test("`hasAdminPermission()` respeita a matriz de permissões", () => {
  assert.equal(hasAdminPermission("SUPER_ADMIN", "settings:manage"), true);
  assert.equal(hasAdminPermission("ADMIN", "settings:manage"), true);
  assert.equal(hasAdminPermission("MANAGER", "settings:manage"), false);
  assert.equal(hasAdminPermission("SUPPORT", "orders:view"), true);
  assert.equal(hasAdminPermission("SUPPORT", "orders:manage"), false);
  assert.equal(hasAdminPermission("EDITOR", "marketing:manage"), true);
  assert.equal(hasAdminPermission("CUSTOMER", "dashboard:view"), false);
});