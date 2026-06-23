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
    <main className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">AI Generate</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Describe your brand and let AI build a palette, fonts, and the
        reasoning behind every choice.
      </p>
      <PromptInput />
    </main>
  );
}
