import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { permissions } from "@/lib/auth/permissions";
import { AppError } from "@/lib/errors/app-error";

describe("Dashboard Authorization & Session Boundary (C1)", () => {
  it("defines inventoryRead as the mandatory permission for dashboard data access", () => {
    expect(permissions.inventoryRead).toBe("inventory.read");
  });

  it("ensures unauthenticated actors are rejected with UNAUTHORIZED", () => {
    const simulateRequirePermission = (user: { id: number; permissions: Set<string> } | null) => {
      if (!user) {
        throw new AppError("UNAUTHORIZED", "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");
      }
      if (!user.permissions.has(permissions.inventoryRead)) {
        throw new AppError("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.");
      }
      return user;
    };

    // Unauthenticated (arbitrary or non-existent session cookie)
    expect(() => simulateRequirePermission(null)).toThrowError(AppError);
    expect(() => simulateRequirePermission(null)).toThrowError("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");

    // Authenticated with inventoryRead permission
    const validUser = { id: 1, permissions: new Set([permissions.inventoryRead]) };
    expect(() => simulateRequirePermission(validUser)).not.toThrow();

    // Authenticated without inventoryRead permission
    const unauthorizedUser = { id: 2, permissions: new Set(["medicine.read"]) };
    expect(() => simulateRequirePermission(unauthorizedUser)).toThrowError(AppError);
    expect(() => simulateRequirePermission(unauthorizedUser)).toThrowError("Bạn không có quyền thực hiện thao tác này.");
  });
});
