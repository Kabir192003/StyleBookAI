/**
 * Password hashing — bcrypt via bcryptjs (pure JS, no native build step,
 * safe for serverless). Never store or log a plaintext password anywhere
 * outside this file's inputs.
 */
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
