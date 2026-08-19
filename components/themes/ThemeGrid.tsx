// "The newsstand" — a masonry wall of complete theme editions, each cover
// set in its own palette and fonts, plus an editor's-pick spotlight for
// the first match. Used by app/browse/themes/page.tsx, same editorial
// treatment as ColorGrid and FontGrid.
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/browse/EmptyState";
import { FavoriteButton } from "@/components/browse/FavoriteButton";
import { Theme, ThemeCategory } from "@/types/theme";
import { hexToRgb, rgbToHsl } from "@/lib/colors/colorUtils";

const CATEGORIES: Array<ThemeCategory | "all"> = [
  "all",
  "minimal",
  "bold",
  "luxury",
  "playful",
  "earthy",
  "tech",
  "elegant",
  "retro",
  "neon",
  "coastal",
  "editorial",
  "brutalist",
];

// Cycled per card to give the masonry columns the design's staggered,
// newsstand-cover feel instead of a uniform grid of equal-height tiles.
const HEIGHTS = [432, 356, 500, 396, 540, 372, 464];

function isDark(hex: string): boolean {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b).l < 50;
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function splitName(name: string): { main: string; accent: string } {
  const parts = name.split(" ");
  if (parts.length === 1) return { main: "", accent: name };
  return { main: parts.slice(0, -1).join(" "), accent: parts[parts.length - 1] };
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap border-b-2 py-4 font-mono-plex text-[11px] uppercase tracking-[0.16em] transition-colors ${
        active ? "border-[#211E18] text-[#211E18]" : "border-transparent text-[#6E675C] hover:text-[#211E18]"
      }`}
    >
      {children}
    </button>
  );
}

function Spotlight({ theme, index }: { theme: Theme; index: number }) {
  const p = theme.colorRoles;
  const dark = isDark(p.background);
  const { main, accent } = splitName(theme.name);
  const rule = dark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.16)";
  const btnText = luminance(p.primary) > 0.6 ? p.text : p.background;
  const bars = [
    { hex: p.primary, role: "Primary" },
    { hex: p.secondary, role: "Secondary" },
    { hex: p.accent, role: "Accent" },
    { hex: p.surface, role: "Surface" },
    { hex: p.text, role: "Ink" },
  ];

  return (
    <section
      className="relative overflow-hidden border-b border-black/[0.18]"
      style={{ backgroundColor: p.background, color: p.text }}
    >
      <div
        className="pointer-events-none absolute -right-[2%] -top-[14%] select-none text-[min(52vw,720px)] font-bold leading-[0.7] opacity-[0.05]"
        style={{ fontFamily: `'${theme.primaryFont.family}'`, color: p.text }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <FavoriteButton
        type="theme"
        id={theme.id}
        className="absolute right-4 top-16 z-10 border border-black/[0.14] bg-black/[0.06] opacity-90 backdrop-blur-sm sm:top-4"
        style={{ color: p.text }}
      />
      <div className="relative grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
        <div className="flex flex-col gap-6 border-r px-6 py-12 sm:px-12" style={{ borderColor: rule }}>
          <div className="flex justify-between gap-3.5 font-mono-plex text-[10px] uppercase tracking-[0.24em] opacity-70">
            <span>Editor&apos;s pick — {theme.category}</span>
            <span>
              {String(index + 1).padStart(2, "0")} / {dark ? "Dark" : "Light"}
            </span>
          </div>
          <div>
            <div
              className="text-balance text-[clamp(3.25rem,7vw,6.5rem)] leading-[0.94] tracking-tight"
              style={{ fontFamily: `'${theme.primaryFont.family}'` }}
            >
              {main} <span style={{ color: p.primary }}>{accent}</span>
            </div>
            <div
              className="mt-3.5 text-xl italic opacity-75"
              style={{ fontFamily: `'${theme.primaryFont.family}'` }}
            >
              {dark ? "Dark" : "Light"} · {theme.category} edition
            </div>
          </div>
          <p className="max-w-[440px] text-base leading-relaxed opacity-[0.82]">{theme.description}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/browse/themes/${theme.slug}`}
              className="rounded-sm px-6 py-3 text-[13px] tracking-[0.02em]"
              style={{ backgroundColor: p.primary, color: btnText }}
            >
              Open this edition
            </Link>
            <span
              className="rounded-sm border px-[22px] py-[11px] text-[13px] tracking-[0.02em]"
              style={{ borderColor: p.text, color: p.text }}
            >
              {Object.keys(theme.colorRoles).length} tokens
            </span>
          </div>
          <div className="mt-1.5 flex items-end gap-5 border-t pt-5" style={{ borderColor: rule }}>
            <span
              className="text-[64px] leading-[0.8] tracking-tight"
              style={{ fontFamily: `'${theme.primaryFont.family}'` }}
            >
              Aa
            </span>
            <div className="flex flex-col gap-1 pb-1.5 font-mono-plex text-[10px] uppercase tracking-[0.16em] opacity-70">
              <span>
                {theme.primaryFont.family} · {theme.secondaryFont.family}
              </span>
              <span>Display / body pairing</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          {bars.map((b) => (
            <div
              key={b.role}
              className="flex min-h-[76px] flex-1 items-center justify-between px-6"
              style={{ backgroundColor: b.hex, color: luminance(b.hex) > 0.6 ? "rgba(20,17,12,0.85)" : "rgba(250,246,238,0.92)" }}
            >
              <span className="font-mono-plex text-[11px] tracking-[0.06em]">{b.hex}</span>
              <span className="font-mono-plex text-[10px] uppercase tracking-[0.2em] opacity-75">{b.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ThemeTile({ theme, index }: { theme: Theme; index: number }) {
  const p = theme.colorRoles;
  const dark = isDark(p.background);
  const { main, accent } = splitName(theme.name);
  const edge = dark ? "rgba(255,255,255,0.14)" : "rgba(33,30,24,0.16)";
  const chipEdge = dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.15)";
  const rule = dark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.16)";
  const height = HEIGHTS[index % HEIGHTS.length];
  const dots = [p.primary, p.secondary, p.accent, p.surface, p.text];

  return (
    <Link
      href={`/browse/themes/${theme.slug}`}
      className="relative mb-[22px] flex flex-col overflow-hidden break-inside-avoid border p-6 shadow-[0_1px_0_rgba(33,30,24,0.05)] transition-[filter] hover:brightness-[0.97]"
      style={{ backgroundColor: p.background, color: p.text, borderColor: edge, height }}
    >
      <div
        className="pointer-events-none absolute -bottom-[8%] -right-[4%] select-none text-[210px] font-bold leading-[0.7] opacity-[0.06]"
        style={{ fontFamily: `'${theme.primaryFont.family}'`, color: p.text }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <FavoriteButton
        type="theme"
        id={theme.id}
        className="absolute right-3 top-3 z-10 border border-black/[0.14] bg-black/[0.06] opacity-90 backdrop-blur-sm"
        style={{ color: p.text }}
      />
      <div className="relative flex justify-between gap-3.5 font-mono-plex text-[10px] uppercase tracking-[0.2em] opacity-[0.72]">
        <span>StyleBook · {theme.category}</span>
        <span>{dark ? "Dark" : "Light"}</span>
      </div>
      <div className={`relative flex flex-1 flex-col justify-center py-6 ${index % 2 === 0 ? "!justify-start" : "!justify-end"}`}>
        <div className="mb-3 font-mono-plex text-[10px] uppercase tracking-[0.22em] opacity-60">
          Edition {String(index + 1).padStart(2, "0")}
        </div>
        <div
          className="text-balance text-[46px] leading-none tracking-[-0.015em]"
          style={{ fontFamily: `'${theme.primaryFont.family}'` }}
        >
          {main} <span style={{ color: p.primary }}>{accent}</span>
        </div>
      </div>
      <div className="relative mb-[18px] flex gap-2">
        {dots.map((c, i) => (
          <span
            key={i}
            className="h-6 w-6 rounded-full border"
            style={{ backgroundColor: c, borderColor: i === dots.length - 1 ? chipEdge : chipEdge }}
          />
        ))}
      </div>
      <div className="relative flex items-baseline justify-between gap-3.5 border-t pt-3.5" style={{ borderColor: rule }}>
        <span className="font-mono-plex text-[10px] uppercase tracking-[0.14em] opacity-[0.72]">
          {theme.primaryFont.family} · {theme.secondaryFont.family}
        </span>
        <span className="font-mono-plex text-[10px] opacity-[0.72]">{Object.keys(theme.colorRoles).length} tokens</span>
      </div>
    </Link>
  );
}

export function ThemeGrid({ themes }: { themes: Theme[] }) {
  const [category, setCategory] = useState<ThemeCategory | "all">("all");

  const items = useMemo(
    () => (category === "all" ? themes : themes.filter((t) => t.category === category)),
    [themes, category]
  );

  const spotlight = items[0];
  const rest = spotlight ? items.slice(1) : [];

  return (
    <div className="min-h-screen bg-[#F2EBE0] font-grotesk text-[#211E18]">
      <section className="border-b border-black/[0.18] px-6 pb-11 pt-10 sm:px-12 sm:pt-14">
        <div className="flex items-center justify-between gap-4 font-mono-plex text-[11px] uppercase tracking-[0.22em] text-[#6E675C]">
          <span>Themes — {themes.length} editions</span>
          <span>03 / Themes</span>
        </div>
        <h1 className="mt-7 font-editorial-serif text-[clamp(2.75rem,9.5vw,8rem)] font-normal leading-[0.98] tracking-tight">
          The <em className="text-[#222D52] not-italic">newsstand</em>.
        </h1>
        <div className="mt-9 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-[440px] text-[15px] leading-relaxed text-[#555046]">
            Every look is a complete edition — palette, pairing, and type scale bound together. Each cover below
            is set in its own theme, so you&apos;re reading the design before you ever open it.
          </p>
          <span className="font-mono-plex text-[11px] uppercase tracking-[0.2em] text-[#6E675C]">
            {String(items.length).padStart(2, "0")} editions shown
          </span>
        </div>
      </section>

      <div className="sticky top-14 z-40 flex gap-6 overflow-x-auto border-b border-black/[0.18] bg-[#F2EBE0] px-6 sm:px-12">
        {CATEGORIES.map((c) => (
          <TabButton key={c} active={c === category} onClick={() => setCategory(c)}>
            {c === "all" ? "All editions" : c}
          </TabButton>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-16 sm:px-12">
          <EmptyState />
        </div>
      ) : (
        <>
          {spotlight && <Spotlight theme={spotlight} index={themes.indexOf(spotlight)} />}
          <div className="px-6 py-10 sm:px-12 [column-gap:22px] [columns:320px]">
            {rest.map((t) => (
              <ThemeTile key={t.id} theme={t} index={themes.indexOf(t)} />
            ))}
          </div>
        </>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.18] px-6 py-9 font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C] sm:px-12">
        <span>© {new Date().getFullYear()} StyleBook</span>
        <span>Colour · Type · Theme — unified</span>
      </footer>
    </div>
  );
}
