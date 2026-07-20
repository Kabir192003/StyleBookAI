/**
 * Resolves a Clerk user id to the internal Supabase `users.id` (uuid),
 * creating the row on first hit. `projects.user_id` is a FK to this table,
 * not the Clerk id directly, so every project route needs this first.
 */
import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "./supabase";

export async function getOrCreateUserId(clerkId: string): Promise<string> {
  const admin = getSupabaseAdmin();

  const { data: existing, error: selectError } = await admin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id;

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  const { data: created, error: insertError } = await admin
    .from("users")
    .insert({ clerk_id: clerkId, email })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return created.id;
}
