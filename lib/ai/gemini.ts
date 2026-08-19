// Gemini client factory for AI Generate. Server-only — reads GEMINI_API_KEY,
// never import into a client component. Configured for JSON-only output since
// the AI route always needs structured data back, never prose.
import { GoogleGenerativeAI } from "@google/generative-ai";

// gemini-flash-latest was intermittently overloaded (503s, slow requests);
// gemini-flash-lite-latest is more responsive and plenty capable here.
const MODEL_NAME = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

export function getGeminiJsonModel(options?: { maxOutputTokens?: number }) {
  return getClient().getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
      ...(options?.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {}),
    },
  });
}
