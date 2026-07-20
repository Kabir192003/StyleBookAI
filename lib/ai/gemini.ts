/**
 * Gemini client factory for AI Generate.
 *
 * Server-only — reads GEMINI_API_KEY, never import this into a client
 * component. Configured for JSON-only output since the AI route always
 * needs structured data back, never freeform prose.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

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

export function getGeminiJsonModel() {
  return getClient().getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
    },
  });
}
