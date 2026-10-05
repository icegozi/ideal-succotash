export type UserRole = "ADMIN" | "PHARMACIST" | "WAREHOUSE_STAFF" | "VIEWER";

export const DEFAULT_SESSION_HOURS = 24;
export const REMEMBER_SESSION_DAYS = 30;
export const SESSION_COOKIE_NAME = "medstock_session";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SanitizedUser = Omit<User, "passwordHash">;

export interface Session {
  id: string;
  userId: number;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface SessionWithUser {
  session: Session;
  user: SanitizedUser;
}

export interface AuthActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
}
