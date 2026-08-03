/**
 * FontGrid — the "specimen room": a full-bleed, editorial proof sheet for
 * every typeface in the library. Used by app/browse/fonts/page.tsx.
 *
 * Styled to match the Fonts.dc.html design pulled from claude.ai/design
 * (project "Website redesign request"), same treatment as
 * components/colors/ColorGrid.tsx — cream/ink/navy editorial palette,
 * Fraunces + IBM Plex Mono, category tabs instead of dropdowns, plus a
 * live proof-text input so every face previews the visitor's own line.
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/browse/EmptyState";
import { FavoriteButton } from "@/components/browse/FavoriteButton";
import { ClipboardButton } from "@/components/clipboard/ClipboardButton";
import { GoogleFontsLoader } from "./GoogleFontsLoader";
import { Font, FontCategory } from "@/types/font";

const PAGE_SIZE = 48;
const DEFAULT_PROOF_TEXT = "Style changes everything.";

const CATEGORIES: Array<FontCategory | "all"> = [
  "all",
  "serif",
  "sans-serif",
  "display",
  "monospace",
  "handwriting",
];

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
        active ? "border-[#211E18] text-[#211E18]" : "border-transparent text-[#8A8477] hover:text-[#211E18]"
      }`}
    >
      {children}
    </button>
  );
}

function FontRow({ font, index, proofText }: { font: Font; index: number; proofText: string }) {
  const stack = `'${font.family}', ${
    font.category === "monospace" ? "monospace" : font.category === "serif" ? "serif" : "sans-serif"
  }`;
  return (
    <div className="border-t border-black/[0.14] px-6 py-9 transition-colors hover:bg-[#EBE2D2] sm:px-12">
      <div className="flex flex-wrap items-baseline justify-between gap-5">
        <div className="flex items-baseline gap-5">
          <span className="font-mono-plex text-[10px] tracking-[0.2em] text-[#8A8477]">
            {String(index).padStart(2, "0")}
          </span>
          <Link
            href={`/browse/fonts/${font.id}`}
            className="font-editorial-serif text-lg tracking-tight text-[#211E18] hover:underline"
          >
            {font.family}
          </Link>
          <span className="font-mono-plex text-[10px] uppercase tracking-[0.16em] text-[#8A8477]">
            {font.category}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-plex text-[10px] tracking-[0.14em] text-[#8A8477]">
            {font.variants.join(" · ")}
          </span>
          <ClipboardButton
            target={{ type: "font", item: { id: font.id, family: font.family, category: font.category } }}
            className="text-[#8A8477] hover:bg-black/[0.05] hover:text-[#211E18]"
          />
          <FavoriteButton type="font" id={font.id} className="text-[#8A8477] hover:bg-black/[0.05] hover:text-[#211E18]" />
        </div>
      </div>
      <div
        className="mt-5 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,5vw,4rem)] leading-[1.12] tracking-tight text-[#211E18]"
        style={{ fontFamily: stack }}
      >
        {proofText || DEFAULT_PROOF_TEXT}
      </div>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-6">
        <p className="max-w-[460px] text-[13px] leading-relaxed text-[#6E675C]">{font.note}</p>
        <span className="whitespace-nowrap text-[15px] text-[#8A8477]" style={{ fontFamily: stack }}>
          AaBbCcDdEeFf 0123456789
        </span>
      </div>
    </div>
  );
}

export function FontGrid({ fonts }: { fonts: Font[] }) {
  const [category, setCategory] = useState<FontCategory | "all">("all");
  const [proofText, setProofText] = useState(DEFAULT_PROOF_TEXT);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const items = useMemo(
    () => (category === "all" ? fonts : fonts.filter((f) => f.category === category)),
    [fonts, category]
  );

  // ~2000 fonts at full specimen size is a page hundreds of thousands of
  // pixels tall — page like ColorGrid does for the colour wall.
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  function selectCategory(c: FontCategory | "all") {
    setCategory(c);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="min-h-screen bg-[#F2EBE0] font-grotesk text-[#211E18]">
      <GoogleFontsLoader fonts={visibleItems} />

      <section className="border-b border-black/[0.18] px-6 pb-11 pt-10 sm:px-12 sm:pt-14">
        <div className="flex items-center justify-between gap-4 font-mono-plex text-[11px] uppercase tracking-[0.22em] text-[#6E675C]">
          <span>Typography — {fonts.length} faces</span>
          <span>02 / Fonts</span>
        </div>
        <h1 className="mt-7 font-editorial-serif text-[clamp(2.75rem,9.5vw,8rem)] font-normal leading-[0.98] tracking-tight">
          The <em className="text-[#222D52] not-italic">specimen</em> room.
        </h1>
        <div className="mt-9 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-md text-[15px] leading-relaxed text-[#555046]">
            Real Google Fonts, proofed at full size. Type your own line below and read it in every voice before
            you commit.
          </p>
          <span className="font-mono-plex text-[11px] uppercase tracking-[0.2em] text-[#8A8477]">
            {String(items.length).padStart(2, "0")} faces proofed
          </span>
        </div>
      </section>

      <div className="flex items-baseline gap-7 border-b border-black/[0.18] px-6 py-6 sm:px-12">
        <span className="whitespace-nowrap font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#8A8477]">
          Proof text
        </span>
        <input
          value={proofText}
          onChange={(e) => setProofText(e.target.value)}
          placeholder="Type a line to proof…"
          className="min-w-[200px] flex-1 border-b border-black/[0.35] bg-transparent font-editorial-serif text-xl italic text-[#211E18] outline-none placeholder:text-[#8A8477]"
        />
      </div>

      <div className="sticky top-14 z-40 flex gap-6 overflow-x-auto border-b border-black/[0.18] bg-[#F2EBE0] px-6 sm:px-12">
        {CATEGORIES.map((c) => (
          <TabButton key={c} active={c === category} onClick={() => selectCategory(c)}>
            {c === "all" ? "All categories" : c}
          </TabButton>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-16 sm:px-12">
          <EmptyState />
        </div>
      ) : (
        <>
          <div>
            {visibleItems.map((f, i) => (
              <FontRow key={f.id} font={f} index={i + 1} proofText={proofText} />
            ))}
          </div>
          {visibleCount < items.length && (
            <div className="flex justify-center border-t border-black/[0.18] py-9">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-full border border-black/[0.18] px-6 py-2.5 font-mono-plex text-[11px] uppercase tracking-[0.16em] text-[#494434] transition-colors hover:border-[#211E18] hover:text-[#211E18]"
              >
                Load more ({items.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-9 font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477] sm:px-12">
        <span>© {new Date().getFullYear()} StyleBook</span>
        <span>Colour · Type · Theme — unified</span>
      </footer>
    </div>
  );
}
