// Client-side cache of the signed-in user's favorited colors/fonts/themes,
// so every ColorCard/FontCard/theme tile can check "is this favorited"
// without its own request. toggle() updates optimistically, calls the API,
// and reverts on any non-OK response — not just network failures, since a
// 401 (session expired mid-visit) used to leave the heart filled while the
// write silently failed. sessionExpired flips true on a 401 so
// FavoriteButton can redirect to sign-in instead of looking "successful".
import { create } from "zustand";

export type FavoriteType = "color" | "font" | "theme";

type FavoritesState = {
  loaded: boolean;
  items: Record<FavoriteType, Set<string>>;
  sessionExpired: boolean;
  load: () => Promise<void>;
  isFavorited: (type: FavoriteType, id: string) => boolean;
  toggle: (type: FavoriteType, id: string) => Promise<void>;
  acknowledgeSessionExpired: () => void;
  clear: () => void;
};

function emptyItems(): Record<FavoriteType, Set<string>> {
  return { color: new Set(), font: new Set(), theme: new Set() };
}

// Every color/font tile on a browse page mounts its own FavoriteButton,
// and each one calls load() on mount — with dozens of tiles rendered at
// once, that used to fire dozens of identical concurrent GETs before the
// first resolved and flipped `loaded`. Caching the in-flight promise here
// (outside React state, so it doesn't trigger re-renders) means every
// caller in that window shares the same request.
let inFlightLoad: Promise<void> | null = null;

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  loaded: false,
  items: emptyItems(),
  sessionExpired: false,
  load() {
    if (get().loaded) return Promise.resolve();
    if (inFlightLoad) return inFlightLoad;

    inFlightLoad = (async () => {
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
      } finally {
        inFlightLoad = null;
      }
    })();

    return inFlightLoad;
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

    function revert() {
      set((s) => {
        const next = new Set(s.items[type]);
        if (wasFavorited) next.add(id);
        else next.delete(id);
        return { items: { ...s.items, [type]: next } };
      });
    }

    try {
      const res = wasFavorited
        ? await fetch(`/api/favorites?itemType=${type}&itemId=${encodeURIComponent(id)}`, { method: "DELETE" })
        : await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemType: type, itemId: id }),
          });

      if (!res.ok) {
        revert();
        if (res.status === 401) set({ sessionExpired: true });
      }
    } catch {
      revert();
    }
  },
  acknowledgeSessionExpired() {
    set({ sessionExpired: false });
  },
  clear() {
    set({ loaded: false, items: emptyItems(), sessionExpired: false });
  },
}));
