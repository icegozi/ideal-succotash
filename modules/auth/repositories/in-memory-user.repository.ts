import type { Session, User } from "@/modules/auth/types/auth.types";
import type {
  CreateSessionData,
  CreateUserData,
  UserRepository,
} from "@/modules/auth/repositories/user.repository";

// Pre-computed scrypt hashes for instant synchronous seeding in tests and demo mode
const DEMO_DUOCSI_HASH =
  "scrypt$16384$8$1$2c23d84ab856054bf2a4bc11b7bed4cc$260f07c02d5a089690398c7b274676ade4a76594f566cff03d5f8ab6696e85d5926de3fbf6cbcc5b7f5106f6a1454215cf321f89b340c670899143b70ede9292";

const DEMO_ADMIN_HASH =
  "scrypt$16384$8$1$a2c3507ed375be704be3368241e59db7$93922a550ebd02980e426af1ca88ce0e04b0533a0b9594d9da788c916fcb2abe0fc7307cec1356d8fcb6f525f99923b0515ec72973e0b58b6b6099060a8aab7e";

export class InMemoryUserRepository implements UserRepository {
  private users: Map<number, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private nextUserId = 1;

  constructor() {
    this.seedDefaultUsers();
  }

  private seedDefaultUsers(): void {
    this.users.set(1, {
      id: 1,
      name: "Dược sĩ phát triển",
      email: "duocsi@medstock.local",
      passwordHash: DEMO_DUOCSI_HASH,
      role: "PHARMACIST",
      department: "Kho Chẵn / Nội trú",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.users.set(2, {
      id: 2,
      name: "Quản trị viên",
      email: "admin@medstock.local",
      passwordHash: DEMO_ADMIN_HASH,
      role: "ADMIN",
      department: "Khoa Dược",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.nextUserId = 3;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  async findById(id: number): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const id = this.nextUserId++;
    const now = new Date();
    const newUser: User = {
      id,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role ?? "PHARMACIST",
      department: data.department ?? null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, newUser);
    return { ...newUser };
  }

  async createSession(data: CreateSessionData): Promise<Session> {
    const session: Session = {
      id: data.id,
      userId: data.userId,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
    };

    this.sessions.set(data.id, session);
    return { ...session };
  }

  async findSession(sessionId: string): Promise<{ session: Session; user: User } | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.expiresAt.getTime() < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    const user = this.users.get(session.userId);
    if (!user || !user.active) {
      this.sessions.delete(sessionId);
      return null;
    }

    return { session: { ...session }, user: { ...user } };
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async deleteUserSessions(userId: number): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(id);
      }
    }
  }

  // Helper for testing
  reset(): void {
    this.users.clear();
    this.sessions.clear();
    this.seedDefaultUsers();
  }
}
