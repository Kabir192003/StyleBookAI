/**
 * POST /api/ai/generate — the only route that talks to the Gemini API.
 *
 * Owner: Kabir
 *
 * Request body: AIGenerateRequest (see types/ai.ts).
 * Response: a draft Project — colors[], fonts (primary/secondary/accent),
 * typeScale, and an AIReasoning object explaining each choice.
 */
import { NextRequest, NextResponse } from "next/server";
import { AIGenerateRequestSchema } from "@/lib/ai/schema";
import { AIGenerationError, generateProjectFromPrompt } from "@/lib/ai/generate";

// Building the candidate-color/font prompt plus a real Gemini round-trip
// (and possibly a retry) routinely exceeds Vercel's default serverless
// function timeout — raise it explicitly rather than let requests die mid-generation.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = AIGenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const project = await generateProjectFromPrompt(parsed.data);
    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof AIGenerationError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("AI generate failed:", error);
    return NextResponse.json({ error: "Generation failed, try again" }, { status: 500 });
  }
}
