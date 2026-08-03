/**
 * Resolves the internal Supabase `users.id` (uuid) used to own saved
 * projects. Auth (Clerk) was removed — see CLAUDE.md — so for now every
 * visitor shares a single "anonymous" workspace rather than a per-user one;
 * `projects.user_id` is a FK to this row. Swap this out for a real
 * per-account lookup once username/password login exists.
 */
import { getSupabaseAdmin } from "./supabase";

const ANONYMOUS_USER_KEY = "anonymous";

export async function getOrCreateAnonymousUserId(): Promise<string> {
  const admin = getSupabaseAdmin();

  const { data: existing, error: selectError } = await admin
    .from("users")
    .select("id")
    .eq("clerk_id", ANONYMOUS_USER_KEY)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data: created, error: insertError } = await admin
    .from("users")
    .insert({ clerk_id: ANONYMOUS_USER_KEY, email: "" })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return created.id;
}
