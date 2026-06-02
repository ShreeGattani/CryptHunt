import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Transparent migration: stored value is bcrypt if it starts with $2
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
    return bcrypt.compare(password, stored);
  }
  // Legacy plaintext comparison (only used during migration window)
  return password === stored;
}

export function isLegacyPlaintext(stored: string): boolean {
  return !stored.startsWith("$2a$") && !stored.startsWith("$2b$");
}
