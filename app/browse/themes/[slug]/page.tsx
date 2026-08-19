// Unlike the other browse pages, this one is a full theme takeover —
// background, ink, and headline type all switch to the theme's own tokens
// instead of the site's fixed cream/ink chrome.
import Link from "next/link";
import { notFound } from "next/navigation";
import { allThemes } from "@/data/themes";
import { GoogleFontsLoader } from "@/components/fonts/GoogleFontsLoader";
import { CopyTokensButton } from "@/components/themes/CopyTokensButton";
import { getContrastRatio, hexToRgb, rgbToHsl } from "@/lib/colors/colorUtils";
import { Theme } from "@/types/theme";

function isDark(hex: string): boolean {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b).l < 50;
}

// Text color for an arbitrary background swatch — same "pick whichever
// candidate has higher contrast" approach as components/colors/ColorPlate.
function onColor(hex: string, light: string, dark: string): string {
  return getContrastRatio(hex, light) >= getContrastRatio(hex, dark) ? light : dark;
}

function splitName(name: string): { main: string; accent: string } {
  const parts = name.split(" ");
  if (parts.length === 1) return { main: "", accent: name };
  return { main: parts.slice(0, -1).join(" "), accent: parts[parts.length - 1] };
}

function fontStack(family: string, category: string) {
  return `'${family}', ${category === "monospace" ? "monospace" : category === "serif" ? "serif" : "sans-serif"}`;
}

const ROLES = ["Accent", "Support", "Neutral", "Muted", "Ink"] as const;
const TOKENS = ["--accent", "--support", "--neutral", "--muted", "--ink"] as const;
const PCTS = ["22%", "14%", "30%", "18%", "16%"] as const;

