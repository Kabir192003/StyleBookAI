/**
 * Favorites grids on /account — colors/fonts/themes the user has
 * favorited via FavoriteButton (components/browse/FavoriteButton.tsx)
 * elsewhere in the app. Looks the ids up against the static data/
 * libraries (colors/fonts/themes aren't DB rows) and reuses the same
 * favoritesStore the browse pages already read from, so unfavoriting here
 * and there stay in sync without a refetch.
 */
"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { allColors } from "@/data/colors";
import { allFonts } from "@/data/fonts";
import { allThemes } from "@/data/themes";
import { useFavoritesStore } from "@/store";

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove from favorites"
      className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
    >
      <Heart className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" />
    </button>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#8A8477]">{children}</p>;
}

export function FavoritesSection() {
  const colorIds = useFavoritesStore((s) => s.items.color);
  const fontIds = useFavoritesStore((s) => s.items.font);
  const themeIds = useFavoritesStore((s) => s.items.theme);
  const toggle = useFavoritesStore((s) => s.toggle);

  const favColors = allColors.filter((c) => colorIds.has(c.id));
  const favFonts = allFonts.filter((f) => fontIds.has(f.id));
  const favThemes = allThemes.filter((t) => themeIds.has(t.id));

  return (
    <section className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
      <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Favorites</div>

      <div className="mt-4">
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#6E675C]">
          Colours ({favColors.length})
        </h3>
        {favColors.length === 0 ? (
          <EmptyRow>Tap the heart on any colour in Browse → Colours to save it here.</EmptyRow>
        ) : (
          <div className="flex flex-wrap gap-3">
            {favColors.map((c) => (
              <div key={c.id} className="group relative">
                <Link href="/browse/colors" className="block">
                  <div
                    className="h-14 w-14 rounded-lg border border-black/[0.12]"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                </Link>
                <RemoveButton onClick={() => toggle("color", c.id)} />
                <div className="mt-1 w-14 truncate text-center font-mono-plex text-[9px] text-[#8A8477]">{c.hex}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-black/[0.1] pt-6">
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#6E675C]">
          Fonts ({favFonts.length})
        </h3>
        {favFonts.length === 0 ? (
          <EmptyRow>Tap the heart on any font in Browse → Fonts to save it here.</EmptyRow>
        ) : (
          <div className="flex flex-col gap-2">
            {favFonts.map((f) => (
              <div key={f.id} className="group relative flex items-center justify-between rounded-lg border border-black/[0.1] bg-white/60 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-[#211E18]">{f.family}</div>
                  <div className="text-xs capitalize text-[#8A8477]">{f.category}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle("font", f.id)}
                  aria-label="Remove from favorites"
                  className="grid h-7 w-7 place-items-center rounded-full text-[#211E18] hover:bg-black/[0.06]"
                >
                  <Heart className="h-4 w-4" fill="currentColor" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-black/[0.1] pt-6">
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#6E675C]">
          Themes ({favThemes.length})
        </h3>
        {favThemes.length === 0 ? (
          <EmptyRow>Tap the heart on any theme in Browse → Themes to save it here.</EmptyRow>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {favThemes.map((t) => (
              <div key={t.id} className="group relative">
                <Link
                  href={`/browse/themes/${t.slug}`}
                  className="block overflow-hidden rounded-lg border border-black/[0.12]"
                >
                  <div className="flex h-16">
                    {[t.colorRoles.primary, t.colorRoles.secondary, t.colorRoles.accent, t.colorRoles.surface].map((hex, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
                    ))}
                  </div>
                </Link>
                <RemoveButton onClick={() => toggle("theme", t.id)} />
                <div className="mt-1 truncate text-xs text-[#211E18]">{t.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
