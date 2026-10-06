import "server-only";

import { getSessionCookie } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { AUTH_MESSAGES } from "@/constants/messages";
import { getAuthService } from "@/modules/auth/services";
import type { SanitizedUser, UserRole } from "@/modules/auth/types/auth.types";

export const permissions = {
  medicineRead: "medicine.read",
  medicineCreate: "medicine.create",
  medicineUpdate: "medicine.update",
  inventoryRead: "inventory.read",
  stockInRead: "stock_in.read",
  stockInCreate: "stock_in.create",
  stockInConfirm: "stock_in.confirm",
  stockInCancel: "stock_in.cancel",
  stockOutRead: "stock_out.read",
  stockOutCreate: "stock_out.create",
  stockOutConfirm: "stock_out.confirm",
  stockOutCancel: "stock_out.cancel",
  fefoOverride: "inventory.fefo.override",
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

export type Actor = {
  id?: number;
  name: string;
  email?: string;
  role?: string;
  department?: string | null;
  permissions: ReadonlySet<Permission>;
};

const allDefaultPermissions = new Set<Permission>(Object.values(permissions));

function getPermissionsForRole(role: UserRole): ReadonlySet<Permission> {
  if (role === "ADMIN" || role === "PHARMACIST") {
    return allDefaultPermissions;
  }

  if (role === "WAREHOUSE_STAFF") {
    return new Set<Permission>([
      permissions.medicineRead,
      permissions.inventoryRead,
      permissions.stockInRead,
      permissions.stockInCreate,
      permissions.stockOutRead,
      permissions.stockOutCreate,
    ]);
  }

  // VIEWER role has read-only access
  return new Set<Permission>([
    permissions.medicineRead,
    permissions.inventoryRead,
    permissions.stockInRead,
    permissions.stockOutRead,
  ]);
}

// Retrieves the authenticated user from the active session cookie if present.
export async function getCurrentUser(): Promise<SanitizedUser | null> {
  try {
    const sessionId = await getSessionCookie();
    if (!sessionId) return null;
    return await getAuthService().validateSession(sessionId);
  } catch {
    return null;
  }
}

// Resolves the current actor with role-based permissions from the validated session.
// Falls back to DEV_AUTH_BYPASS only in non-production when no session is present.
export async function getCurrentActor(): Promise<Actor> {
  const user = await getCurrentUser();
  if (user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: getPermissionsForRole(user.role),
    };
  }

  if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS !== "false") {
    return {
      name: process.env.DEV_OPERATOR_NAME?.trim() || "Dược sĩ phát triển",
      permissions: allDefaultPermissions,
    };
  }

  throw new AppError(
    "UNAUTHORIZED",
    AUTH_MESSAGES.SESSION.EXPIRED,
  );
}

export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await getCurrentActor();

  if (!actor.permissions.has(permission)) {
    throw new AppError("FORBIDDEN", AUTH_MESSAGES.PERMISSION.DENIED);
  }

  return actor;
}

export async function can(permission: Permission): Promise<boolean> {
  try {
    const actor = await getCurrentActor();
    return actor.permissions.has(permission);
  } catch {
    return false;
  }
}
