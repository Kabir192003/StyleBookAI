// The only route that talks to the Gemini API.
import { NextRequest, NextResponse } from "next/server";
import { AIGenerateRequestSchema } from "@/lib/ai/schema";
import { AIGenerationError, generateProjectFromPrompt } from "@/lib/ai/generate";

// Prompt building + the Gemini round-trip (plus a possible retry) can outrun
// Vercel's default serverless timeout, so raise it explicitly.
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
