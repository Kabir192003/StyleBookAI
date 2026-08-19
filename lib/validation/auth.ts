// Signup/login validation. Deliberately permissive: any non-empty
// username/password is accepted — no minimum length, no character-set
// restriction, no complexity rules. This schema backs both signup and login,
// so it must never reject credentials that were valid to create the account;
// the only real requirement is "typed something".
import { z } from "zod";

export const CredentialsSchema = z.object({
  username: z.string().trim().min(1, "Enter a username"),
  password: z.string().min(1, "Enter a password"),
});
