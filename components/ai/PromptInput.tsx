/**
 * PromptInput — free-text box for describing the brand/vibe, plus a
 * Generate button. See docs/PRODUCT_AND_UX.md §4.
 *
 * TODO:
 * - Textarea + a few quick-pick chips (e.g. "Minimal SaaS", "Warm
 *   editorial", "Playful kids brand") that prefill the textarea
 * - On submit: POST to /api/ai/generate, show a loading state
 * - On success: hand the returned Project (colors/fonts/AIReasoning) up
 *   to the page so it can render the reasoning panel + PreviewLab
 */
"use client";

import { useState } from "react";

export function PromptInput() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="mt-6 max-w-xl">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your brand, e.g. 'a calm, premium skincare brand for sensitive skin'"
        className="w-full rounded-md border p-3 text-sm"
        rows={4}
      />
      <button
        disabled={!prompt.trim()}
        className="mt-3 rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        Generate
      </button>
    </div>
  );
}
