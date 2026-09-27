import "server-only";

import { AppError } from "@/lib/errors/app-error";

export const permissions = {
  medicineRead: "medicine.read",
  medicineCreate: "medicine.create",
  medicineUpdate: "medicine.update",
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

export type Actor = {
  name: string;
  permissions: ReadonlySet<Permission>;
};

const allMedicinePermissions = new Set<Permission>(Object.values(permissions));

export async function getCurrentActor(): Promise<Actor> {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS !== "false") {
    return {
      name: process.env.DEV_OPERATOR_NAME?.trim() || "Dược sĩ phát triển",
      permissions: allMedicinePermissions,
    };
  }

  throw new AppError(
    "UNAUTHORIZED",
    "Chưa cấu hình nhà cung cấp danh tính tin cậy cho môi trường production.",
  );
}

export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await getCurrentActor();

  if (!actor.permissions.has(permission)) {
    throw new AppError("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.");
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
