/**
 * GET /api/auth/me — returns the signed-in user, or { user: null } when
 * signed out. Never a 401 here — this route's whole job is answering
 * "who (if anyone) is signed in," so a signed-out visitor is a normal
 * response, not an error.
 *
 * DELETE /api/auth/me — permanently deletes the signed-in user's account.
 * ON DELETE CASCADE on projects.user_id and favorites.user_id (see
 * lib/db/schema.sql) takes their saved projects and favorites with it.
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { clearSessionCookie } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("users").delete().eq("id", user.id);
  if (error) {
    console.error("Failed to delete account:", error);
    return NextResponse.json({ error: "Couldn't delete account" }, { status: 500 });
  }

  clearSessionCookie();
  return NextResponse.json({ success: true });
}
