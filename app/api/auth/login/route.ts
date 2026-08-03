/**
 * POST /api/auth/login — verifies username + password, sets the session
 * cookie. Same generic error for "no such user" and "wrong password" so
 * the response can't be used to enumerate registered usernames.
 */
import { NextRequest, NextResponse } from "next/server";
import { CredentialsSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const admin = getSupabaseAdmin();

  const { data: user } = await admin
    .from("users")
    .select("id, username, password_hash, created_at")
    .eq("username", username)
    .maybeSingle();

  const genericError = NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
  if (!user) return genericError;

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return genericError;

  await setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username, createdAt: user.created_at } });
}
