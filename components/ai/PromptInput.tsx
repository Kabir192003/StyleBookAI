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
import { ExportDrawer } from "@/components/studio/ExportDrawer";
import { useAIResultStore } from "@/store";
import { AIDeviation, AIGeneratedProject, ContrastReport } from "@/types/ai";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { paletteFromAIColors } from "@/lib/studio/paletteFromAIColors";
import { deriveDarkPaletteTokens } from "@/lib/studio/deriveThemeVariant";
import { PaletteTokens, StudioExportTokens } from "@/lib/studio/exportCode";

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

/**
 * Shows the measured contrast results and anything the pipeline changed or
 * couldn't honour.
 *
 * Both halves exist because QA caught the generator being quietly untrue: it
 * shipped body text at 1.02:1 while its own prose claimed WCAG AA, and it
 * silently turned a "hard 0px corners" brief into 4px. lib/ai/validateTokens.ts
 * now measures and repairs, and lib/ai/constraints.ts records substitutions —
 * but until this panel existed none of that reached the person reading the
 * result, so from the outside the tool looked exactly as untrustworthy as
 * before. Numbers here are always measurements of the final tokens, never
 * model claims.
 */
function VerificationPanel({
  report,
  deviations,
}: {
  report?: ContrastReport;
  deviations?: AIDeviation[];
}) {
  // Only the pairs actually held to a threshold. Disabled controls and
  // decorative surface-on-surface pairs are measured but exempt (see
  // ContrastCheck.informational) — listing them as "passes" would inflate
  // the count, and as "failures" would be wrong.
  const enforced = report?.checks.filter((c) => !c.informational) ?? [];
  const failures = enforced.filter((c) => !c.passes);
  const repaired = report?.checks.filter((c) => c.repaired) ?? [];

  if (!report && !deviations?.length) return null;

  return (
    <div className="mb-5 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#222D52]">
          Verified, not claimed
        </p>
        {report && (
          <span
            className="rounded-full px-3 py-1 font-mono-plex text-[10px] uppercase tracking-[0.12em]"
            style={{
              backgroundColor: report.level === "Fail" ? "#B3261E" : "#1F5C41",
              color: "#F2EBE0",
            }}
          >
            {report.level === "Fail"
              ? `${failures.length} pair${failures.length === 1 ? "" : "s"} below AA`
              : `WCAG ${report.level} · ${enforced.length} pairs checked`}
          </span>
        )}
      </div>

      {report && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-[#6E675C]">
          Every colour pair in this system was measured after generation
          {repaired.length > 0
            ? `, and ${repaired.length} token${repaired.length === 1 ? " was" : "s were"} adjusted to reach AA.`
            : "."}{" "}
          These are the ratios of the tokens you&rsquo;re actually getting.
        </p>
      )}

      {/* Failures first — a reviewer needs to see what's wrong before what's
          right. This ordering is the QA report's own recommendation. */}
      {failures.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {failures.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-[#B3261E]/30 bg-[#B3261E]/[0.06] px-3 py-2 text-[13px]"
            >
              <span className="font-semibold text-[#211E18]">{c.label}</span>
              <span className="font-mono-plex text-[11px] uppercase text-[#6E675C]">{c.variant}</span>
              <span className="ml-auto font-mono-plex text-[12px] text-[#B3261E]">
                {c.ratio}:1 · needs {c.required}:1
              </span>
            </li>
          ))}
        </ul>
      )}

      {report && enforced.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-mono-plex text-[10px] uppercase tracking-[0.14em] text-[#6E675C]">
            All {enforced.length} measured pairs
          </summary>
          <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {enforced.map((c) => (
              <li key={c.id} className="flex items-baseline gap-2 text-[12px] text-[#6E675C]">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 flex-none rounded-full"
                  style={{ backgroundColor: c.passes ? "#1F5C41" : "#B3261E" }}
                />
                <span className="truncate">{c.label}</span>
                <span className="ml-auto font-mono-plex text-[11px] text-[#211E18]">{c.ratio}:1</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {deviations && deviations.length > 0 && (
        <div className="mt-5 border-t border-black/[0.1] pt-4">
          <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">
            What we changed
          </p>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {deviations.map((d, i) => (
              <li key={`${d.subject}-${i}`} className="text-[13px] leading-relaxed text-[#6E675C]">
                <span className="font-semibold text-[#211E18]">{d.subject}</span>
                {" — asked for "}
                <span className="font-mono-plex text-[12px] text-[#211E18]">{d.requested}</span>
                {", shipped "}
                <span className="font-mono-plex text-[12px] text-[#211E18]">{d.applied}</span>
                {`. ${d.reason}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PromptInput() {
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [includeDesignSystem, setIncludeDesignSystem] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIGeneratedProject | null>(null);
  const [sentToStudio, setSentToStudio] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  // What "Regenerate" without feedback can't do: nudge a result instead of
  // replacing it outright. Kept separate from `prompt` (the original brief,
  // shown in the textarea) so re-opening this page later still shows what
  // the user actually typed, not a growing chain of refinement notes.
  const [refinement, setRefinement] = useState("");
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

  // `promptOverride` lets a refinement request send the brief *plus* the
  // feedback to the model without touching what's shown in the textarea —
  // the store still saves the plain `prompt`, so reopening this page later
  // shows the original brief, not an ever-growing chain of refinement notes.
  async function handleGenerate(promptOverride?: string) {
    const effectivePrompt = promptOverride ?? prompt;
    if (!effectivePrompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setSentToStudio(false);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: effectivePrompt, includeDesignSystem }),
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

  function regenerateWithFeedback() {
    if (!refinement.trim()) return;
    handleGenerate(`${prompt}\n\nRefinement: ${refinement.trim()}`);
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

  /**
   * Lets someone export straight off this page without a detour through
   * Studio, for the case where the AI result is already what they want.
   * Built the same way `openInStudio()` derives a palette (light from the
   * generated colours, dark by the same rule Studio itself uses when a
   * project has no explicit dark palette) rather than duplicating Studio's
   * full state-seeding logic — this only needs read-only export tokens, not
   * a live-editable StudioState.
   */
  function studioExportTokensFromAIResult(project: AIGeneratedProject): StudioExportTokens {
    const light = paletteFromAIColors(project.colors, DEFAULT_PREVIEW_PALETTE);
    return {
      name: project.name,
      light,
      dark: deriveDarkPaletteTokens(light),
      headFont: project.fonts.primary.family,
      bodyFont: project.fonts.secondary.family,
      accentFont: project.fonts.accent?.family,
      radius: project.cornerRadius?.recommended ?? 8,
      typeScale: project.typeScale,
      spacing: project.spacing,
      shadows: project.shadows,
      designSystem: project.designSystem,
    };
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
            className="w-full resize-none border-none bg-transparent font-grotesk text-[19px] leading-relaxed text-[#211E18] outline-none placeholder:text-[#6E675C]"
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
              onClick={() => handleGenerate()}
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
          <div className="font-mono-plex text-[11px] uppercase tracking-[0.2em] text-[#6E675C]">
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
                onClick={() => handleGenerate()}
                className="rounded-full border border-black/[0.24] bg-transparent px-[22px] py-3 text-sm text-[#211E18]"
              >
                ↻ Regenerate
              </button>
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="rounded-full border border-black/[0.24] bg-transparent px-[22px] py-3 text-sm text-[#211E18]"
              >
                Export ↓
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

          <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-4">
            <span className="font-mono-plex shrink-0 text-[10px] uppercase tracking-[0.16em] text-[#6E675C]">
              Not quite?
            </span>
            <input
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") regenerateWithFeedback();
              }}
              placeholder="e.g. make the accent more vibrant, try a serif pairing…"
              className="min-w-[220px] flex-1 rounded-full border border-black/[0.16] bg-white px-4 py-2 text-sm text-[#211E18] outline-none placeholder:text-[#6E675C]"
            />
            <button
              type="button"
              onClick={regenerateWithFeedback}
              disabled={!refinement.trim() || isLoading}
              className="shrink-0 rounded-full bg-[#211E18] px-5 py-2 text-sm font-semibold text-[#F2EBE0] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Regenerate with this →
            </button>
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

          <VerificationPanel report={result.contrastReport} deviations={result.deviations} />

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
                  <div className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Display</div>
                  <div
                    className="mt-1.5 text-[46px] leading-[0.95]"
                    style={{ fontFamily: `'${result.fonts.primary.family}', serif` }}
                  >
                    Aa
                  </div>
                  <div className="mt-1.5 text-[13px] text-[#6E675C]">{result.fonts.primary.family}</div>
                </div>
                <div className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-[18px]">
                  <div className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Body</div>
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
                      <div className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">Shadow</div>
                      <div className="mt-3 text-[13px] capitalize text-[#211E18]">{result.shadows.recommended}</div>
                    </div>
                  )}
                  {result.cornerRadius && (
                    <div className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-4">
                      <div className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">Radius</div>
                      <div className="mt-3 text-[13px] text-[#211E18]">{result.cornerRadius.recommended}px</div>
                    </div>
                  )}
                </div>
              )}

              {result.moodboard && result.moodboard.length > 0 && (
                <div className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-[18px]">
                  <div className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Moodboard</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {result.moodboard.map((image) => (
                      <div key={image.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.src} alt={image.alt} className="h-20 w-full rounded-lg object-cover" />
                        {image.credit && (
                          <p className="mt-1 truncate text-[10px] text-[#6E675C]">
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

      {exportOpen && result && (
        <ExportDrawer tokens={studioExportTokensFromAIResult(result)} onClose={() => setExportOpen(false)} />
      )}
    </div>
  );
}
