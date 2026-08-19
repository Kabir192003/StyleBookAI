// Stores a FigmaExportPayload under a short random code, redeemed by the
// plugin via GET /api/figma-export/[code]. No auth required — it's design
// tokens/geometry, not account data. The payload itself is built client-side
// (lib/figmaExport/captureCanvas.ts) since it's a serialization of the live
// canvas DOM (computed styles, measured rects) that only exists in the
// browser — this route just validates and stores it.
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/supabase";

// Structural only — the node tree is large and produced by our own
// serializer, not user input, so only the fields the plugin actually
// branches on are checked; the rest is carried through untouched.
const PayloadSchema = z.object({
  schemaVersion: z.literal(2),
  meta: z.object({ name: z.string().min(1), generatedAt: z.string() }),
  variables: z.object({
    color: z.record(z.object({ light: z.string(), dark: z.string().optional() })),
    spacing: z.array(z.number()),
    radius: z.object({ base: z.number(), sm: z.number(), md: z.number(), lg: z.number(), full: z.number() }),
    typeSize: z.record(z.number()),
  }),
  componentLibrary: z.array(z.any()).optional(),
  canvas: z.any().optional(),
});

const RequestSchema = z.object({ payload: PayloadSchema });

const CODE_TTL_MS = 30 * 60 * 1000;
// Practical ceiling for a canvas tree — past this, the walker ran away
// rather than the page genuinely being this big.
const MAX_PAYLOAD_BYTES = 12 * 1024 * 1024;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easy to type/paste by hand

function generateCode(): string {
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid export request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { payload } = parsed.data;
  if (!payload.canvas && !payload.componentLibrary?.length) {
    return NextResponse.json({ error: "Nothing to export — select at least one option." }, { status: 400 });
  }
  const size = JSON.stringify(payload).length;
  if (size > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "This canvas is too large to export in one go." }, { status: 413 });
  }

  const admin = getSupabaseAdmin();
  const code = generateCode();
  const { error } = await admin.from("figma_export_codes").insert({
    code,
    payload,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });

  if (error) {
    console.error("Failed to store Figma export code:", error);
    return NextResponse.json({ error: "Failed to generate export code" }, { status: 500 });
  }

  return NextResponse.json({ code, expiresInMinutes: CODE_TTL_MS / 60000 });
}
