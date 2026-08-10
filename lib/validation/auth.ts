/**
 * Signup/login request validation. Deliberately permissive — any
 * non-empty username and password is accepted, no minimum length, no
 * character-set restriction, no forced complexity rules. This same
 * schema backs both signup and login, so it must never reject a
 * password/username that was valid to *create* an account — the only
 * real requirement at either point is "typed something".
 */
import { z } from "zod";

export const CredentialsSchema = z.object({
  username: z.string().trim().min(1, "Enter a username"),
  password: z.string().min(1, "Enter a password"),
});
