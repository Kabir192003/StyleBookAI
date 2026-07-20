/**
 * ThemeGrid — grid of Theme cards, each showing a small live mockup
 * rendered in that theme's actual colors/fonts. Used by
 * app/browse/themes/page.tsx.
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
import { ThemeCard } from "./ThemeCard";
import { Theme, ThemeCategory } from "@/types/theme";

const CATEGORIES: ThemeCategory[] = [
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

export function ThemeGrid({ themes }: { themes: Theme[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("__all__");
  const [sort, setSort] = useState<string>("name-asc");

  const items = useMemo(() => {
    let list = themes.filter((t) => {
      const q = query.trim().toLowerCase();
      if (q && !`${t.name} ${t.description} ${t.category}`.toLowerCase().includes(q)) return false;
      if (category !== "__all__" && t.category !== category) return false;
      return true;
    });
    list = [...list].sort((a, b) => (sort === "name-desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
    return list;
  }, [themes, query, category, sort]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <BrowseHeader
        eyebrow="Themes"
        title="Themes"
        description="Complete looks combining palettes, typography, and a type scale."
        count={items.length}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <SearchBar value={query} onChange={setQuery} placeholder="Search themes..." />
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <ThemeCard key={t.id} theme={t} />
          ))}
        </div>
      )}
    </div>
  );
}
