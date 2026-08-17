/**
 * GET /api/figma-export/[code] — redeemed by the StyleBook Figma plugin
 * (manifest.json allow-lists this route's domain under networkAccess), not
 * by the web app. One-shot: the row is deleted on successful read, and
 * expired rows are rejected and cleaned up opportunistically, so a code
 * can't be replayed or left lingering in the table indefinitely.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";

// Without this, Next.js treats a GET route handler that touches no dynamic
// API (cookies/headers) as static and caches its response — which for a
// one-shot redemption endpoint means a second identical request would
// silently replay the already-deleted payload instead of 404ing.
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const admin = getSupabaseAdmin();

  const { data, error } = await admin.from("figma_export_codes").select("*").eq("code", code.toUpperCase()).maybeSingle();
  if (error) {
    console.error("Failed to look up Figma export code:", error);
    return NextResponse.json({ error: "Failed to look up code" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Code not found or already used" }, { status: 404 });
  }

  await admin.from("figma_export_codes").delete().eq("code", code.toUpperCase());

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Code expired — generate a new one in StyleBook" }, { status: 410 });
  }

  return NextResponse.json(data.payload);
}
