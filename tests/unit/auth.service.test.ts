import { beforeEach, describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { LoginRateLimiter } from "@/lib/auth/rate-limiter";
import { InMemoryUserRepository } from "@/modules/auth/repositories/in-memory-user.repository";
import { registerSchema } from "@/modules/auth/schemas/auth.schema";
import { AuthService } from "@/modules/auth/services/auth.service";

describe("AuthService & Security", () => {
  let userRepo: InMemoryUserRepository;
  let rateLimiter: LoginRateLimiter;
  let authService: AuthService;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    rateLimiter = new LoginRateLimiter(5, 60 * 1000, 60 * 1000);
    authService = new AuthService(userRepo, rateLimiter);
  });

  describe("Password Hashing & Verification", () => {
    it("hashes password with scrypt and random salt without storing plaintext", async () => {
      const raw = "SecurePass123";
      const hash1 = await hashPassword(raw);
      const hash2 = await hashPassword(raw);

      expect(hash1).not.toBe(raw);
      expect(hash1).toMatch(/^scrypt\$16384\$8\$1\$/);
      // Different salts produce different hashes for the same password
      expect(hash1).not.toBe(hash2);

      const isValid1 = await verifyPassword(raw, hash1);
      const isValid2 = await verifyPassword(raw, hash2);
      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });

    it("rejects incorrect passwords", async () => {
      const hash = await hashPassword("RightPassword1");
      const isMatch = await verifyPassword("WrongPassword2", hash);
      expect(isMatch).toBe(false);
    });
  });

  describe("User Registration", () => {
    it("registers a new user and creates an active session", async () => {
      const input = {
        name: "Dược sĩ Trần B",
        email: "tranb@medstock.local",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = await authService.register(input);

      expect(result.user.name).toBe("Dược sĩ Trần B");
      expect(result.user.email).toBe("tranb@medstock.local");
      expect(result.user.role).toBe("PHARMACIST");
      expect((result.user as Record<string, unknown>).passwordHash).toBeUndefined();
      expect(result.sessionId).toBeDefined();
      expect(result.sessionId.length).toBe(64); // 32 bytes hex

      const session = await authService.validateSession(result.sessionId);
      expect(session?.email).toBe("tranb@medstock.local");
    });

    it("rejects duplicate email registration (case-insensitive)", async () => {
      await authService.register({
        name: "User 1",
        email: "test@medstock.local",
        password: "Password123",
        confirmPassword: "Password123",
      });

      await expect(
        authService.register({
          name: "User 2",
          email: "TEST@medstock.local",
          password: "Password123",
          confirmPassword: "Password123",
        }),
      ).rejects.toThrow("Email này đã được sử dụng trong hệ thống.");
    });

    it("validates register schema constraints", () => {
      // Short password
      const shortPass = registerSchema.safeParse({
        name: "Test",
        email: "valid@email.com",
        password: "short",
        confirmPassword: "short",
      });
      expect(shortPass.success).toBe(false);

      // Mismatched passwords
      const mismatch = registerSchema.safeParse({
        name: "Test",
        email: "valid@email.com",
        password: "ValidPassword1",
        confirmPassword: "DifferentPassword2",
      });
      expect(mismatch.success).toBe(false);

      // Invalid email
      const badEmail = registerSchema.safeParse({
        name: "Test",
        email: "not-an-email",
        password: "ValidPassword1",
        confirmPassword: "ValidPassword1",
      });
      expect(badEmail.success).toBe(false);
    });
  });

  describe("User Login", () => {
    beforeEach(async () => {
      // Seed a test user
      const passwordHash = await hashPassword("ValidPass123");
      await userRepo.create({
        name: "Nguyễn Văn Test",
        email: "testlogin@medstock.local",
        passwordHash,
        role: "PHARMACIST",
      });
    });

    it("authenticates successfully with valid credentials and rememberMe", async () => {
      const result = await authService.login({
        email: "testlogin@medstock.local",
        password: "ValidPass123",
        rememberMe: true,
      });

      expect(result.user.email).toBe("testlogin@medstock.local");
      expect(result.sessionId).toBeDefined();

      const validated = await authService.validateSession(result.sessionId);
      expect(validated?.name).toBe("Nguyễn Văn Test");
    });

    it("normalizes email to lowercase during login", async () => {
      const result = await authService.login({
        email: "TESTLOGIN@MEDSTOCK.LOCAL",
        password: "ValidPass123",
      });

      expect(result.user.email).toBe("testlogin@medstock.local");
    });

    it("fails with generic error on incorrect password and does not leak password info", async () => {
      await expect(
        authService.login({
          email: "testlogin@medstock.local",
          password: "WrongPassword999",
        }),
      ).rejects.toThrow("Email hoặc mật khẩu không chính xác.");
    });

    it("fails with generic error on non-existent email and does not leak existence", async () => {
      await expect(
        authService.login({
          email: "nonexistent@medstock.local",
          password: "AnyPassword123",
        }),
      ).rejects.toThrow("Email hoặc mật khẩu không chính xác.");
    });

    it("prevents session fixation by issuing fresh session tokens on each login", async () => {
      const login1 = await authService.login({
        email: "testlogin@medstock.local",
        password: "ValidPass123",
      });

      const login2 = await authService.login({
        email: "testlogin@medstock.local",
        password: "ValidPass123",
      });

      expect(login1.sessionId).not.toBe(login2.sessionId);
    });

    it("enforces brute-force rate limiting after 5 consecutive failed attempts", async () => {
      const email = "testlogin@medstock.local";

      // First 4 failed attempts report invalid credentials
      for (let i = 0; i < 4; i++) {
        await expect(
          authService.login({ email, password: `Wrong${i}` }),
        ).rejects.toThrow("Email hoặc mật khẩu không chính xác.");
      }

      // 5th failed attempt triggers rate limit lockout
      await expect(
        authService.login({ email, password: "Wrong4" }),
      ).rejects.toThrow("Quá nhiều lần thử đăng nhập không thành công.");

      // Subsequent attempt is blocked by rate limiter even with the correct password
      await expect(
        authService.login({ email, password: "ValidPass123" }),
      ).rejects.toThrow("Quá nhiều lần thử đăng nhập không thành công.");
    });
  });

  describe("Session Management & Logout", () => {
    it("invalidates session on logout", async () => {
      const { sessionId } = await authService.register({
        name: "Logout Test",
        email: "logout@medstock.local",
        password: "Password123",
        confirmPassword: "Password123",
      });

      expect(await authService.validateSession(sessionId)).not.toBeNull();

      await authService.logout(sessionId);

      expect(await authService.validateSession(sessionId)).toBeNull();
    });

    it("rejects expired sessions", async () => {
      const { user } = await authService.register({
        name: "Expiry Test",
        email: "expiry@medstock.local",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Create an already-expired session directly
      const expiredSessionId = "expired-token-123";
      await userRepo.createSession({
        id: expiredSessionId,
        userId: user.id,
        expiresAt: new Date(Date.now() - 1000), // 1 second in the past
      });

      const validated = await authService.validateSession(expiredSessionId);
      expect(validated).toBeNull();
    });
  });
});
