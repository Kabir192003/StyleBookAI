/**
 * GET /api/figma-export/[code] — redeemed by the StyleBook Figma plugin
 * (manifest.json allow-lists this route's domain under networkAccess), not
 * by the web app. One-shot: the row is deleted on successful read, and
 * expired rows are rejected and cleaned up opportunistically, so a code
 * can't be replayed or left lingering in the table indefinitely.
 *
 * CORS headers are required here specifically: a Figma plugin's main-thread
 * fetch() still enforces normal browser CORS (networkAccess in manifest.json
 * only controls which domains it's allowed to *attempt*, not whether the
 * response is exposed to it) and runs from `Origin: null`, not this site's
 * own origin — every other route in this app is same-origin (called from
 * StyleBook's own pages) and has never needed this.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";

// Without this, Next.js treats a GET route handler that touches no dynamic
// API (cookies/headers) as static and caches its response — which for a
// one-shot redemption endpoint means a second identical request would
// silently replay the already-deleted payload instead of 404ing.
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const admin = getSupabaseAdmin();

  const { data, error } = await admin.from("figma_export_codes").select("*").eq("code", code.toUpperCase()).maybeSingle();
  if (error) {
    console.error("Failed to look up Figma export code:", error);
    return json({ error: "Failed to look up code" }, 500);
  }
  if (!data) {
    return json({ error: "Code not found or already used" }, 404);
  }

  await admin.from("figma_export_codes").delete().eq("code", code.toUpperCase());

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return json({ error: "Code expired — generate a new one in StyleBook" }, 410);
  }

  return json(data.payload);
}
