import type { Session, User, UserRole } from "@/modules/auth/types/auth.types";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  department?: string | null;
}

export interface CreateSessionData {
  id: string;
  userId: number;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  createSession(data: CreateSessionData): Promise<Session>;
  findSession(sessionId: string): Promise<{ session: Session; user: User } | null>;
  deleteSession(sessionId: string): Promise<void>;
  deleteUserSessions(userId: number): Promise<void>;
}
