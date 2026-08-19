// No email/verification — deliberately minimal v1 auth (see CLAUDE.md).
// Every non-validation failure gets classified (lib/auth/authFailure.ts)
// instead of a flat "Couldn't create account". Used to log everything the
// same way, so a missing env var, an unapplied migration, and an actually
// taken username all looked identical — which is why "unable to register"
// survived several rounds of fixes aimed at the form itself.
import { NextRequest, NextResponse } from "next/server";
import { CredentialsSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { classifyAuthFailure, logAuthFailure } from "@/lib/auth/authFailure";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Couldn't read the sign-up form. Please try again." }, { status: 400 });
  }

  const parsed = CredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid username or password" },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;

  try {
    const admin = getSupabaseAdmin();

    // Check the lookup error instead of discarding it — an unapplied migration
    // fails with 42P01/PGRST205, and treating that as "no existing user" would
    // just hit the same failure on insert, reported as a mystery 500.
    const { data: existing, error: lookupError } = await admin
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) {
      return NextResponse.json({ error: "That username is taken" }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    const { data: user, error: insertError } = await admin
      .from("users")
      .insert({ username, password_hash })
      .select("id, username, created_at")
      .single();

    // A UNIQUE violation here is a real race (two people claiming the same
    // name at once), not a server fault — report it as a taken username.
    if (insertError?.code === "23505") {
      return NextResponse.json({ error: "That username is taken" }, { status: 409 });
    }
    if (insertError || !user) {
      throw insertError ?? new Error("Insert returned no row");
    }

    // Only place AUTH_SECRET is read — a throw here means the deployment
    // can't sign session cookies.
    await setSessionCookie(user.id);

    return NextResponse.json(
      { user: { id: user.id, username: user.username, createdAt: user.created_at } },
      { status: 201 }
    );
  } catch (cause) {
    const failure = classifyAuthFailure(cause);
    logAuthFailure("signup", failure, cause);
    return NextResponse.json({ error: failure.message, code: failure.code }, { status: failure.status });
  }
}
