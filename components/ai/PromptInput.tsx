/**
 * PromptInput — free-text box for describing the brand/vibe, plus a
 * Generate button. See docs/PRODUCT_AND_UX.md §4.
 *
 * Owner: Qi
 *
 * TODO (Qi):
 * - Textarea + a few quick-pick chips (e.g. "Minimal SaaS", "Warm
 *   editorial", "Playful kids brand") that prefill the textarea
 * - On submit: POST to /api/ai/generate, show a loading state
 * - On success: hand the returned Project (colors/fonts/AIReasoning) up
 *   to the page so it can render the reasoning panel + PreviewLab
 */

"use client";

import { useState } from "react";

const starterPrompts = [
  "Minimal SaaS for a calm B2B brand",
  "Warm editorial brand for a boutique publishing house",
  "Playful kids brand with bold color moments",
];

export function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const data = await response.json();
      setMessage(data?.error ? `AI route returned: ${data.error}` : "AI generation request sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-6 max-w-xl">
      <div className="flex flex-wrap gap-2">
        {starterPrompts.map((starterPrompt) => (
          <button
            key={starterPrompt}
            type="button"
            onClick={() => setPrompt(starterPrompt)}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600"
          >
            {starterPrompt}
          </button>
        ))}
      </div>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Describe your brand, e.g. 'a calm, premium skincare brand for sensitive skin'"
        className="mt-4 w-full rounded-2xl border border-neutral-200 p-3 text-sm"
        rows={5}
      />
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!prompt.trim() || isLoading}
        className="mt-3 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLoading ? "Generating..." : "Generate"}
      </button>
      {message && <p className="mt-3 text-sm text-neutral-600">{message}</p>}
    </div>
  );
}