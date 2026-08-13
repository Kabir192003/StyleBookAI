/**
 * POST /api/auth/signup — creates a user with a username + password and
 * signs them in (sets the session cookie). No email, no verification —
 * a deliberately minimal v1 auth system (see CLAUDE.md).
 *
 * Every non-validation failure is classified and reported (see
 * lib/auth/authFailure.ts). The previous version returned a flat
 * "Couldn't create account" for anything that went wrong and logged the
 * reason to an untagged console.error, so a missing env var, an unapplied
 * `lib/db/schema.sql` migration, and a genuinely duplicate username were
 * all the same opaque failure to the person hitting the button. That is
 * why "unable to register" survived three rounds of fixes aimed at the
 * form component: nothing in the product ever said what actually broke.
 */
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

    // `error` is checked, not discarded: on a database whose migration was
    // never applied this lookup fails with 42P01/PGRST205, and treating that
    // as "no existing user" would march straight into an insert that fails
    // for the same reason one step later, reported as a mystery 500.
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
    // name at once), not a server fault — report it as the taken username
    // it is rather than letting the classifier call it a database error.
    if (insertError?.code === "23505") {
      return NextResponse.json({ error: "That username is taken" }, { status: 409 });
    }
    if (insertError || !user) {
      throw insertError ?? new Error("Insert returned no row");
    }

    // Reached only on success, and the only place AUTH_SECRET is read —
    // a throw from here means the deployment can't sign session cookies.
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
