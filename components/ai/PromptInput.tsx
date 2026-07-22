/**
 * PromptInput — the /studio/ai screen: prompt box, generated result, and
 * a live mock preview, all driving the real POST /api/ai/generate flow.
 * See docs/PRODUCT_AND_UX.md §4.
 *
 * Styled to match the AiGenerator.dc.html design pulled from
 * claude.ai/design (project "Website redesign request") — a dark cosmic
 * take distinct from the rest of the site's cream/ink editorial chrome,
 * same treatment as the theme detail page's full re-theme. The global
 * SiteHeader stays mounted above it; everything below goes dark.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { GoogleFontsLoader } from "@/components/fonts/GoogleFontsLoader";
import { DesignSystemGallery } from "@/components/design-system/DesignSystemGallery";
import { SpacingVisualization } from "@/components/design-system/SpacingVisualization";
import { LivePreviewMock } from "@/components/ai/LivePreviewMock";
import { useStudioStore, useAIResultStore } from "@/store";
import { AIGeneratedProject } from "@/types/ai";
import { getContrastRatio } from "@/lib/colors/colorUtils";

const starterPrompts = [
  "Minimal SaaS for a calm B2B brand",
  "Warm editorial brand for a boutique publishing house",
  "Playful kids brand with bold color moments",
];

function onColor(hex: string): string {
  return getContrastRatio(hex, "#FBF8F2") >= getContrastRatio(hex, "#141110") ? "#FBF8F2" : "#141110";
}

function findColor(colors: AIGeneratedProject["colors"], roles: string[], fallbackIndex = 0): string {
  for (const role of roles) {
    const match = colors.find((c) => c.role?.toLowerCase() === role);
    if (match) return match.hex;
  }
  return colors[fallbackIndex]?.hex ?? "#211E18";
}

export function PromptInput() {
  const router = useRouter();
  const setColors = useStudioStore((s) => s.setColors);
  const setPrimaryFont = useStudioStore((s) => s.setPrimaryFont);
  const setSecondaryFont = useStudioStore((s) => s.setSecondaryFont);
  const setTypeScale = useStudioStore((s) => s.setTypeScale);

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
    // Preview Lab (/studio/compare) still reads from studioStore.
    setColors(result.colors);
    setPrimaryFont(result.fonts.primary);
    setSecondaryFont(result.fonts.secondary);
    setTypeScale(result.typeScale);
    setSentToStudio(true);

    const accent = findColor(result.colors, ["primary", "accent"]);
    const support = findColor(result.colors, ["secondary", "support"], 1);
    const surface = findColor(result.colors, ["background", "surface"], 2);
    const ink = findColor(result.colors, ["text"], 3);
    const muted = findColor(result.colors, ["muted", "textmuted"], 4);
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

  const accent = result ? findColor(result.colors, ["primary", "accent"]) : "#3B82F6";
  const support = result ? findColor(result.colors, ["secondary", "support"], 1) : "#93C5FD";
  const surface = result ? findColor(result.colors, ["background", "surface"], 2) : "#F7F9FC";
  const ink = result ? findColor(result.colors, ["text"], 3) : "#1E2430";
  const onAccent = onColor(accent);

  return (
    <div
      className="min-h-screen font-grotesk text-[#EFE9DC]"
      style={{
        background: "radial-gradient(1100px 620px at 50% -8%, #2A2140 0%, #171225 42%, #100C18 100%)",
      }}
    >
      {result && <GoogleFontsLoader fonts={[result.fonts.primary, result.fonts.secondary]} />}

      <section className="mx-auto max-w-[940px] px-6 pb-10 pt-16 text-center sm:px-8">
        <div className="font-mono-plex text-[11px] uppercase tracking-[0.26em] text-[#D2B68A]">
          AI Design-system generator
        </div>
        <h1 className="mt-4 font-editorial-serif text-[clamp(2.875rem,7vw,5.75rem)] font-normal leading-[0.98] tracking-[-0.025em]">
          Describe it. <br />
          <em className="text-[#D2B68A] not-italic">We design it.</em>
        </h1>
        <p className="mx-auto mt-5 max-w-[520px] text-base leading-relaxed text-[#EFE9DC]/[0.66]">
          Tell us the mood, the product, the audience. In one breath you get a complete system — palette,
          pairing, shape — ready to open in the Studio.
        </p>

        <div className="mx-auto mt-9 max-w-[720px] rounded-[20px] border border-white/[0.14] bg-white/[0.04] p-5 text-left shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. a warm, trustworthy fintech app for freelance creatives…"
            rows={3}
            className="w-full resize-none border-none bg-transparent font-grotesk text-[19px] leading-relaxed text-[#EFE9DC] outline-none placeholder:text-[#EFE9DC]/40"
          />
          <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-xs text-[#EFE9DC]/70">
            <input
              type="checkbox"
              checked={includeDesignSystem}
              onChange={(e) => setIncludeDesignSystem(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#D2B68A]"
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
                  className="rounded-full border border-white/[0.16] bg-white/[0.03] px-[13px] py-[7px] text-xs text-[#EFE9DC]/[0.72]"
                >
                  {sp}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="whitespace-nowrap rounded-full px-7 py-[13px] text-[15px] font-semibold text-[#241B10] shadow-[0_8px_24px_-8px_rgba(210,182,138,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #D2B68A, #B98A4E)" }}
            >
              {isLoading ? "Designing…" : result ? "Generate again ✦" : "Generate ✦"}
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-[#F28B82]">{error}</p>}
      </section>

      {isLoading && (
        <section className="mx-auto max-w-[720px] px-6 pb-[70px] pt-5 text-center sm:px-8">
          <div className="mb-5 inline-flex gap-[9px]">
            <span className="ai-dot h-[11px] w-[11px] rounded-full bg-[#D2B68A]" />
            <span className="ai-dot h-[11px] w-[11px] rounded-full bg-[#8B5CF6]" style={{ animationDelay: "0.18s" }} />
            <span className="ai-dot h-[11px] w-[11px] rounded-full bg-[#22D3EE]" style={{ animationDelay: "0.36s" }} />
          </div>
          <div className="font-editorial-serif text-2xl tracking-[-0.01em] text-[#EFE9DC]">
            Reading the brief and mixing pigments…
          </div>
        </section>
      )}

      {!isLoading && !result && (
        <section className="mx-auto max-w-[1080px] px-6 pb-[90px] pt-5 text-center sm:px-8">
          <div className="font-mono-plex text-[11px] uppercase tracking-[0.2em] text-[#EFE9DC]/40">
            Your generated system will appear here
          </div>
        </section>
      )}

      {!isLoading && result && (
        <section className="mx-auto max-w-[1080px] px-6 pb-20 pt-2 sm:px-8">
          <div className="mb-[18px] flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono-plex text-[11px] uppercase tracking-[0.22em] text-[#D2B68A]">
                Generated system
              </div>
              <h2 className="mt-2.5 font-editorial-serif text-[clamp(2.5rem,5.4vw,4.75rem)] font-normal leading-none tracking-[-0.02em] text-[#EFE9DC]">
                {result.name}
              </h2>
              {result.aiReasoning?.overall && (
                <p className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-[#EFE9DC]/[0.66]">
                  {result.aiReasoning.overall}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-full border border-white/[0.24] bg-transparent px-[22px] py-3 text-sm text-[#EFE9DC]"
              >
                ↻ Regenerate
              </button>
              <button
                type="button"
                onClick={openInStudio}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#EFE9DC] px-[26px] py-[13px] text-sm font-semibold text-[#141019]"
              >
                {sentToStudio && <Check className="h-3.5 w-3.5" />}
                Open in Studio →
              </button>
            </div>
          </div>

          {result.aiReasoning && (
            <div className="mb-5 rounded-2xl border border-white/[0.12] bg-white/[0.03] p-6">
              <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#D2B68A]">AI reasoning</p>
              <dl className="mt-3 grid gap-3 text-sm text-[#EFE9DC]/[0.8] sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-[#EFE9DC]">Palette</dt>
                  <dd className="mt-1 leading-relaxed">{result.aiReasoning.palette}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#EFE9DC]">Fonts</dt>
                  <dd className="mt-1 leading-relaxed">{result.aiReasoning.fonts}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#EFE9DC]">Type scale</dt>
                  <dd className="mt-1 leading-relaxed">{result.aiReasoning.typeScale}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_1fr]">
            <div className="flex flex-col gap-4">
              <div className="flex overflow-hidden rounded-2xl border border-white/[0.12]">
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
                <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-[18px]">
                  <div className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#EFE9DC]/50">Display</div>
                  <div
                    className="mt-1.5 text-[46px] leading-[0.95]"
                    style={{ fontFamily: `'${result.fonts.primary.family}', serif` }}
                  >
                    Aa
                  </div>
                  <div className="mt-1.5 text-[13px] text-[#EFE9DC]/[0.72]">{result.fonts.primary.family}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-[18px]">
                  <div className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#EFE9DC]/50">Body</div>
                  <div
                    className="mt-1.5 text-[46px] leading-[0.95]"
                    style={{ fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
                  >
                    Aa
                  </div>
                  <div className="mt-1.5 text-[13px] text-[#EFE9DC]/[0.72]">{result.fonts.secondary.family}</div>
                </div>
              </div>

              {(result.spacing || result.shadows || result.cornerRadius) && (
                <div className="grid grid-cols-3 gap-3">
                  {result.spacing && (
                    <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4">
                      <SpacingVisualization spacing={result.spacing} />
                    </div>
                  )}
                  {result.shadows && (
                    <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4">
                      <div className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#EFE9DC]/50">Shadow</div>
                      <div className="mt-3 text-[13px] capitalize text-[#EFE9DC]/[0.8]">{result.shadows.recommended}</div>
                    </div>
                  )}
                  {result.cornerRadius && (
                    <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4">
                      <div className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#EFE9DC]/50">Radius</div>
                      <div className="mt-3 text-[13px] text-[#EFE9DC]/[0.8]">{result.cornerRadius.recommended}px</div>
                    </div>
                  )}
                </div>
              )}

              {result.moodboard && result.moodboard.length > 0 && (
                <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-[18px]">
                  <div className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#EFE9DC]/50">Moodboard</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {result.moodboard.map((image) => (
                      <div key={image.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.src} alt={image.alt} className="h-20 w-full rounded-lg object-cover" />
                        {image.credit && (
                          <p className="mt-1 truncate text-[10px] text-[#EFE9DC]/40">
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
