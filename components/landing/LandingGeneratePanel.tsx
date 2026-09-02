// The "describe your brand, get a system" UI, rendered twice on the
// landing page (light in the top hero, dark in the "Three ways to build"
// panel) — both read/write the same lifted state so generating in one
// place shows in the other. Pure presentation: no fetch logic here, that
// stays in LandingExperience so there's one place talking to
// /api/ai/generate.
import { ContrastBadge } from "@/components/ui/ContrastBadge";
import { LandingPreview } from "@/lib/landing/aiPreview";

type Theme = "light" | "dark";

const THEME_TOKENS: Record<
  Theme,
  {
    cardBg: string;
    cardBorder: string;
    label: string;
    text: string;
    muted: string;
    placeholder: string;
  }
> = {
  light: {
    cardBg: "rgba(33,30,24,0.04)",
    cardBorder: "rgba(33,30,24,0.14)",
    label: "#8A8477",
    text: "#211E18",
    muted: "#6E675C",
    placeholder: "rgba(33,30,24,0.35)",
  },
  dark: {
    cardBg: "rgba(242,235,224,0.05)",
    cardBorder: "rgba(242,235,224,0.16)",
    label: "rgba(242,235,224,0.55)",
    text: "#F2EBE0",
    muted: "rgba(242,235,224,0.55)",
    placeholder: "rgba(242,235,224,0.35)",
  },
};

export function LandingGeneratePanel({
  theme,
  prompt,
  onPromptChange,
  status,
  onGenerate,
  fellBack,
  hasProject,
  preview,
  dataRevealItem = false,
  inputId,
}: {
  theme: Theme;
  prompt: string;
  onPromptChange: (value: string) => void;
  status: "idle" | "loading" | "done";
  onGenerate: () => void;
  fellBack: boolean;
  hasProject: boolean;
  preview: LandingPreview;
  dataRevealItem?: boolean;
  inputId: string;
}) {
  const t = THEME_TOKENS[theme];
  const revealProps = dataRevealItem ? { "data-reveal-item": true } : {};

  return (
    <>
      <div
        {...revealProps}
        className="max-w-[720px] rounded-[18px] border p-5"
        style={{ background: t.cardBg, borderColor: t.cardBorder }}
      >
        <label htmlFor={inputId} className="mb-2.5 block font-mono-plex text-[10px] uppercase tracking-[0.16em]" style={{ color: t.label }}>
          Describe your brand
        </label>
        <textarea
          id={inputId}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="A calm, premium skincare brand for Gen Z…"
          className="w-full resize-none bg-transparent text-xl leading-relaxed outline-none"
          style={{ color: t.text, fontFamily: "inherit" }}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12.5px] leading-snug" style={{ color: t.muted }}>
            {status === "loading"
              ? "Choosing colour, type and shape…"
              : fellBack
              ? "Live generation didn't respond, showing a saved example below."
              : hasProject
              ? "Generated live from the prompt above."
              : ""}
          </span>
          <button
            type="button"
            onClick={onGenerate}
            disabled={status === "loading" || !prompt.trim()}
            className="shrink-0 rounded-full px-[22px] py-[11px] text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#D2B68A,#B98A4E)", color: "#241B10" }}
          >
            {status === "loading" ? "Designing…" : "✦ Generate design system"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div {...revealProps} className="overflow-hidden rounded-2xl border" style={{ borderColor: t.cardBorder }}>
          <div className="flex h-[54px]">
            {preview.swatches.map((hex, i) => (
              <span key={i} className="flex-1" style={{ background: hex }} />
            ))}
          </div>
          <div className="px-3.5 py-3 font-mono-plex text-[9.5px] uppercase tracking-[0.12em]" style={{ color: t.muted }}>
            Palette · {preview.swatches.length} tokens
          </div>
        </div>
        <div {...revealProps} className="rounded-2xl border p-3.5" style={{ borderColor: t.cardBorder }}>
          <div className="truncate text-[30px] leading-[0.95]" style={{ fontFamily: preview.fontFamily, color: t.text }}>
            Aa
          </div>
          <div className="mt-2 truncate font-mono-plex text-[9.5px] uppercase tracking-[0.12em]" style={{ color: t.muted }}>
            {preview.fontLabel}
          </div>
        </div>
        <div {...revealProps} className="flex flex-col justify-between rounded-2xl border p-3.5" style={{ borderColor: t.cardBorder }}>
          <ContrastBadge foreground={preview.contrastFg} background={preview.contrastBg} />
          <div className="mt-2 truncate font-mono-plex text-[9.5px] uppercase tracking-[0.12em]" style={{ color: t.muted }}>
            {preview.contrastLabel}
          </div>
        </div>
      </div>
    </>
  );
}
