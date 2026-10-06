import { randomBytes } from "node:crypto";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { type LoginRateLimiter, loginRateLimiter } from "@/lib/auth/rate-limiter";
import { AppError } from "@/lib/errors/app-error";
import { AUTH_MESSAGES } from "@/constants/messages";
import type { UserRepository } from "@/modules/auth/repositories/user.repository";
import type { LoginInput, RegisterInput } from "@/modules/auth/schemas/auth.schema";
import {
  DEFAULT_SESSION_HOURS,
  REMEMBER_SESSION_DAYS,
  type SanitizedUser,
  type User,
} from "@/modules/auth/types/auth.types";

function sanitizeUser(user: User): SanitizedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly rateLimiter: LoginRateLimiter = loginRateLimiter,
  ) {}

  // Registers a new user account with hashed password and initial pharmacist role.
  async register(
    input: RegisterInput,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ user: SanitizedUser; sessionId: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new AppError("CONFLICT", AUTH_MESSAGES.REGISTER.EMAIL_EXISTS);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.create({
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "PHARMACIST",
      department: "Kho Dược",
    });

    // Create immediate active session upon successful registration
    const sessionId = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + DEFAULT_SESSION_HOURS * 60 * 60 * 1000);

    await this.userRepository.createSession({
      id: sessionId,
      userId: user.id,
      expiresAt,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    return { user: sanitizeUser(user), sessionId };
  }

  // Authenticates user credentials with brute-force protection and session fixation mitigation.
  async login(
    input: LoginInput,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ user: SanitizedUser; sessionId: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check brute-force rate limiter
    const rateCheck = this.rateLimiter.isRateLimited(normalizedEmail);
    if (rateCheck.isBlocked) {
      throw new AppError(
        "UNAUTHORIZED",
        AUTH_MESSAGES.LOGIN.RATE_LIMITED(rateCheck.retryAfterSeconds),
      );
    }

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      this.rateLimiter.recordFailure(normalizedEmail);
      throw new AppError("UNAUTHORIZED", AUTH_MESSAGES.LOGIN.FAILED);
    }

    if (!user.active) {
      throw new AppError("UNAUTHORIZED", AUTH_MESSAGES.LOGIN.LOCKED);
    }

    const isMatch = await verifyPassword(input.password, user.passwordHash);
    if (!isMatch) {
      const failStatus = this.rateLimiter.recordFailure(normalizedEmail);
      if (failStatus.isBlocked) {
        throw new AppError(
          "UNAUTHORIZED",
          AUTH_MESSAGES.LOGIN.RATE_LIMITED(failStatus.retryAfterSeconds),
        );
      }
      throw new AppError("UNAUTHORIZED", AUTH_MESSAGES.LOGIN.FAILED);
    }

    // Reset rate limiter on successful authentication
    this.rateLimiter.reset(normalizedEmail);

    // Prevent session fixation by generating a brand-new cryptographically random session ID
    const sessionId = randomBytes(32).toString("hex");
    const durationDays = input.rememberMe ? REMEMBER_SESSION_DAYS : DEFAULT_SESSION_HOURS / 24;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    await this.userRepository.createSession({
      id: sessionId,
      userId: user.id,
      expiresAt,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    return { user: sanitizeUser(user), sessionId };
  }

  // Invalidates the current session on logout.
  async logout(sessionId: string): Promise<void> {
    await this.userRepository.deleteSession(sessionId);
  }

  // Validates an active session ID and returns the corresponding user profile.
  async validateSession(sessionId: string): Promise<SanitizedUser | null> {
    const result = await this.userRepository.findSession(sessionId);
    if (!result) return null;
    return sanitizeUser(result.user);
  }
}
