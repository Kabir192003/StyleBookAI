/**
 * Font selection across the whole catalogue (~1,950 families), not a curated
 * dozen — the point of clicking a heading is to be able to put *any* face on
 * it.
 *
 * Two constraints shape this:
 *
 * 1. Every family is rendered in its own typeface. A list of family names set
 *    in the UI font tells a designer nothing they could not get from a text
 *    file.
 * 2. Only the visible slice is ever loaded. A Google Fonts CSS2 URL naming
 *    two thousand families is hundreds of kilobytes and gets rejected
 *    outright, which is why `components/fonts/FontGrid.tsx` also passes only
 *    its current page. Same rule here: the current value plus whatever the
 *    filtered list is showing.
 */
"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { GoogleFontsLoader } from "@/components/fonts/GoogleFontsLoader";
import { allFonts } from "@/data/fonts";
import type { Font } from "@/types/font";

const VISIBLE_LIMIT = 40;

/** A stack, not a bare family: an unquoted multi-word family is invalid CSS,
 *  and the generic tail keeps the row readable while the webfont loads. */
function previewStack(font: Font): string {
  const generic = font.category === "serif" || font.category === "display" ? "serif" : font.category === "monospace" ? "monospace" : "sans-serif";
  return `"${font.family}", ${generic}`;
}

export function FontPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (family: string) => void;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches: Font[] = [];
    for (const font of allFonts) {
      if (q && !font.family.toLowerCase().includes(q)) continue;
      matches.push(font);
      if (matches.length >= VISIBLE_LIMIT) break;
    }
    return matches;
  }, [query]);

  // The selected family may be outside the visible slice (a search narrowed
  // past it), and it still has to render in its own face in the header row.
  const loadable = useMemo(() => {
    const current = allFonts.find((f) => f.family === value);
    const seen = new Set(results.map((f) => f.family));
    return current && !seen.has(current.family) ? [current, ...results] : results;
  }, [results, value]);

  return (
    <div>
      <GoogleFontsLoader fonts={loadable} />

      <label className="block text-[11px] text-[#6E675C]">
        {label}
        <span className="mt-1 flex items-center gap-1.5 rounded-md border border-black/[0.16] bg-white px-2 py-1.5">
          <Search className="h-3 w-3 shrink-0 text-[#8A8477]" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${allFonts.length} fonts…`}
            className="min-w-0 flex-1 bg-transparent font-mono-plex text-[11px] text-[#211E18] outline-none placeholder:text-[#8A8477]"
          />
        </span>
      </label>

      <ul className="mt-1.5 max-h-[190px] overflow-y-auto rounded-md border border-black/[0.1] bg-white/60">
        {results.length === 0 ? (
          <li className="px-2 py-3 text-[11px] text-[#8A8477]">No family matches &ldquo;{query.trim()}&rdquo;.</li>
        ) : (
          results.map((font) => {
            const selected = font.family === value;
            return (
              <li key={font.id}>
                <button
                  type="button"
                  onClick={() => onChange(font.family)}
                  className={`flex w-full items-baseline justify-between gap-2 px-2 py-1.5 text-left hover:bg-black/[0.04] ${
                    selected ? "bg-[#222D52]/[0.08]" : ""
                  }`}
                >
                  <span className="truncate text-[15px] leading-tight text-[#211E18]" style={{ fontFamily: previewStack(font) }}>
                    {font.family}
                  </span>
                  {selected ? (
                    <Check className="h-3 w-3 shrink-0 text-[#222D52]" aria-hidden="true" />
                  ) : (
                    <span className="font-mono-plex shrink-0 text-[9px] uppercase tracking-[0.1em] text-[#8A8477]">
                      {font.category}
                    </span>
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
