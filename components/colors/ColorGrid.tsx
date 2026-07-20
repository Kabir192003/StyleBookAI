/**
 * ColorGrid — filterable, searchable grid of Color swatches.
 * Used by app/browse/colors/page.tsx.
 *
 * Ported from Dhanshri's Lovable design ("Design Browse Hub") into this
 * repo's real Color type and data — see docs/CONTEXT.md for the porting
 * note. Visuals here are a starting point and can be revised freely.
 */
"use client";

import { useMemo, useState } from "react";
import { BrowseHeader } from "@/components/browse/BrowseHeader";
import { SearchBar } from "@/components/browse/SearchBar";
import { FilterDropdown } from "@/components/browse/FilterDropdown";
import { SortDropdown } from "@/components/browse/SortDropdown";
import { EmptyState } from "@/components/browse/EmptyState";
import { ColorCard } from "./ColorCard";
import { Color, ColorFamily } from "@/types/color";

const FAMILIES: ColorFamily[] = [
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

export function ColorGrid({ colors }: { colors: Color[] }) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string>("__all__");
  const [sort, setSort] = useState<string>("name-asc");

  const items = useMemo(() => {
    let list = colors.filter((c) => {
      const q = query.trim().toLowerCase();
      if (q && !`${c.name} ${c.hex} ${c.family}`.toLowerCase().includes(q)) return false;
      if (family !== "__all__" && c.family !== family) return false;
      return true;
    });
    list = [...list].sort((a, b) => (sort === "name-desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
    return list;
  }, [colors, query, family, sort]);

  return (
    <div className="space-y-8">
      <BrowseHeader
        eyebrow="Design tokens"
        title="Colors"
        description="A curated palette of real colors. Copy any hex and drop it into your design system."
        count={items.length}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <SearchBar value={query} onChange={setQuery} placeholder="Search colors..." />
        <div className="flex flex-col gap-3 sm:flex-row">
          <FilterDropdown value={family} onChange={setFamily} options={FAMILIES} allLabel="All families" />
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((c) => (
            <ColorCard key={c.id} color={c} />
          ))}
        </div>
      )}
    </div>
  );
}
