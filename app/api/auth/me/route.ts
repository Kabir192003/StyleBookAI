// GET never 401s — a signed-out visitor is a normal answer to "who's signed
// in," not an error.
// DELETE permanently deletes the account; ON DELETE CASCADE (lib/db/schema.sql)
// takes their projects and favorites with it.
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
