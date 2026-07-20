/**
 * PromptInput — free-text box for describing the brand/vibe, plus a
 * Generate button. Renders the returned palette, fonts, type scale, and
 * AI reasoning inline, and can hand the result to Studio.
 * See docs/PRODUCT_AND_UX.md §4.
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { ColorCard } from "@/components/colors/ColorCard";
import { useStudioStore } from "@/store";
import { AIGeneratedProject } from "@/types/ai";

const starterPrompts = [
  "Minimal SaaS for a calm B2B brand",
  "Warm editorial brand for a boutique publishing house",
  "Playful kids brand with bold color moments",
];

export function PromptInput() {
  const router = useRouter();
  const setColors = useStudioStore((s) => s.setColors);
  const setPrimaryFont = useStudioStore((s) => s.setPrimaryFont);
  const setSecondaryFont = useStudioStore((s) => s.setSecondaryFont);
  const setTypeScale = useStudioStore((s) => s.setTypeScale);

  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIGeneratedProject | null>(null);
  const [sentToStudio, setSentToStudio] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSentToStudio(false);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? `Request failed with ${response.status}`);
      }

      setResult(data.project as AIGeneratedProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate right now.");
    } finally {
      setIsLoading(false);
    }
  }

  function sendToStudio() {
    if (!result) return;
    setColors(result.colors);
    setPrimaryFont(result.fonts.primary);
    setSecondaryFont(result.fonts.secondary);
    setTypeScale(result.typeScale);
    setSentToStudio(true);
    router.push("/studio");
  }

  return (
    <div className="mt-6 max-w-3xl">
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
        className="mt-4 w-full max-w-xl rounded-2xl border border-neutral-200 p-3 text-sm"
        rows={5}
      />
      <div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isLoading}
          className="mt-3 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-10 space-y-8">
          {/* AI reasoning — the core differentiator, always visible, never collapsed */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
              AI reasoning
            </p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-900">{result.name}</h2>
            <dl className="mt-4 space-y-3 text-sm text-neutral-700">
              <div>
                <dt className="font-medium text-neutral-900">Palette</dt>
                <dd>{result.aiReasoning?.palette}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-900">Fonts</dt>
                <dd>{result.aiReasoning?.fonts}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-900">Type scale</dt>
                <dd>{result.aiReasoning?.typeScale}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-900">Overall</dt>
                <dd>{result.aiReasoning?.overall}</dd>
              </div>
            </dl>
          </div>

          {/* Colors */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Colors</p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {result.colors.map((color) => (
                <ColorCard key={color.id} color={color} />
              ))}
            </div>
          </div>

          {/* Fonts + moodboard + type scale */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                Heading font
              </p>
              <p className="mt-2 text-2xl text-neutral-900" style={{ fontFamily: `'${result.fonts.primary.family}'` }}>
                {result.fonts.primary.family}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                Body font
              </p>
              <p className="mt-2 text-2xl text-neutral-900" style={{ fontFamily: `'${result.fonts.secondary.family}'` }}>
                {result.fonts.secondary.family}
              </p>
            </div>

            {result.moodboard && result.moodboard.length > 0 && (
              <div className="rounded-xl border border-neutral-200 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Moodboard
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {result.moodboard.map((image) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={image.id}
                      src={image.src}
                      alt={image.alt}
                      className="h-20 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {result.typeScale && (
              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Type scale
                </p>
                <p className="mt-1 text-xs text-neutral-500">{result.typeScale.ratioName}</p>
                <div className="mt-3 space-y-1.5">
                  {(["xl", "lg", "base", "sm"] as const).map((key) => (
                    <div key={key} className="flex items-baseline gap-2">
                      <span
                        className="font-semibold text-neutral-900"
                        style={{ fontSize: Math.min(result.typeScale.sizes[key], 22) }}
                      >
                        Aa
                      </span>
                      <span className="text-xs text-neutral-400">{Math.round(result.typeScale.sizes[key])}px</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Spacing + shadows + corner radius */}
          <div className="grid gap-4 sm:grid-cols-3">
            {result.spacing && (
              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Spacing</p>
                <div className="mt-3 space-y-1.5">
                  {result.spacing.steps.map((step) => (
                    <div
                      key={step}
                      className="h-2 rounded-full bg-neutral-200"
                      style={{ width: `${Math.min(step, 96)}px` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {result.shadows && (
              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Shadows</p>
                <div className="mt-3 flex gap-3">
                  {result.shadows.levels.map((level) => (
                    <div key={level.name} className="flex flex-col items-center gap-1.5">
                      <div
                        className="h-12 w-12 rounded-lg bg-white"
                        style={{
                          boxShadow: level.value,
                          outline: level.name === result.shadows?.recommended ? "2px solid #171717" : "1px solid #e5e5e5",
                          outlineOffset: 2,
                        }}
                      />
                      <span className="text-[11px] text-neutral-500">{level.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.cornerRadius && (
              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Corner radius
                </p>
                <div className="mt-3 flex gap-2">
                  {result.cornerRadius.options.map((option) => (
                    <div
                      key={option}
                      className="grid h-10 w-10 place-items-center border text-xs text-neutral-600"
                      style={{
                        borderRadius: option,
                        borderColor: option === result.cornerRadius?.recommended ? "#171717" : "#e5e5e5",
                        borderWidth: option === result.cornerRadius?.recommended ? 2 : 1,
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={sendToStudio}
            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            {sentToStudio && <Check className="h-3.5 w-3.5" />}
            Send to Studio
          </button>
        </div>
      )}
    </div>
  );
}
