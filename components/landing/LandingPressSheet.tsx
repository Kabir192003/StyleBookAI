/**
 * "Press sheet" (1A) from the Hero Shortlist design doc — the landing page's
 * product hero, sitting above the "this page has no system" scroll story.
 *
 * The conceit is a printer's proof: a 48px grid ruled across the ground, a
 * registration mark in the corner, an ink-slab holding the last line of the
 * headline, and a specimen row along the bottom reading like plate
 * annotations. That framing is the reason the layout stays fairly literal to
 * the comp — the alignment *is* the idea, so the headline's stepped indents
 * and the slab's offset are preserved rather than normalised away.
 *
 * Responsive: the comp is a fixed 1440x1000 artboard. The stepped headline
 * indents and the four-up specimen row collapse below `lg`, where they would
 * otherwise force a horizontal scroll; the grid, rail and marquee stay.
 *
 * Colour follows the comp except where it fails WCAG AA for small text: its
 * #8A8172 labels measure 3.33:1 on this ground and its #C36B3E eyebrow 3.31,
 * and the terracotta CTA carries cream text at 3.58. Those three are
 * darkened. #C36B3E is untouched wherever it is a rule, a dot or display
 * type, which pass on their own.
 */
"use client";

import Link from "next/link";
import type { LandingPreview } from "@/lib/landing/aiPreview";

const C = {
  ground: "#F4EEE2",
  ink: "#222D52",
  /** Body copy — the comp's own value, 6.31:1. */
  body: "#5C5648",
  /** Plate annotations. The comp's #8A8172 is 3.33:1; this is 4.78. */
  label: "#6F685A",
  /** Rules, dots and display type only. */
  accent: "#C36B3E",
  /** Small terracotta text and the CTA ground — 4.76 and 5.15 with cream. */
  accentText: "#A4522A",
  verified: "#1F5C41",
  onAccent: "#FBF7EF",
} as const;

const RAIL_CHIPS = ["#1F5C41", "#E4C15A", "#CF4E86", "#6FB0DE", "#7A3B86", "#178C88"];

const MARQUEE = [
  "{ } CSS variables",
  "[ ] JSON tokens",
  "~/ Tailwind",
  "◇ Figma tokens",
  "⚛ React",
  "◆ Flutter",
  "SwiftUI",
  "↓ Style guide",
];

const mono = "font-mono-plex";
const HEADLINE = "font-editorial-serif leading-[0.88] tracking-[-0.035em]";
const HEADLINE_SIZE = { fontSize: "clamp(40px,8vw,118px)" };

