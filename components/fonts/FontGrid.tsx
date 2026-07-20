/**
 * FontGrid — filterable grid of Font cards, each rendered in its own real
 * typeface via GoogleFontsLoader. Used by app/browse/fonts/page.tsx.
 *
 * Ported from Dhanshri's Lovable design ("Design Browse Hub") — see
 * docs/CONTEXT.md for the porting note.
 */
"use client";

import { useMemo, useState } from "react";
import { BrowseHeader } from "@/components/browse/BrowseHeader";
import { SearchBar } from "@/components/browse/SearchBar";
import { FilterDropdown } from "@/components/browse/FilterDropdown";
import { SortDropdown } from "@/components/browse/SortDropdown";
import { EmptyState } from "@/components/browse/EmptyState";
import { FontCard } from "./FontCard";
import { GoogleFontsLoader } from "./GoogleFontsLoader";
import { Font, FontCategory } from "@/types/font";

const CATEGORIES: FontCategory[] = ["sans-serif", "serif", "display", "monospace", "handwriting", "variable"];
const PAGE_SIZE = 48;

export function FontGrid({ fonts }: { fonts: Font[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("__all__");
  const [sort, setSort] = useState<string>("name-asc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const items = useMemo(() => {
    let list = fonts.filter((f) => {
      const q = query.trim().toLowerCase();
      if (q && !`${f.family} ${f.category}`.toLowerCase().includes(q)) return false;
      if (category !== "__all__" && f.category !== category) return false;
      return true;
    });
    list = [...list].sort((a, b) =>
      sort === "name-desc" ? b.family.localeCompare(a.family) : a.family.localeCompare(b.family)
    );
    return list;
  }, [fonts, query, category, sort]);

  // Re-page from the top whenever the filtered set changes, rather than
  // rendering (and font-loading) every match at once — with ~2000 fonts
  // in the library that would blow past the browser's URL length limit
  // for the Google Fonts stylesheet link.
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  function updateQuery(value: string) {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  }

  function updateCategory(value: string) {
    setCategory(value);
    setVisibleCount(PAGE_SIZE);
  }

  function updateSort(value: string) {
    setSort(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="space-y-8">
      <GoogleFontsLoader fonts={visibleItems} />
      <BrowseHeader
        eyebrow="Typography"
        title="Fonts"
        description="Preview real Google Fonts with real weights. Find the voice for your product."
        count={items.length}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <SearchBar value={query} onChange={updateQuery} placeholder="Search fonts..." />
        <div className="flex flex-col gap-3 sm:flex-row">
          <FilterDropdown value={category} onChange={updateCategory} options={CATEGORIES} allLabel="All categories" />
          <SortDropdown
            value={sort}
            onChange={updateSort}
            options={[
              { value: "name-asc", label: "Name A–Z" },
              { value: "name-desc", label: "Name Z–A" },
            ]}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((f) => (
              <FontCard key={f.id} font={f} />
            ))}
          </div>
          {visibleCount < items.length && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-lg border border-neutral-200 px-6 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Load more ({items.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
