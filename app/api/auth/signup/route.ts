/**
 * POST /api/auth/signup — creates a user with a username + password and
 * signs them in (sets the session cookie). No email, no verification —
 * a deliberately minimal v1 auth system (see CLAUDE.md).
 */
import { NextRequest, NextResponse } from "next/server";
import { CredentialsSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid username or password" },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;
  const admin = getSupabaseAdmin();

  const { data: existing } = await admin.from("users").select("id").eq("username", username).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "That username is taken" }, { status: 409 });
  }

  const password_hash = await hashPassword(password);
  const { data: user, error } = await admin
    .from("users")
    .insert({ username, password_hash })
    .select("id, username, created_at")
    .single();

  if (error || !user) {
    console.error("Signup failed:", error);
    return NextResponse.json({ error: "Couldn't create account" }, { status: 500 });
  }

  await setSessionCookie(user.id);
  return NextResponse.json(
    { user: { id: user.id, username: user.username, createdAt: user.created_at } },
    { status: 201 }
  );
}