export function LandingPressSheet({
  prompt,
  onPromptChange,
  status,
  onGenerate,
  fellBack,
  hasProject,
  preview,
  projectName,
  onOpenInStudio,
  inputId,
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
  status: "idle" | "loading" | "done";
  onGenerate: () => void;
  fellBack: boolean;
  hasProject: boolean;
  preview: LandingPreview;
  projectName?: string;
  onOpenInStudio: () => void;
  inputId: string;
}) {
  /** The comp's static "Prompt · 01" slot doubles as the generator's status
   *  line — without it a visitor gets no feedback between pressing Generate
   *  and the specimen row changing underneath them. */
  const statusNote =
    status === "loading"
      ? "Generating…"
      : fellBack
        ? "Saved example"
        : hasProject
          ? "Generated live"
          : "Prompt · 01";
  return (
    <section
      data-reveal-group
      className="relative flex min-h-[calc(100vh-56px)] flex-col overflow-hidden"
      style={{
        background: C.ground,
        color: C.ink,
        backgroundImage:
          "linear-gradient(rgba(34,45,82,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(34,45,82,0.05) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      {/* ------------------------------------------------------- left rail */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 hidden w-[74px] flex-col items-center justify-between border-r py-[26px] lg:flex"
        style={{ borderColor: "rgba(34,45,82,0.16)", background: "rgba(244,238,226,0.6)" }}
      >
        <span className="h-3 w-3 rounded-full" style={{ background: C.accent }} />
        <div
          className={`${mono} whitespace-nowrap text-[11px] uppercase tracking-[0.34em]`}
          style={{ color: C.ink, writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Tokens 00/24 &nbsp;·&nbsp; Welcome
        </div>
        <div className="flex flex-col gap-1.5">
          {RAIL_CHIPS.map((hex) => (
            <span key={hex} className="h-2.5 w-2.5" style={{ background: hex }} />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------ registration mark */}
      <div aria-hidden="true" className="absolute right-[34px] top-[34px] hidden h-[26px] w-[26px] opacity-55 sm:block">
        <span className="absolute left-3 top-0 h-[26px] w-px" style={{ background: C.ink }} />
        <span className="absolute left-0 top-3 h-px w-[26px]" style={{ background: C.ink }} />
        <span className="absolute left-[5px] top-[5px] h-4 w-4 rounded-full border" style={{ borderColor: C.ink }} />
      </div>

      <div className="relative flex flex-1 flex-col px-6 pb-[70px] pt-11 sm:px-10 lg:pl-[130px] lg:pr-14 lg:pb-[74px]">
        {/* plate header */}
        <div
          data-reveal-item
          className={`${mono} flex flex-wrap items-baseline justify-between gap-2 text-[11.5px] uppercase tracking-[0.22em]`}
        >
          <span style={{ color: C.accentText }}>StyleBook — AI design-system generator</span>
          <span style={{ color: C.label }}>Sheet 01 / Hero</span>
        </div>

        {/* ---------------------------------------------------- headline */}
        <div className="mt-8 lg:mt-[34px]">
          <h1 data-reveal-item className={HEADLINE} style={{ ...HEADLINE_SIZE, color: C.ink }}>
            Describe your brand.
          </h1>

          {/* The stepped indent and the trailing rule are the press-sheet
              conceit; they only apply once there's width to step into. */}
          <div data-reveal-item className="mt-4 flex items-center gap-6 lg:pl-24">
            <div className={HEADLINE} style={{ ...HEADLINE_SIZE, color: C.ink }}>
              Get a complete
            </div>
            <span aria-hidden="true" className="mt-3.5 hidden h-px flex-1 lg:block" style={{ background: C.accent }} />
            <span
              aria-hidden="true"
              className="mt-3.5 hidden h-[11px] w-[11px] shrink-0 rounded-full lg:block"
              style={{ background: C.accent }}
            />
          </div>

          <div
            data-reveal-item
            className="mt-3.5 inline-block rounded-[3px] px-[30px] pb-5 pt-2.5 lg:ml-[184px]"
            style={{ background: C.ink }}
          >
            <span className={`${HEADLINE} italic`} style={{ ...HEADLINE_SIZE, color: C.ground }}>
              design system.
            </span>
          </div>
        </div>

        {/* ------------------------------------------------ sub + prompt */}
        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:gap-14">
          <p data-reveal-item className="text-[16px] leading-[1.62] lg:w-[400px] lg:shrink-0" style={{ color: C.body }}>
            Palette, typography, spacing and accessibility — generated in seconds, verified for real contrast (not
            just claimed), refined in Studio, exported anywhere.
          </p>

          <div
            data-reveal-item
            className="flex-1 border-b border-t pb-[18px] pt-4"
            style={{ borderTopColor: C.ink, borderBottomColor: "rgba(34,45,82,0.18)" }}
          >
            <div
              className={`${mono} flex items-baseline justify-between gap-3 text-[10px] uppercase tracking-[0.2em]`}
              style={{ color: C.label }}
            >
              <label htmlFor={inputId}>Describe your brand</label>
              <span aria-live="polite">{statusNote}</span>
            </div>

            <div className="mt-3.5 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
              {/* The comp sets the prompt in italic display type; keeping a
                  real textarea means it reads as the drawn specimen and is
                  still the live input behind /api/ai/generate. */}
              <textarea
                id={inputId}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                rows={2}
                maxLength={280}
                placeholder="A calm, premium skincare brand for Gen Z that feels trustworthy, not clinical."
                className="w-full flex-1 resize-none bg-transparent font-editorial-serif text-[clamp(21px,2.2vw,29px)] font-light italic leading-[1.24] outline-none"
                style={{ color: C.ink }}
              />
              <button
                type="button"
                onClick={onGenerate}
                disabled={status === "loading" || !prompt.trim()}
                className="shrink-0 whitespace-nowrap rounded-[3px] px-[26px] py-3.5 text-[15px] font-semibold transition-colors disabled:opacity-60"
                style={{ background: C.accentText, color: C.onAccent }}
              >
                {status === "loading" ? "Designing…" : "✦ Generate design system"}
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------------------------- specimen row */}
        <div
          data-reveal-item
          className="mt-8 grid grid-cols-1 border-t sm:grid-cols-2 lg:grid-cols-4"
          style={{ borderColor: "rgba(34,45,82,0.18)" }}
        >
          <SpecimenCell label="01 — palette" note={`${preview.swatches.length} tokens · locked`}>
            <div className="mt-4 flex h-[70px]">
              {preview.swatches.map((hex, i) => (
                <span key={`${hex}-${i}`} className="flex-1" style={{ background: hex }} />
              ))}
            </div>
          </SpecimenCell>

          <SpecimenCell label="02 — type" note={`${preview.fontLabel} / 1.25 scale`}>
            <div className="mt-2 text-[62px] leading-[0.9]" style={{ fontFamily: preview.fontFamily, color: C.ink }}>
              Aa
            </div>
          </SpecimenCell>

          <SpecimenCell
            label="03 — contrast"
            note={`${wcagLabel(contrastRatioValue(preview.contrastFg, preview.contrastBg))} · verified, not claimed`}
            noteColor={C.verified}
          >
            <div className="mt-2.5 font-editorial-serif text-[52px] leading-none" style={{ color: C.verified }}>
              {contrastRatioValue(preview.contrastFg, preview.contrastBg).toFixed(1)}
              <span className={`${mono} text-[20px]`}>:1</span>
            </div>
          </SpecimenCell>

          <SpecimenCell label="04 — shape" note={preview.contrastLabel} last>
            <div className="mt-4 flex h-[70px] items-end gap-2">
              <span className="h-11 w-11 rounded-[12px]" style={{ background: C.ink }} />
              <span className="h-[26px] w-[26px] rounded-lg" style={{ background: C.accent }} />
              <span className="h-3.5 w-3.5 rounded" style={{ background: "#D2B68A" }} />
            </div>
          </SpecimenCell>
        </div>

        {/* -------------------------------------------------- footer row */}
        <div
          className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t pb-1.5 pt-[22px]"
          style={{ borderColor: "rgba(34,45,82,0.18)" }}
        >
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {hasProject && projectName && (
              <button
                type="button"
                onClick={onOpenInStudio}
                className="rounded-[3px] px-5 py-2.5 text-[15px] font-semibold"
                style={{ background: C.ink, color: C.ground }}
              >
                Open &ldquo;{projectName}&rdquo; in Studio →
              </button>
            )}
            <Link
              href="/browse/colors"
              className="pb-[3px] text-[16px] font-semibold"
              style={{ color: C.ink, borderBottom: `2px solid ${C.accent}` }}
            >
              Browse the library →
            </Link>
            <Link
              href="/studio"
              className="pb-[3px] text-[16px] font-semibold"
              style={{ color: C.ink, borderBottom: "2px solid rgba(34,45,82,0.2)" }}
            >
              Open the Studio →
            </Link>
          </div>
          <a
            href="#story"
            className={`${mono} flex items-center gap-3.5 text-[10.5px] uppercase tracking-[0.18em]`}
            style={{ color: C.label }}
          >
            <span>See how it&apos;s built</span>
            <span aria-hidden="true" className="hidden h-px w-14 sm:block" style={{ background: "rgba(34,45,82,0.3)" }} />
            <span style={{ color: C.ink }}>↓</span>
          </a>
        </div>
      </div>

      {/* ------------------------------------------------- export marquee
          Starts after the rail, as in the comp, where it lives inside the
          content column rather than spanning the full sheet. That also keeps
          it clear of the landing's fixed bottom-left HUD, which floats over
          every section at this corner. */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 flex h-[52px] items-center overflow-hidden border-t lg:left-[210px]"
        style={{ borderColor: "rgba(34,45,82,0.18)" }}
      >
        <div
          className={`${mono} flex gap-10 whitespace-nowrap text-[11px] uppercase tracking-[0.2em]`}
          style={{ color: C.label, animation: "sb-marquee 26s linear infinite" }}
        >
          {/* Rendered twice so the translate(-50%) loop is seamless. */}
          {[0, 1].map((pass) => (
            <div key={pass} className="flex gap-10">
              {MARQUEE.map((item) => (
                <span key={`${pass}-${item}`}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpecimenCell({
  label,
  note,
  noteColor,
  last = false,
  children,
}: {
  label: string;
  note: string;
  noteColor?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`px-[22px] pb-[22px] pt-5 ${last ? "" : "lg:border-r"}`}
      style={{ borderColor: "rgba(34,45,82,0.18)" }}
    >
      <div className={`${mono} text-[10px] uppercase tracking-[0.18em]`} style={{ color: C.label }}>
        {label}
      </div>
      {children}
      <div className={`${mono} mt-3 truncate text-[11px] tracking-[0.06em]`} style={{ color: noteColor ?? C.ink }}>
        {note}
      </div>
    </div>
  );
}

// Same measured-not-claimed treatment as the hero below: the comp hardcodes
// 13.0:1 / AAA, but the number here is computed from the colours actually
// shown, so the "verified, not claimed" note stays true.
function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(clean.slice(i, i + 2), 16) / 255)
    .map((s) => (s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatioValue(a: string, b: string): number {
  const x = relativeLuminance(a);
  const y = relativeLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function wcagLabel(ratio: number): string {
  return ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "FAIL";
}
