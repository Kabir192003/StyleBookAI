/**
 * ColorGrid — the "colour wall": a salon-hung, editorial browse of every
 * shade in the library. Used by app/browse/colors/page.tsx.
 *
 * Styled to match the Colours.dc.html design pulled from claude.ai/design
 * (project "Website redesign request") — full-bleed, cream/ink/navy
 * editorial palette, Fraunces display serif + IBM Plex Mono labels,
 * family tabs and a spectrum/A–Z sort instead of dropdowns.
 */
"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/browse/EmptyState";
import { ColorPlate } from "./ColorPlate";
import { Color, ColorFamily } from "@/types/color";

const PAGE_SIZE = 60;

const FAMILIES: Array<ColorFamily | "all"> = [
  "all",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "brown",
  "neutral",
];

type SortMode = "spectrum" | "az";

// Spectrum: hue order with near-neutral shades (low saturation) pushed to
// the end and sorted darkest-to-lightest, mirroring how a real paint-chip
// wall groups "true" colors before the greys.
function sortColors(list: Color[], mode: SortMode) {
  if (mode === "az") return [...list].sort((a, b) => a.name.localeCompare(b.name));
  return [...list].sort((a, b) => {
    const aNeutral = a.hsl.s < 12;
    const bNeutral = b.hsl.s < 12;
    if (aNeutral !== bNeutral) return aNeutral ? 1 : -1;
    if (aNeutral && bNeutral) return b.hsl.l - a.hsl.l;
    return a.hsl.h - b.hsl.h || a.hsl.l - b.hsl.l;
  });
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
        active ? "border-[#211E18] text-[#211E18]" : "border-transparent text-[#8A8477] hover:text-[#211E18]"
      }`}
    >
      {children}
    </button>
  );
}

export function ColorGrid({ colors }: { colors: Color[] }) {
  const [family, setFamily] = useState<ColorFamily | "all">("all");
  const [sort, setSort] = useState<SortMode>("spectrum");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const items = useMemo(() => {
    const filtered = family === "all" ? colors : colors.filter((c) => c.family === family);
    return sortColors(filtered, sort);
  }, [colors, family, sort]);

  // 871 shades at full tile size is ~200k px of page — rendering them all
  // at once makes the grid janky to scroll. Page like FontGrid does.
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  function selectFamily(f: ColorFamily | "all") {
    setFamily(f);
    setVisibleCount(PAGE_SIZE);
  }

  function selectSort(s: SortMode) {
    setSort(s);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="min-h-screen bg-[#F2EBE0] font-grotesk text-[#211E18]">
      <section className="border-b border-black/[0.18] px-6 pb-11 pt-10 sm:px-12 sm:pt-14">
        <div className="flex items-center justify-between gap-4 font-mono-plex text-[11px] uppercase tracking-[0.22em] text-[#6E675C]">
          <span>The library — {colors.length} shades</span>
          <span>01 / Colours</span>
        </div>
        <h1 className="mt-7 font-editorial-serif text-[clamp(2.75rem,9.5vw,8rem)] font-normal leading-[0.98] tracking-tight">
          The <em className="text-[#222D52] not-italic">colour</em> wall.
        </h1>
        <div className="mt-9 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-md text-[15px] leading-relaxed text-[#555046]">
            Every shade in the house register, hung salon-style. Click any plate to copy its hex and drop it
            straight into your design system.
          </p>
          <span className="font-mono-plex text-[11px] uppercase tracking-[0.2em] text-[#8A8477]">
            {String(items.length).padStart(3, "0")} plates shown
          </span>
        </div>
      </section>

      <div className="sticky top-14 z-40 flex items-center justify-between gap-7 overflow-x-auto border-b border-black/[0.18] bg-[#F2EBE0] px-6 sm:px-12">
        <div className="flex gap-6">
          {FAMILIES.map((f) => (
            <TabButton key={f} active={f === family} onClick={() => selectFamily(f)}>
              {f === "all" ? "All families" : f}
            </TabButton>
          ))}
        </div>
        <div className="flex shrink-0 gap-5">
          <TabButton active={sort === "spectrum"} onClick={() => selectSort("spectrum")}>
            Spectrum
          </TabButton>
          <TabButton active={sort === "az"} onClick={() => selectSort("az")}>
            A–Z
          </TabButton>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-16 sm:px-12">
          <EmptyState />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] border-t border-black/[0.18] sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {visibleItems.map((c, i) => (
              <ColorPlate key={c.id} color={c} index={i + 1} />
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
