/**
 * POST /api/figma-export — builds a FigmaExportPayload from the current
 * Studio tokens and stores it under a short random code the user pastes
 * into the StyleBook Figma plugin (which redeems it via
 * GET /api/figma-export/[code] — see that route). No auth required: the
 * payload is design tokens/geometry, not account data, same trust level as
 * the existing inline-project path in /api/export.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { serializeFigmaExport } from "@/lib/figmaExport/serializePayload";

const HEX = /^#[0-9a-fA-F]{6,8}$/;
const hex = z.string().regex(HEX);

const PaletteSchema = z.object({ accent: hex, support: hex, surface: hex, ink: hex, muted: hex });

const StudioExportTokensSchema = z.object({
  name: z.string().min(1),
  light: PaletteSchema,
  dark: PaletteSchema,
  headFont: z.string().min(1),
  bodyFont: z.string().min(1),
  accentFont: z.string().optional(),
  radius: z.number(),
  typeScale: z.any().optional(),
  spacing: z.any().optional(),
  shadows: z.any().optional(),
  designSystem: z.any().optional(),
});

const RequestSchema = z.object({
  tokens: StudioExportTokensSchema,
  componentLibrary: z.boolean().default(false),
  canvas: z.boolean().default(false),
});

const CODE_TTL_MS = 30 * 60 * 1000;

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
  if (!parsed.data.componentLibrary && !parsed.data.canvas) {
    return NextResponse.json({ error: "Select at least one of Component Library or Current Canvas" }, { status: 400 });
  }

  const payload = serializeFigmaExport(parsed.data.tokens, {
    componentLibrary: parsed.data.componentLibrary,
    canvas: parsed.data.canvas,
  });

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
