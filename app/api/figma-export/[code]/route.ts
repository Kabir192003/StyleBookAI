// Redeemed by the StyleBook Figma plugin, not the web app. One-shot: the row
// is deleted on successful read, so a code can't be replayed.
//
// CORS headers are required here specifically: the plugin's fetch() runs
// from `Origin: null` and still enforces normal browser CORS (manifest.json's
// networkAccess only controls what it's allowed to attempt, not whether the
// response is exposed to it). Every other route here is same-origin and has
// never needed this.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";

// Without this, Next treats a GET handler that touches no dynamic API as
// static and caches it — for a one-shot endpoint that means a second request
// would replay the already-deleted payload instead of 404ing.
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
