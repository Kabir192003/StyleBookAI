/**
 * POST /api/ai/generate — the only route that talks to the Gemini API.
 *
 * Owner: Kabir
 *
 * Request body: { prompt: string }
 * Response: a draft Project — colors[], fonts (heading/body), and an
 * AIReasoning object explaining each choice (see types/project.ts).
 *
 * TODO (Kabir):
 * - Validate body with zod
 * - Build the system prompt: select from allColors/allFonts rather than
 *   inventing hex codes, return structured JSON (use tool-use/structured
 *   output, not freeform text parsing)
 * - Map the model's color/font picks back to real entries in
 *   data/colors and data/fonts so hex values and notes stay accurate
 * - Rate limit per Clerk user
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  // TODO (Kabir): call Gemini API here using @google/generative-ai.
  return NextResponse.json(
    { error: "Not implemented yet — see TODOs in this file." },
    { status: 501 }
  );
}
