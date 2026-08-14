/**
 * The font tray (docs/DESIGN_PLAYGROUND.md §5, §6): the faces available to
 * the experiments, every one of them **rendered in its own typeface**. A tray
 * of family names set in the UI font tells a designer nothing they couldn't
 * get from a text file.
 *
 * Two reuse constraints drive the shape of this file:
 *
 * 1. Loading is `components/fonts/GoogleFontsLoader.tsx`, not a second
 *    loader. It takes `Font[]` and injects one `<link>`, so this component's
 *    job is to hand it the right *subset* — see the cap below.
 * 2. The search is the same shape as the one in `components/fonts/FontGrid.tsx`
 *    (substring over `family`, results paged), because a user who has already
 *    used Browse should not have to learn a second filter.
 *
 * The cap matters: `allFonts` is ~1,950 families. A Google Fonts CSS2 URL
 * naming all of them is hundreds of kilobytes and will be rejected outright,
 * which is why `FontGrid` only ever passes its visible page. Same rule here —
 * tray chips plus the visible slice of search results, nothing more.
 */
"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { GoogleFontsLoader } from "@/components/fonts/GoogleFontsLoader";
import { allFonts } from "@/data/fonts";
import { FONT_BY_FAMILY, previewStack } from "@/lib/playground/fontCatalogue";
import { makeFont } from "@/lib/playground/traySources";
import { useIsFontSelected, useSelectedFontIds, useTraySelectionStore } from "@/lib/playground/traySelectionStore";
import type { PlaygroundFont } from "@/lib/playground/types";
import { usePlaygroundStore } from "@/store/playgroundStore";
import type { Font } from "@/types/font";

const SEARCH_RESULT_LIMIT = 18;

function FontChip({ font }: { font: PlaygroundFont }) {
  const selected = useIsFontSelected(font.id);
  const toggleFont = useTraySelectionStore((s) => s.toggleFont);
  const forgetFont = useTraySelectionStore((s) => s.forgetFont);
  const removeFont = usePlaygroundStore((s) => s.removeFont);

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => toggleFont(font.id)}
        aria-pressed={selected}
        title={`${font.family} · ${font.category}`}
        className={`flex items-baseline gap-2 rounded-full border px-3 py-1 transition-colors ${
          selected ? "border-[#222D52] bg-[#222D52]/[0.08]" : "border-black/[0.14] bg-white/50 hover:border-black/30"
        }`}
      >
        <span className="text-[15px] leading-tight text-[#211E18]" style={{ fontFamily: previewStack(font.family, font.category) }}>
          {font.family}
        </span>
      </button>

      {font.origin !== "system" && (
        <button
          type="button"
          onClick={() => {
            removeFont(font.id);
            forgetFont(font.id);
          }}
          aria-label={`Remove ${font.family} from the tray`}
          className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[#211E18] text-[#F2EBE0] group-hover:flex"
        >
          <X className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function FontTray() {
  const fonts = usePlaygroundStore((s) => s.fonts);
  const addFonts = usePlaygroundStore((s) => s.addFonts);
  const selectedIds = useSelectedFontIds();
  const toggleFont = useTraySelectionStore((s) => s.toggleFont);
  const clearFontSelection = useTraySelectionStore((s) => s.clearFontSelection);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const inTray = useMemo(() => new Set(fonts.map((f) => f.family.toLowerCase())), [fonts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // No query: show a slice of the catalogue rather than nothing, so the
      // panel is browsable and not a dead search box.
      return allFonts.slice(0, SEARCH_RESULT_LIMIT);
    }
    const matches: Font[] = [];
    for (const font of allFonts) {
      if (font.family.toLowerCase().includes(q)) matches.push(font);
      if (matches.length >= SEARCH_RESULT_LIMIT) break;
    }
    return matches;
  }, [query]);

  // Exactly what the loader is allowed to see: the tray's own faces (resolved
  // back to catalogue records for their weight lists) plus whatever the
  // search panel is currently showing.
  const loadable = useMemo(() => {
    const seen = new Set<string>();
    const list: Font[] = [];
    const push = (font?: Font) => {
      if (!font || seen.has(font.family)) return;
      seen.add(font.family);
      list.push(font);
    };
    fonts.forEach((f) => push(FONT_BY_FAMILY.get(f.family.toLowerCase())));
    if (searchOpen) results.forEach(push);
    return list;
  }, [fonts, results, searchOpen]);

  return (
    <section className="min-w-0">
      {/* One <link> covering every face this tray can show. */}
      <GoogleFontsLoader fonts={loadable} />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">
          Typefaces
          <span className="ml-2 text-[#B4AD9E]">{fonts.length}</span>
        </h2>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={clearFontSelection}
            className="font-mono-plex text-[10px] uppercase tracking-[0.12em] text-[#222D52] underline-offset-2 hover:underline"
          >
            {selectedIds.length} selected — clear
          </button>
        )}
        <button
          type="button"
          onClick={() => setSearchOpen((o) => !o)}
          className="font-mono-plex ml-auto inline-flex items-center gap-1.5 rounded-full border border-black/[0.16] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#211E18] hover:bg-black/[0.04]"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Add typeface
        </button>
      </div>

      {searchOpen && (
        <div className="mt-2 max-w-[380px] rounded-xl border border-black/[0.12] bg-[#F7F2E9] p-2.5">
          <div className="flex items-center gap-2 border-b border-black/[0.14] pb-1.5">
            <Search className="h-3 w-3 text-[#8A8477]" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${allFonts.length} families…`}
              className="min-w-0 flex-1 bg-transparent font-mono-plex text-[11px] text-[#211E18] outline-none placeholder:text-[#8A8477]"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close font search"
              className="text-[#8A8477] hover:text-[#211E18]"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>

          <ul className="mt-1.5 max-h-[188px] overflow-y-auto">
            {results.length === 0 ? (
              <li className="px-1 py-2 text-[12px] text-[#8A8477]">No family matches “{query.trim()}”.</li>
            ) : (
              results.map((font) => {
                const already = inTray.has(font.family.toLowerCase());
                return (
                  <li key={font.id}>
                    <button
                      type="button"
                      disabled={already}
                      onClick={() => {
                        const entry = makeFont(font.family, font.category, "custom");
                        addFonts([entry]);
                        toggleFont(entry.id);
                      }}
                      className="flex w-full items-baseline justify-between gap-3 rounded px-1 py-1.5 text-left hover:bg-black/[0.04] disabled:opacity-45 disabled:hover:bg-transparent"
                    >
                      <span
                        className="truncate text-[17px] leading-tight text-[#211E18]"
                        style={{ fontFamily: previewStack(font.family, font.category) }}
                      >
                        {font.family}
                      </span>
                      <span className="font-mono-plex shrink-0 text-[9px] uppercase tracking-[0.12em] text-[#8A8477]">
                        {already ? "in tray" : font.category}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      <div className="mt-2 flex max-h-[92px] flex-wrap gap-1.5 overflow-y-auto pr-1">
        {fonts.length === 0 ? (
          <p className="text-[12px] text-[#8A8477]">No typefaces yet.</p>
        ) : (
          fonts.map((font) => <FontChip key={font.id} font={font} />)
        )}
      </div>
    </section>
  );
}