export default function ThemeDetailPage({ params }: { params: { slug: string } }) {
  const theme = allThemes.find((t) => t.slug === params.slug);
  if (!theme) notFound();

  const index = allThemes.indexOf(theme);
  const prev = allThemes[(index - 1 + allThemes.length) % allThemes.length];
  const next = allThemes[(index + 1) % allThemes.length];

  const p = theme.colorRoles;
  const dark = isDark(p.background);
  const head = fontStack(theme.primaryFont.family, theme.primaryFont.category);
  const body = fontStack(theme.secondaryFont.family, theme.secondaryFont.category);
  const { main, accent } = splitName(theme.name);

  const ink = p.text;
  const bg = p.background;
  const rule = dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)";
  const dim = dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.42)";
  const soft = dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.62)";
  const onC1 = onColor(p.accent, "#FBF8F2", "#141110");

  const swatches = [p.accent, p.secondary, p.surface, p.textMuted, p.text].map((hex, i) => ({
    hex,
    role: ROLES[i],
    token: TOKENS[i],
    pct: PCTS[i],
    txt: onColor(hex, "#FBF8F2", "#141110"),
    divider: isDark(hex) ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)",
  }));

  const tags = [
    { label: "Accent", bg: p.accent, fg: onColor(p.accent, "#FBF8F2", "#141110") },
    { label: "Support", bg: p.secondary, fg: onColor(p.secondary, "#FBF8F2", "#141110") },
    { label: "Neutral", bg: "transparent", fg: ink },
    { label: theme.category, bg: "transparent", fg: ink },
  ];

  const sizes = theme.typeScale.sizes;

  return (
    <div style={{ fontFamily: body, background: bg, color: ink }} className="min-h-screen transition-colors">
      <GoogleFontsLoader fonts={[theme.primaryFont, theme.secondaryFont]} />

      <Link
        href="/browse/themes"
        className="ml-6 mt-6 inline-flex items-center gap-2.5 font-mono-plex text-[11px] uppercase tracking-[0.18em] sm:ml-12"
        style={{ color: dim }}
      >
        ← Back to newsstand
      </Link>

      <section className="relative overflow-hidden px-6 pb-16 pt-11 sm:px-12">
        <div
          className="pointer-events-none absolute -right-[3%] -top-[16%] select-none text-[min(46vw,640px)] font-bold leading-[0.7] opacity-[0.05]"
          style={{ fontFamily: head, color: ink }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
        <div
          className="relative flex justify-between gap-3.5 font-mono-plex text-[11px] uppercase tracking-[0.22em]"
          style={{ color: dim }}
        >
          <span>
            Edition {String(index + 1).padStart(2, "0")} — {theme.category}
          </span>
          <span>
            {dark ? "Dark" : "Light"} · {Object.keys(theme.colorRoles).length} tokens
          </span>
        </div>
        <h1
          className="relative mt-6 text-balance text-[clamp(4rem,11vw,10.5rem)] font-bold leading-[0.92] tracking-[-0.025em]"
          style={{ fontFamily: head }}
        >
          {main} <span style={{ color: p.accent }}>{accent}</span>
        </h1>
        <div className="relative mt-8 flex flex-wrap items-end justify-between gap-7">
          <p className="max-w-[520px] text-lg leading-relaxed" style={{ color: soft }}>
            {theme.description}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/studio?${new URLSearchParams({
                name: theme.name,
                mode: dark ? "Dark" : "Light",
                accent: p.accent,
                support: p.secondary,
                surface: p.surface,
                ink: p.text,
                muted: p.textMuted,
                head: theme.primaryFont.family,
                body: theme.secondaryFont.family,
              }).toString()}`}
              className="cursor-pointer rounded-[4px] px-[26px] py-[13px] text-sm"
              style={{ backgroundColor: p.accent, color: onC1 }}
            >
              Apply this edition
            </Link>
            <CopyTokensButton theme={theme} ink={ink} />
          </div>
        </div>
      </section>

      <section className="border-t" style={{ borderColor: rule }}>
        <div
          className="flex justify-between gap-3.5 px-6 pt-5 font-mono-plex text-[11px] uppercase tracking-[0.22em] sm:px-12"
          style={{ color: dim }}
        >
          <span>01 — Palette</span>
          <span>Roles &amp; contrast</span>
        </div>

        {/* "Token" gets used all over this page (header count, Copy tokens
            button, under every swatch) without ever being defined, so spell
            it out once here. */}
        <p className="max-w-[640px] px-6 pt-4 text-[13px] leading-relaxed sm:px-12" style={{ color: soft }}>
          <strong style={{ color: ink, fontWeight: 600 }}>What&apos;s a token?</strong> A named slot in the
          palette: <span className="font-mono-plex">{TOKENS[0]}</span> means &ldquo;this theme&apos;s accent
          colour&rdquo; rather than one fixed hex. Name the slot once, swap the colour behind it later, and
          everything using it follows.{" "}
          {/* Counts here are what CopyTokensButton actually writes (all 7
              colour roles + 2 fonts), not the 5 swatches shown below —
              those are just the ones worth a full-bleed tile. */}
          <strong style={{ color: ink, fontWeight: 600 }}>Copy tokens</strong> puts every one of this
          theme&apos;s colour slots, plus its heading and body fonts, on your clipboard as CSS variables —
          ready to paste straight into a stylesheet.
        </p>

        <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {swatches.map((s) => (
            <div
              key={s.token}
              className="flex min-h-[280px] flex-col justify-between border-r border-t p-6"
              style={{ backgroundColor: s.hex, color: s.txt, borderColor: s.divider }}
            >
              <div className="flex justify-between font-mono-plex text-[10px] uppercase tracking-[0.18em] opacity-75">
                <span>{s.role}</span>
                <span>{s.pct}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[34px] leading-[0.9]" style={{ fontFamily: head }}>
                  Aa
                </span>
                <span className="mt-2 font-mono-plex text-[13px] tracking-[0.04em]">{s.hex}</span>
                <span className="font-mono-plex text-[10px] uppercase tracking-[0.14em] opacity-70">{s.token}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] border-t" style={{ borderColor: rule }}>
        <div className="border-r px-6 py-8 sm:px-12" style={{ borderColor: rule }}>
          <div className="flex justify-between gap-3.5 font-mono-plex text-[11px] uppercase tracking-[0.22em]" style={{ color: dim }}>
            <span>02 — Typography</span>
            <span>
              {theme.primaryFont.family} · {theme.secondaryFont.family}
            </span>
          </div>
          <div className="mt-8 border-b pb-3" style={{ borderColor: rule }}>
            <div className="text-[88px] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: head }}>
              Ag
            </div>
            <div className="mt-2 font-mono-plex text-[10px] uppercase tracking-[0.16em]" style={{ color: dim }}>
              Display — {theme.primaryFont.family}
            </div>
          </div>
          <div className="mt-6 text-[38px] leading-[1.05] tracking-[-0.015em]" style={{ fontFamily: head }}>
            The quick brown fox jumps over the lazy dog
          </div>
          <p className="mt-5 text-base leading-[1.7] text-pretty" style={{ fontFamily: body, color: soft }}>
            Body copy set in {theme.secondaryFont.family}. A design system is only as trustworthy as its dullest
            paragraph — so the body face carries the weight of everything that isn&apos;t a headline, and this
            edition keeps it comfortable at reading size.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 font-mono-plex text-[11px] tracking-[0.1em]" style={{ color: dim }}>
            <span>H1 {Math.round(sizes["4xl"])}px</span>
            <span>H2 {Math.round(sizes["2xl"])}px</span>
            <span>Body {Math.round(sizes.base)}px</span>
            <span>Caption {Math.round(sizes.xs)}px</span>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-12">
          <div className="font-mono-plex text-[11px] uppercase tracking-[0.22em]" style={{ color: dim }}>
            03 — Components
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="cursor-pointer rounded-[4px] px-6 py-3 text-sm" style={{ backgroundColor: p.accent, color: onC1 }}>
              Primary
            </span>
            <span className="cursor-pointer rounded-[4px] border px-[22px] py-[11px] text-sm" style={{ borderColor: ink, color: ink }}>
              Secondary
            </span>
            <span
              className="cursor-pointer px-1 py-[11px] text-sm underline underline-offset-4"
              style={{ color: p.accent }}
            >
              Text link →
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tg) => (
              <span
                key={tg.label}
                className="rounded-full px-3.5 py-1.5 font-mono-plex text-[10px] uppercase tracking-[0.14em]"
                style={{
                  backgroundColor: tg.bg,
                  color: tg.fg,
                  border: tg.bg === "transparent" ? `1px solid ${rule}` : undefined,
                }}
              >
                {tg.label}
              </span>
            ))}
          </div>
          <div
            className="mt-6 flex items-center justify-between rounded-lg border px-4 py-3.5"
            style={{ borderColor: rule, backgroundColor: p.surface }}
          >
            <span className="text-sm" style={{ fontFamily: body, color: dim }}>
              you@studio.com
            </span>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.secondary }} />
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: rule, backgroundColor: p.surface }}>
            <div className="h-2" style={{ backgroundColor: p.accent }} />
            <div className="p-5">
              <div className="text-2xl leading-[1.1] tracking-[-0.01em]" style={{ fontFamily: head }}>
                Sample card
              </div>
              <p className="mb-4 mt-2.5 text-sm leading-relaxed text-pretty" style={{ fontFamily: body, color: soft }}>
                A surface built from the theme&apos;s neutrals, with an accent header bar and matched radius.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: p.accent }} />
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: p.secondary }} />
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: p.textMuted }} />
                </div>
                <span className="font-mono-plex text-[10px] uppercase tracking-[0.16em]" style={{ color: dim }}>
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="grid grid-cols-1 border-t sm:grid-cols-2" style={{ borderColor: rule }}>
        <Link href={`/browse/themes/${prev.slug}`} className="border-b px-6 py-7 sm:border-b-0 sm:border-r sm:px-12" style={{ borderColor: rule }}>
          <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em]" style={{ color: dim }}>
            ← Previous edition
          </div>
          <div className="mt-2 text-2xl tracking-[-0.01em]" style={{ fontFamily: head }}>
            {prev.name}
          </div>
        </Link>
        <Link href={`/browse/themes/${next.slug}`} className="px-6 py-7 text-right sm:px-12">
          <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em]" style={{ color: dim }}>
            Next edition →
          </div>
          <div className="mt-2 text-2xl tracking-[-0.01em]" style={{ fontFamily: head }}>
            {next.name}
          </div>
        </Link>
      </nav>

      <footer
        className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-9 font-mono-plex text-[10px] uppercase tracking-[0.2em] sm:px-12"
        style={{ borderColor: rule, color: dim }}
      >
        <span>© {new Date().getFullYear()} StyleBook</span>
        <span>
          {theme.name} — {dark ? "Dark" : "Light"}
        </span>
      </footer>
    </div>
  );
}
