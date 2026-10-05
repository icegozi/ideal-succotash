import "server-only";

import { isOracleConfigured } from "@/lib/db/oracle";
import { InMemoryUserRepository } from "@/modules/auth/repositories/in-memory-user.repository";
import { OracleUserRepository } from "@/modules/auth/repositories/oracle-user.repository";
import type {
  CreateSessionData,
  CreateUserData,
  UserRepository,
} from "@/modules/auth/repositories/user.repository";
import type { Session, User } from "@/modules/auth/types/auth.types";

let inMemoryInstance: InMemoryUserRepository | undefined;

function getInMemoryRepo(): InMemoryUserRepository {
  inMemoryInstance ??= new InMemoryUserRepository();
  return inMemoryInstance;
}

// Resilient repository that uses Oracle when connected and falls back
// to InMemoryUserRepository when developing locally without an active Oracle instance.
export class HybridUserRepository implements UserRepository {
  private oracleRepo = new OracleUserRepository();
  private useInMemory = false;

  private async executeWithFallback<T>(
    operation: (repo: UserRepository) => Promise<T>,
  ): Promise<T> {
    if (this.useInMemory || process.env.DEMO_MODE === "true" || !isOracleConfigured()) {
      return operation(getInMemoryRepo());
    }

    try {
      return await operation(this.oracleRepo);
    } catch (error) {
      // Fall back to in-memory store if Oracle container is not running locally
      this.useInMemory = true;
      return operation(getInMemoryRepo());
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.executeWithFallback((r) => r.findByEmail(email));
  }

  async findById(id: number): Promise<User | null> {
    return this.executeWithFallback((r) => r.findById(id));
  }

  async create(data: CreateUserData): Promise<User> {
    return this.executeWithFallback((r) => r.create(data));
  }

  async createSession(data: CreateSessionData): Promise<Session> {
    return this.executeWithFallback((r) => r.createSession(data));
  }

  async findSession(sessionId: string): Promise<{ session: Session; user: User } | null> {
    return this.executeWithFallback((r) => r.findSession(sessionId));
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.executeWithFallback((r) => r.deleteSession(sessionId));
  }

  async deleteUserSessions(userId: number): Promise<void> {
    return this.executeWithFallback((r) => r.deleteUserSessions(userId));
  }
}

let repositoryInstance: UserRepository | undefined;

export function getUserRepository(): UserRepository {
  repositoryInstance ??= new HybridUserRepository();
  return repositoryInstance;
}

export function resetDemoUserRepository(): void {
  inMemoryInstance = new InMemoryUserRepository();
  repositoryInstance = new HybridUserRepository();
}
