/**
 * Signup/login request validation. Deliberately permissive on the
 * password ("they can set any username and password") — just a minimum
 * length, no forced complexity rules.
 */
import { z } from "zod";

export const CredentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, - and _"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
