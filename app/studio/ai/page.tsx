/**
 * /studio/ai — AI Generate
 *
 * Owner: Qi
 *
 * Spec: docs/PRODUCT_AND_UX.md §4 (AI Generate flow) and §6 (AIReasoning —
 * the reasoning text returned alongside every AI-generated palette/font
 * choice; this is the OTHER half of the app's core differentiator, distinct
 * from the static per-item `note` field used in Browse/Studio manual mode).
 *
 * Flow:
 * 1. <PromptInput /> — user describes their brand/vibe
 * 2. POST /api/ai/generate (built by the lead) → returns a draft Project
 *    with colors, fonts, and an AIReasoning object
 * 3. Render the result using the same <PreviewLab /> component used in
 *    manual mode, PLUS a prominent, uncollapsed reasoning panel — do not
 *    bury this behind a toggle, it's the differentiator
 * 4. "Send to Studio" → writes into studioStore and routes to /studio
 *
 * TODO: build the reasoning panel component, wire up the fetch call and
 * loading/error states.
 */
import { PromptInput } from "@/components/ai/PromptInput";

export default function AIGeneratePage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Studio AI</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">AI Generate</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            Describe your brand and let AI build a palette, fonts, and the reasoning behind every choice.
          </p>
        </div>
        <PromptInput />
      </div>
    </main>
  );
}
