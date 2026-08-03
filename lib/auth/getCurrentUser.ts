/**
 * Resolves the signed-in user (id + username) from the session cookie, for
 * use in API routes and server components. Returns null when signed out —
 * callers decide whether that's an error (see app/api/projects/route.ts)
 * or just an empty state (see app/account/page.tsx's server-rendered shell).
 */
import { getSessionUserId } from "./session";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export type CurrentUser = { id: string; username: string; createdAt: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("users").select("id, username, created_at").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return { id: data.id, username: data.username, createdAt: data.created_at };
}
