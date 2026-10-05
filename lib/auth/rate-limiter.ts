// Sliding window rate limiter to mitigate brute-force password guessing.
// Enforces a maximum number of failed attempts within a rolling window.

interface RateLimitRecord {
  timestamps: number[];
  blockedUntil?: number;
}

export class LoginRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(
    maxAttempts = 5,
    windowMs = 60 * 1000,
    blockDurationMs = 60 * 1000,
  ) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
  }

  isRateLimited(key: string): { isBlocked: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record) {
      return { isBlocked: false, retryAfterSeconds: 0 };
    }

    if (record.blockedUntil && record.blockedUntil > now) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return { isBlocked: true, retryAfterSeconds: remainingSeconds };
    }

    // Clean up expired timestamps
    record.timestamps = record.timestamps.filter((ts) => now - ts < this.windowMs);

    if (record.timestamps.length >= this.maxAttempts) {
      record.blockedUntil = now + this.blockDurationMs;
      const retryAfter = Math.ceil(this.blockDurationMs / 1000);
      return { isBlocked: true, retryAfterSeconds: retryAfter };
    }

    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  recordFailure(key: string): { isBlocked: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    record.timestamps.push(now);
    record.timestamps = record.timestamps.filter((ts) => now - ts < this.windowMs);

    if (record.timestamps.length >= this.maxAttempts) {
      record.blockedUntil = now + this.blockDurationMs;
      const retryAfter = Math.ceil(this.blockDurationMs / 1000);
      return { isBlocked: true, retryAfterSeconds: retryAfter };
    }

    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  reset(key: string): void {
    this.records.delete(key);
  }

  clear(): void {
    this.records.clear();
  }
}

export const loginRateLimiter = new LoginRateLimiter();
