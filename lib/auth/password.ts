import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

// Hashes a plain password using scrypt with a unique random salt
// and constant-time parameters recommended by OWASP.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString("hex")}`;
}

// Verifies a plain password against the stored scrypt hash format
// using timingSafeEqual to prevent side-channel timing attacks.
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const [, , , , salt, hashHex] = parts;
  const originalKey = Buffer.from(hashHex, "hex");
  const derivedKey = (await scryptAsync(password, salt, originalKey.length)) as Buffer;

  if (originalKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(originalKey, derivedKey);
}
