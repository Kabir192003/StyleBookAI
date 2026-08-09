/**
 * PromptInput — the /studio/ai screen: prompt box, generated result, and
 * a live mock preview, all driving the real POST /api/ai/generate flow.
 * See docs/PRODUCT_AND_UX.md §4.
 *
 * Styled to match the rest of the site's light cream/ink editorial chrome
 * (same vocabulary as SiteHeader.tsx and StudioBuilder.tsx: bg-[#EDE6DA]
 * page background, #211E18 ink, #222D52 accent, bg-[#F2EBE0] cards) — an
 * earlier version used a one-off dark-cosmic palette distinct from every
 * other page, which looked like a different product bolted on. The
 * generated preview mock below (LivePreviewMock) is intentionally NOT
 * part of this — it renders using the AI-generated brand's own colors,
 * not the site's chrome.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { GoogleFontsLoader } from "@/components/fonts/GoogleFontsLoader";
import { DesignSystemGallery } from "@/components/design-system/DesignSystemGallery";
import { SpacingVisualization } from "@/components/design-system/SpacingVisualization";
import { LivePreviewMock } from "@/components/ai/LivePreviewMock";
import { useAIResultStore } from "@/store";
import { AIGeneratedProject } from "@/types/ai";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { paletteFromAIColors } from "@/lib/studio/paletteFromAIColors";
import { PaletteTokens } from "@/lib/studio/exportCode";

const starterPrompts = [
  "Minimal SaaS for a calm B2B brand",
  "Warm editorial brand for a boutique publishing house",
  "Playful kids brand with bold color moments",
];

// Also the fallback passed to paletteFromAIColors when a role can't be
// matched at all — same values used both for this page's own live preview
// and for openInStudio()'s handoff, so both draw from one function
// (paletteFromAIColors) instead of two independently-maintained mappings.
const DEFAULT_PREVIEW_PALETTE: PaletteTokens = {
  accent: "#3B82F6",
  support: "#93C5FD",
  surface: "#F7F9FC",
  ink: "#1E2430",
  muted: "#8A8477",
};

function onColor(hex: string): string {
  return getContrastRatio(hex, "#FBF8F2") >= getContrastRatio(hex, "#141110") ? "#FBF8F2" : "#141110";
}

export function PromptInput() {
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [includeDesignSystem, setIncludeDesignSystem] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIGeneratedProject | null>(null);
  const [sentToStudio, setSentToStudio] = useState(false);
  const saveAIResult = useAIResultStore((s) => s.setResult);

  // Hydrate from the last generation (sessionStorage-backed) instead of
  // always starting blank — fixes navigating to Studio and back losing the
  // result. Done in an effect (not the useState initializer) so the first
  // client render matches the server-rendered (blank) HTML — reading the
  // store during the initializer would hydrate ahead of the server and
  // trigger a React hydration-mismatch warning.
  useEffect(() => {
    const stored = useAIResultStore.getState();
    if (stored.result) {
      setPrompt(stored.prompt);
      setIncludeDesignSystem(stored.includeDesignSystem);
      setResult(stored.result);
    }
  }, []);

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setSentToStudio(false);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, includeDesignSystem }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? `Request failed with ${response.status}`);
      }

      const project = data.project as AIGeneratedProject;
      setResult(project);
      saveAIResult(prompt, includeDesignSystem, project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate right now.");
    } finally {
      setIsLoading(false);
    }
  }

  function openInStudio() {
    if (!result) return;
    setSentToStudio(true);

    const { accent, support, surface, ink, muted } = paletteFromAIColors(result.colors, DEFAULT_PREVIEW_PALETTE);
    const params = new URLSearchParams({
      from: "ai",
      name: result.name,
      mode: onColor(surface) === "#141110" ? "Light" : "Dark",
      accent,
      support,
      surface,
      ink,
      muted,
      head: result.fonts.primary.family,
      body: result.fonts.secondary.family,
      ...(result.cornerRadius ? { radius: String(result.cornerRadius.recommended) } : {}),
    });
    router.push(`/studio?${params.toString()}`);
  }

  const palette = result ? paletteFromAIColors(result.colors, DEFAULT_PREVIEW_PALETTE) : DEFAULT_PREVIEW_PALETTE;
  const { accent, support, surface, ink } = palette;
  const onAccent = onColor(accent);

  return (
    <div className="min-h-screen bg-[#EDE6DA] font-grotesk text-[#211E18]">
      {result && <GoogleFontsLoader fonts={[result.fonts.primary, result.fonts.secondary]} />}

      <section className="mx-auto max-w-[940px] px-6 pb-10 pt-16 text-center sm:px-8">
        <div className="font-mono-plex text-[11px] uppercase tracking-[0.26em] text-[#222D52]">
          AI Design-system generator
        </div>
        <h1 className="mt-4 font-editorial-serif text-[clamp(2.875rem,7vw,5.75rem)] font-normal leading-[0.98] tracking-[-0.025em]">
          Describe it. <br />
          <em className="text-[#222D52] not-italic">We design it.</em>
        </h1>
        <p className="mx-auto mt-5 max-w-[520px] text-base leading-relaxed text-[#6E675C]">
          Tell us the mood, the product, the audience. In one breath you get a complete system — palette,
          pairing, shape — ready to open in the Studio.
        </p>

        <div className="mx-auto mt-9 max-w-[720px] rounded-[20px] border border-black/[0.14] bg-[#F2EBE0] p-5 text-left shadow-[0_20px_50px_-30px_rgba(33,30,24,0.4)]">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. a warm, trustworthy fintech app for freelance creatives…"
            rows={3}
            className="w-full resize-none border-none bg-transparent font-grotesk text-[19px] leading-relaxed text-[#211E18] outline-none placeholder:text-[#8A8477]"
          />
          <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-xs text-[#6E675C]">
            <input
              type="checkbox"
              checked={includeDesignSystem}
              onChange={(e) => setIncludeDesignSystem(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#222D52]"
            />
            Generate a full design system (components, states, light/dark, accessibility)
          </label>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {starterPrompts.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setPrompt(sp)}
                  className="rounded-full border border-black/[0.16] bg-white px-[13px] py-[7px] text-xs text-[#6E675C]"
                >
                  {sp}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="whitespace-nowrap rounded-full bg-[#222D52] px-7 py-[13px] text-[15px] font-semibold text-[#F2EBE0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Designing…" : result ? "Generate again ✦" : "Generate ✦"}
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-[#B3261E]">{error}</p>}
      </section>

      {isLoading && (
        <section className="mx-auto max-w-[720px] px-6 pb-[70px] pt-5 text-center sm:px-8">
          <div className="mb-5 inline-flex gap-[9px]">
            <span className="ai-dot h-[11px] w-[11px] rounded-full bg-[#222D52]" />
            <span className="ai-dot h-[11px] w-[11px] rounded-full bg-[#8B5CF6]" style={{ animationDelay: "0.18s" }} />
            <span className="ai-dot h-[11px] w-[11px] rounded-full bg-[#22D3EE]" style={{ animationDelay: "0.36s" }} />
          </div>
          <div className="font-editorial-serif text-2xl tracking-[-0.01em] text-[#211E18]">
            Reading the brief and mixing pigments…
          </div>
        </section>
      )}

      {!isLoading && !result && (
        <section className="mx-auto max-w-[1080px] px-6 pb-[90px] pt-5 text-center sm:px-8">
          <div className="font-mono-plex text-[11px] uppercase tracking-[0.2em] text-[#8A8477]">
            Your generated system will appear here
          </div>
        </section>
      )}

      {!isLoading && result && (
        <section className="mx-auto max-w-[1080px] px-6 pb-20 pt-2 sm:px-8">
          <div className="mb-[18px] flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono-plex text-[11px] uppercase tracking-[0.22em] text-[#222D52]">
                Generated system
              </div>
              <h2 className="mt-2.5 font-editorial-serif text-[clamp(2.5rem,5.4vw,4.75rem)] font-normal leading-none tracking-[-0.02em] text-[#211E18]">
                {result.name}
              </h2>
              {result.aiReasoning?.overall && (
                <p className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-[#6E675C]">
                  {result.aiReasoning.overall}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-full border border-black/[0.24] bg-transparent px-[22px] py-3 text-sm text-[#211E18]"
              >
                ↻ Regenerate
              </button>
              <button
                type="button"
                onClick={openInStudio}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#222D52] px-[26px] py-[13px] text-sm font-semibold text-[#F2EBE0]"
              >
                {sentToStudio && <Check className="h-3.5 w-3.5" />}
                Open in Studio →
              </button>
            </div>
          </div>

          {result.aiReasoning && (
            <div className="mb-5 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
              <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#222D52]">AI reasoning</p>
              <dl className="mt-3 grid gap-3 text-sm text-[#6E675C] sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-[#211E18]">Palette</dt>
                  <dd className="mt-1 leading-relaxed">{result.aiReasoning.palette}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#211E18]">Fonts</dt>
                  <dd className="mt-1 leading-relaxed">{result.aiReasoning.fonts}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#211E18]">Type scale</dt>
                  <dd className="mt-1 leading-relaxed">{result.aiReasoning.typeScale}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_1fr]">
            <div className="flex flex-col gap-4">
              <div className="flex overflow-hidden rounded-2xl border border-black/[0.12]">
                {result.colors.map((c) => (
                  <div key={c.id} className="min-h-[132px] flex-1 p-3.5" style={{ backgroundColor: c.hex, color: onColor(c.hex) }}>
                    <div className="flex h-full flex-col justify-between">
                      <span className="font-mono-plex text-[9px] uppercase tracking-[0.14em] opacity-[0.72]">
                        {c.role ?? "Color"}
                      </span>
                      <span className="font-mono-plex text-[11px]">{c.hex}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-[18px]">
                  <div className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#8A8477]">Display</div>
                  <div
                    className="mt-1.5 text-[46px] leading-[0.95]"
                    style={{ fontFamily: `'${result.fonts.primary.family}', serif` }}
                  >
                    Aa
                  </div>
                  <div className="mt-1.5 text-[13px] text-[#6E675C]">{result.fonts.primary.family}</div>
                </div>
                <div className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-[18px]">
                  <div className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#8A8477]">Body</div>
                  <div
                    className="mt-1.5 text-[46px] leading-[0.95]"
                    style={{ fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
                  >
                    Aa
                  </div>
                  <div className="mt-1.5 text-[13px] text-[#6E675C]">{result.fonts.secondary.family}</div>
                </div>
              </div>

              {(result.spacing || result.shadows || result.cornerRadius) && (
                <div className="grid grid-cols-3 gap-3">
                  {result.spacing && (
                    <div className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-4">
                      <SpacingVisualization spacing={result.spacing} />
                    </div>
                  )}
                  {result.shadows && (
                    <div className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-4">
                      <div className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#8A8477]">Shadow</div>
                      <div className="mt-3 text-[13px] capitalize text-[#211E18]">{result.shadows.recommended}</div>
                    </div>
                  )}
                  {result.cornerRadius && (
                    <div className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-4">
                      <div className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#8A8477]">Radius</div>
                      <div className="mt-3 text-[13px] text-[#211E18]">{result.cornerRadius.recommended}px</div>
                    </div>
                  )}
                </div>
              )}

              {result.moodboard && result.moodboard.length > 0 && (
                <div className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-[18px]">
                  <div className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#8A8477]">Moodboard</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {result.moodboard.map((image) => (
                      <div key={image.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.src} alt={image.alt} className="h-20 w-full rounded-lg object-cover" />
                        {image.credit && (
                          <p className="mt-1 truncate text-[10px] text-[#8A8477]">
                            Photo:{" "}
                            <a href={image.credit.photographerUrl} target="_blank" rel="noopener noreferrer" className="underline">
                              {image.credit.photographerName}
                            </a>{" "}
                            /{" "}
                            <a href={image.credit.unsplashUrl} target="_blank" rel="noopener noreferrer" className="underline">
                              Unsplash
                            </a>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <LivePreviewMock result={result} surface={surface} ink={ink} accent={accent} support={support} onAccent={onAccent} />
          </div>

          {result.designSystem && <DesignSystemGallery designSystem={result.designSystem} />}
        </section>
      )}
    </div>
  );
}
