/**
 * StudioBuilder — the manual builder's token editor + live preview,
 * embedded in app/studio/page.tsx. Styled to match the Studio.dc.html
 * design pulled from claude.ai/design (project "Website redesign
 * request"): a 5-token palette (accent/support/surface/ink/muted), a
 * display/body font pair, corner radius, and density, all driving a live
 * mock landing page preview via CSS custom properties, plus an export
 * drawer that formats the tokens as CSS/Tailwind/JSON/SwiftUI/Figma.
 *
 * Replaces the old StudioCanvas.tsx stub — a different, unfinished
 * "pick arbitrary colors + assign roles" model that never shipped and
 * doesn't match this design's much simpler, more opinionated token set.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExportDrawer } from "./ExportDrawer";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { cn } from "@/lib/utils";

const FONTS = [
  "Fraunces",
  "Playfair Display",
  "Cormorant Garamond",
  "Source Serif 4",
  "Archivo",
  "Inter",
  "Manrope",
  "DM Sans",
  "Work Sans",
  "Space Grotesk",
  "Sora",
  "Unbounded",
];

const PALETTES = [
  { name: "Studio Navy", accent: "#222D52", support: "#C36B3E", surface: "#F5F1E8", ink: "#211E18" },
  { name: "Emerald", accent: "#1F5C41", support: "#C9A96E", surface: "#F4F2EC", ink: "#1C2B24" },
  { name: "Punch", accent: "#E63946", support: "#2540C6", surface: "#F4F2EE", ink: "#16141A" },
  { name: "Midnight", accent: "#8B5CF6", support: "#22D3EE", surface: "#121022", ink: "#E6E1F5" },
  { name: "Terracotta", accent: "#B65735", support: "#4E7147", surface: "#F7EFE6", ink: "#38291F" },
  { name: "Mono", accent: "#3C3C36", support: "#8A8477", surface: "#F6F6F4", ink: "#1F1F1E" },
] as const;

const PAIRS = [
  { label: "Editorial", head: "Fraunces", body: "Archivo" },
  { label: "Luxe", head: "Playfair Display", body: "Manrope" },
  { label: "Techno", head: "Space Grotesk", body: "Inter" },
  { label: "Bold", head: "Unbounded", body: "DM Sans" },
] as const;

const DENSITIES = {
  Compact: { pad: 18, gap: 12 },
  Cozy: { pad: 30, gap: 18 },
  Airy: { pad: 46, gap: 30 },
} as const;
type Density = keyof typeof DENSITIES;

const RADII = [2, 6, 10, 16, 22];

const ROLES = [
  { key: "accent", label: "Accent", token: "--accent" },
  { key: "support", label: "Support", token: "--support" },
  { key: "surface", label: "Surface", token: "--surface" },
  { key: "ink", label: "Ink / text", token: "--ink" },
  { key: "muted", label: "Muted", token: "--muted" },
] as const;

const FEATURES = [
  { mark: "01", title: "One source", body: "Colour, type and shape live in a single system that everything reads from." },
  { mark: "02", title: "Live everywhere", body: "Change a token once and watch every surface update in real time." },
  { mark: "03", title: "Export ready", body: "Ship to CSS, Tailwind, SwiftUI or Figma in a single click." },
];

const STATS = [
  { n: "6", l: "core tokens" },
  { n: "30", l: "themes" },
  { n: "∞", l: "exports" },
];

function onColor(hex: string): string {
  return getContrastRatio(hex, "#FBF8F2") >= getContrastRatio(hex, "#141110") ? "#FBF8F2" : "#141110";
}

function randomOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type StudioState = {
  name: string;
  mode: "Light" | "Dark";
  accent: string;
  support: string;
  surface: string;
  ink: string;
  muted: string;
  headFont: string;
  bodyFont: string;
  radius: number;
  density: Density;
};

const DEFAULT_STATE: StudioState = {
  name: "Northwind",
  mode: "Light",
  accent: "#222D52",
  support: "#C36B3E",
  surface: "#F5F1E8",
  ink: "#211E18",
  muted: "#8A8477",
  headFont: "Fraunces",
  bodyFont: "Archivo",
  radius: 10,
  density: "Cozy",
};

function seedFromParams(params: URLSearchParams): Partial<StudioState> {
  const seeded: Partial<StudioState> = {};
  (["name", "accent", "support", "surface", "ink", "muted"] as const).forEach((key) => {
    const value = params.get(key);
    if (value) seeded[key] = value;
  });
  const mode = params.get("mode");
  if (mode === "Light" || mode === "Dark") seeded.mode = mode;
  const head = params.get("head");
  if (head) seeded.headFont = head;
  const body = params.get("body");
  if (body) seeded.bodyFont = body;
  const radius = params.get("radius");
  if (radius) seeded.radius = parseInt(radius, 10) || DEFAULT_STATE.radius;
  return seeded;
}

export function StudioBuilder() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<StudioState>(() => ({ ...DEFAULT_STATE, ...seedFromParams(searchParams) }));
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const families = [state.headFont, state.bodyFont]
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    const id = "studio-preview-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [state.headFont, state.bodyFont]);

  const density = DENSITIES[state.density];
  const domain = `${state.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

  const previewVars = useMemo(
    () =>
      ({
        "--accent": state.accent,
        "--support": state.support,
        "--surface": state.surface,
        "--ink": state.ink,
        "--muted": state.muted,
        "--on-accent": onColor(state.accent),
        "--head": `'${state.headFont}', serif`,
        "--body": `'${state.bodyFont}', sans-serif`,
        "--r": `${state.radius}px`,
        "--pad": `${density.pad}px`,
        "--gap": `${density.gap}px`,
      }) as React.CSSProperties,
    [state, density]
  );

  function set<K extends keyof StudioState>(key: K, value: StudioState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function applyPalette(p: (typeof PALETTES)[number]) {
    setState((s) => ({
      ...s,
      accent: p.accent,
      support: p.support,
      surface: p.surface,
      ink: p.ink,
      muted: onColor(p.surface) === "#141110" ? "#8A8477" : "#9A93B0",
      mode: onColor(p.surface) === "#141110" ? "Light" : "Dark",
    }));
  }

  function shuffle() {
    const p = randomOf(PALETTES);
    const pair = randomOf(PAIRS);
    applyPalette(p);
    setState((s) => ({ ...s, headFont: pair.head, bodyFont: pair.body, radius: randomOf(RADII) }));
  }

  return (
    <div className="min-h-screen bg-[#EDE6DA] font-grotesk text-[#211E18]">
      <div className="sticky top-14 z-40 flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.18] bg-[#EDE6DA]/[0.94] px-6 py-3.5 backdrop-blur-md sm:px-12">
        <div className="font-mono-plex text-[11px] uppercase tracking-[0.18em] text-[#8A8477]">
          The Studio — {state.name}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={shuffle}
            className="rounded-full border border-black/30 px-4 py-2 font-mono-plex text-[11px] uppercase tracking-[0.12em] text-[#211E18]"
          >
            Shuffle
          </button>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="rounded-full bg-[#222D52] px-[22px] py-2.5 text-[13px] tracking-[0.02em] text-[#F2EBE0]"
          >
            Export ↓
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[376px_1fr]">
        <aside className="flex flex-col gap-[30px] border-b border-black/[0.18] bg-[#F2EBE0] px-6 py-6 lg:sticky lg:top-[105px] lg:max-h-[calc(100vh-105px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div>
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#8A8477]">The Studio</div>
            <h1 className="mt-2 font-editorial-serif text-[34px] font-normal leading-[1.02] tracking-[-0.02em]">
              Compose your system.
            </h1>
            <p className="mt-2.5 text-[13px] leading-relaxed text-[#6E675C]">
              Tune every token on the left. The preview on the right is your system, live.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Identity</div>
            <input
              value={state.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-lg border border-black/20 bg-white px-[13px] py-[11px] font-editorial-serif text-lg text-[#211E18]"
            />
            <div className="flex gap-2">
              {(["Light", "Dark"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("mode", m)}
                  className={cn(
                    "flex-1 rounded-lg border py-[9px] font-mono-plex text-[10px] uppercase tracking-[0.14em]",
                    state.mode === m ? "border-[#211E18] bg-[#211E18] text-[#F2EBE0]" : "border-black/[0.16] bg-white text-[#6E675C]"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Palette</div>
            {ROLES.map((r) => (
              <label key={r.key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={state[r.key]}
                  onChange={(e) => set(r.key, e.target.value)}
                  className="studio-color-input h-10 w-10 flex-none rounded-lg shadow-[0_0_0_1px_rgba(33,30,24,0.14)]"
                />
                <div className="flex flex-1 flex-col">
                  <span className="text-[13px] text-[#211E18]">{r.label}</span>
                  <span className="font-mono-plex text-[11px] uppercase text-[#8A8477]">{state[r.key]}</span>
                </div>
                <span className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#B4AD9E]">{r.token}</span>
              </label>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              {PALETTES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  title={p.name}
                  onClick={() => applyPalette(p)}
                  className="flex h-[22px] overflow-hidden rounded-md border border-black/[0.16]"
                >
                  <span className="w-3.5" style={{ backgroundColor: p.accent }} />
                  <span className="w-3.5" style={{ backgroundColor: p.support }} />
                  <span className="w-3.5" style={{ backgroundColor: p.surface }} />
                  <span className="w-3.5" style={{ backgroundColor: p.ink }} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Typography</div>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#B4AD9E]">Display</span>
              <select
                value={state.headFont}
                onChange={(e) => set("headFont", e.target.value)}
                className="rounded-lg border border-black/20 bg-white px-3 py-2.5 text-sm text-[#211E18]"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#B4AD9E]">Body</span>
              <select
                value={state.bodyFont}
                onChange={(e) => set("bodyFont", e.target.value)}
                className="rounded-lg border border-black/20 bg-white px-3 py-2.5 text-sm text-[#211E18]"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {PAIRS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, headFont: p.head, bodyFont: p.body }))}
                  className="rounded-full border border-black/[0.16] bg-white px-3 py-1.5 text-[11px] text-[#6E675C]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Shape &amp; density</div>
            <label className="flex flex-col gap-2">
              <span className="flex justify-between text-xs text-[#6E675C]">
                <span>Corner radius</span>
                <span className="font-mono-plex text-[#211E18]">{state.radius}px</span>
              </span>
              <input
                type="range"
                min={0}
                max={28}
                step={1}
                value={state.radius}
                onChange={(e) => set("radius", Number(e.target.value))}
                className="studio-range w-full"
              />
            </label>
            <div className="flex gap-2">
              {(Object.keys(DENSITIES) as Density[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("density", d)}
                  className={cn(
                    "flex-1 rounded-lg border py-[9px] font-mono-plex text-[10px] uppercase tracking-[0.1em]",
                    state.density === d ? "border-[#211E18] bg-[#211E18] text-[#F2EBE0]" : "border-black/[0.16] bg-white text-[#6E675C]"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main
          className="relative overflow-hidden"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #E7DFD1, #E7DFD1 1px, #EDE6DA 1px, #EDE6DA 11px)",
          }}
        >
          <div className="flex items-center justify-between px-6 py-3.5 font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477] sm:px-8">
            <span>Live preview</span>
            <span>
              {state.name} · {state.mode} · {state.headFont} + {state.bodyFont}
            </span>
          </div>

          <div className="px-6 pb-10 sm:px-8">
            <div
              style={previewVars}
              className="overflow-hidden rounded-[14px] border border-black/[0.08] shadow-[0_30px_70px_-30px_rgba(20,17,12,0.5)]"
            >
              <div
                className="flex items-center gap-[7px] border-b px-4 py-3"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--ink) 5%, var(--surface))",
                  borderColor: "color-mix(in srgb, var(--ink) 10%, transparent)",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-[11px] w-[11px] rounded-full"
                    style={{ backgroundColor: "color-mix(in srgb, var(--ink) 22%, transparent)" }}
                  />
                ))}
                <span
                  className="ml-3 text-[11px]"
                  style={{ fontFamily: "var(--body)", color: "color-mix(in srgb, var(--ink) 55%, transparent)" }}
                >
                  {domain}
                </span>
              </div>

              <nav
                className="flex items-center justify-between"
                style={{ backgroundColor: "var(--surface)", color: "var(--ink)", padding: "20px var(--pad)" }}
              >
                <span style={{ fontFamily: "var(--head)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.01em" }}>
                  {state.name}
                </span>
                <div className="flex items-center gap-[22px]" style={{ fontFamily: "var(--body)", fontSize: 13 }}>
                  <span style={{ opacity: 0.7 }}>Product</span>
                  <span style={{ opacity: 0.7 }}>Pricing</span>
                  <span style={{ opacity: 0.7 }}>Docs</span>
                  <span
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--on-accent)",
                      padding: "9px 18px",
                      borderRadius: "var(--r)",
                      fontWeight: 600,
                    }}
                  >
                    Get started
                  </span>
                </div>
              </nav>

              <section
                className="flex flex-col items-center gap-5 text-center"
                style={{ backgroundColor: "var(--surface)", color: "var(--ink)", padding: "calc(var(--pad) + 14px) var(--pad)" }}
              >
                <span
                  className="rounded-full text-[11px] uppercase tracking-[0.16em]"
                  style={{
                    fontFamily: "var(--body)",
                    color: "var(--support)",
                    border: "1px solid color-mix(in srgb, var(--support) 45%, transparent)",
                    padding: "6px 14px",
                  }}
                >
                  Now in early access
                </span>
                <h2
                  className="text-balance"
                  style={{
                    fontFamily: "var(--head)",
                    fontWeight: 700,
                    fontSize: "clamp(38px,4.6vw,64px)",
                    lineHeight: 1.02,
                    letterSpacing: "-0.025em",
                    margin: 0,
                    maxWidth: "14ch",
                  }}
                >
                  Design that ships <span style={{ color: "var(--accent)" }}>itself</span>.
                </h2>
                <p
                  className="text-pretty"
                  style={{
                    fontFamily: "var(--body)",
                    fontSize: 16,
                    lineHeight: 1.6,
                    margin: 0,
                    maxWidth: "48ch",
                    color: "color-mix(in srgb, var(--ink) 72%, transparent)",
                  }}
                >
                  One source of truth for colour, type and shape — exported to every surface your team builds on.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <span
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--on-accent)",
                      padding: "13px 26px",
                      borderRadius: "var(--r)",
                      fontFamily: "var(--body)",
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                  >
                    Start building
                  </span>
                  <span
                    style={{
                      border: "1px solid color-mix(in srgb, var(--ink) 30%, transparent)",
                      color: "var(--ink)",
                      padding: "12px 24px",
                      borderRadius: "var(--r)",
                      fontFamily: "var(--body)",
                      fontSize: 15,
                    }}
                  >
                    Watch demo
                  </span>
                </div>
              </section>

              <section
                className="grid grid-cols-1 sm:grid-cols-3"
                style={{ backgroundColor: "var(--surface)", padding: "var(--pad)", paddingTop: 8, gap: "var(--gap)" }}
              >
                {FEATURES.map((f) => (
                  <div
                    key={f.mark}
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--ink) 4%, var(--surface))",
                      border: "1px solid color-mix(in srgb, var(--ink) 9%, transparent)",
                      borderRadius: "var(--r)",
                      padding: 22,
                      color: "var(--ink)",
                    }}
                  >
                    <span
                      className="inline-flex items-center justify-center"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "calc(var(--r) * 0.7)",
                        backgroundColor: "color-mix(in srgb, var(--accent) 16%, transparent)",
                        color: "var(--accent)",
                        fontFamily: "var(--head)",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {f.mark}
                    </span>
                    <div style={{ fontFamily: "var(--head)", fontWeight: 600, fontSize: 18, margin: "14px 0 6px", letterSpacing: "-0.01em" }}>
                      {f.title}
                    </div>
                    <p style={{ fontFamily: "var(--body)", fontSize: 13, lineHeight: 1.55, margin: 0, color: "color-mix(in srgb, var(--ink) 65%, transparent)" }}>
                      {f.body}
                    </p>
                  </div>
                ))}
              </section>

              <section
                className="flex flex-wrap items-center justify-between gap-6"
                style={{
                  margin: "0 var(--pad) var(--pad)",
                  backgroundColor: "var(--ink)",
                  color: "var(--surface)",
                  borderRadius: "var(--r)",
                  padding: 26,
                }}
              >
                {STATS.map((s) => (
                  <div key={s.l} className="flex flex-col gap-0.5">
                    <span style={{ fontFamily: "var(--head)", fontWeight: 700, fontSize: 40, lineHeight: 1, color: "var(--support)" }}>
                      {s.n}
                    </span>
                    <span style={{ fontFamily: "var(--body)", fontSize: 12, opacity: 0.7 }}>{s.l}</span>
                  </div>
                ))}
                <div className="flex min-w-[240px] flex-1 items-center gap-2">
                  <input
                    placeholder="you@studio.com"
                    style={{
                      flex: 1,
                      border: "1px solid color-mix(in srgb, var(--surface) 30%, transparent)",
                      backgroundColor: "color-mix(in srgb, var(--surface) 8%, transparent)",
                      borderRadius: "var(--r)",
                      padding: "12px 14px",
                      fontFamily: "var(--body)",
                      fontSize: 14,
                      color: "var(--surface)",
                    }}
                  />
                  <span
                    className="whitespace-nowrap"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--on-accent)",
                      padding: "12px 20px",
                      borderRadius: "var(--r)",
                      fontFamily: "var(--body)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Join →
                  </span>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {exportOpen && <ExportDrawer tokens={state} onClose={() => setExportOpen(false)} />}
    </div>
  );
}
