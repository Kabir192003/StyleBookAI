/**
 * Client-side cache of the signed-in user's favorited colors/fonts/themes,
 * so every ColorCard/FontCard/theme tile can check "is this favorited"
 * without its own network request. `toggle()` updates optimistically and
 * calls the API in the background — see components/browse/FavoriteButton.tsx.
 */
import { create } from "zustand";

export type FavoriteType = "color" | "font" | "theme";

type FavoritesState = {
  loaded: boolean;
  items: Record<FavoriteType, Set<string>>;
  load: () => Promise<void>;
  isFavorited: (type: FavoriteType, id: string) => boolean;
  toggle: (type: FavoriteType, id: string) => Promise<void>;
  clear: () => void;
};

function emptyItems(): Record<FavoriteType, Set<string>> {
  return { color: new Set(), font: new Set(), theme: new Set() };
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  loaded: false,
  items: emptyItems(),
  async load() {
    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) {
        set({ loaded: true, items: emptyItems() });
        return;
      }
      const data = await res.json();
      const items = emptyItems();
      for (const f of data.favorites as Array<{ itemType: FavoriteType; itemId: string }>) {
        items[f.itemType].add(f.itemId);
      }
      set({ loaded: true, items });
    } catch {
      set({ loaded: true, items: emptyItems() });
    }
  },
  isFavorited(type, id) {
    return get().items[type].has(id);
  },
  async toggle(type, id) {
    const wasFavorited = get().items[type].has(id);
    set((s) => {
      const next = new Set(s.items[type]);
      if (wasFavorited) next.delete(id);
      else next.add(id);
      return { items: { ...s.items, [type]: next } };
    });

    try {
      if (wasFavorited) {
        await fetch(`/api/favorites?itemType=${type}&itemId=${encodeURIComponent(id)}`, { method: "DELETE" });
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: type, itemId: id }),
        });
      }
    } catch {
      // Revert on network failure — the optimistic update didn't stick.
      set((s) => {
        const next = new Set(s.items[type]);
        if (wasFavorited) next.add(id);
        else next.delete(id);
        return { items: { ...s.items, [type]: next } };
      });
    }
  },
  clear() {
    set({ loaded: false, items: emptyItems() });
  },
}));
