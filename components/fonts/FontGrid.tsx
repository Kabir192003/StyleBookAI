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

export function FontGrid({ fonts }: { fonts: Font[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("__all__");
  const [sort, setSort] = useState<string>("name-asc");

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

  return (
    <div className="space-y-8">
      <GoogleFontsLoader fonts={items} />
      <BrowseHeader
        eyebrow="Typography"
        title="Fonts"
        description="Preview real Google Fonts with real weights. Find the voice for your product."
        count={items.length}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <SearchBar value={query} onChange={setQuery} placeholder="Search fonts..." />
        <div className="flex flex-col gap-3 sm:flex-row">
          <FilterDropdown value={category} onChange={setCategory} options={CATEGORIES} allLabel="All categories" />
          <SortDropdown
            value={sort}
            onChange={setSort}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((f) => (
            <FontCard key={f.id} font={f} />
          ))}
        </div>
      )}
    </div>
  );
}
