// Same generic error for "no such user" and "wrong password" so the response
// can't be used to enumerate usernames. That guard used to swallow the
// Supabase lookup error too, so a missing table or bad service-role key also
// came back as "Incorrect username or password" — infra failures were
// getting investigated as typos. Infra vs. credential failures are now
// split out (see lib/auth/authFailure.ts); only real credential mismatches
// stay indistinguishable.
import { NextRequest, NextResponse } from "next/server";
import { CredentialsSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { classifyAuthFailure, logAuthFailure } from "@/lib/auth/authFailure";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Couldn't read the sign-in form. Please try again." }, { status: 400 });
  }

  const parsed = CredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 400 });
  }

  const { username, password } = parsed.data;

  try {
    const admin = getSupabaseAdmin();

    const { data: user, error: lookupError } = await admin
      .from("users")
      .select("id, username, password_hash, created_at")
      .eq("username", username)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const genericError = () =>
      NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
    if (!user) return genericError();

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return genericError();

    await setSessionCookie(user.id);
    return NextResponse.json({ user: { id: user.id, username: user.username, createdAt: user.created_at } });
  } catch (cause) {
    const failure = classifyAuthFailure(cause);
    logAuthFailure("login", failure, cause);
    return NextResponse.json({ error: failure.message, code: failure.code }, { status: failure.status });
  }
}
