/**
 * The in-app design clipboard — a durable scratch tray for colors and
 * fonts collected while browsing, separate from copying a hex value to
 * the OS clipboard (ColorPlate's click-to-copy still does that). Persisted
 * to localStorage (not sessionStorage like aiResultStore) since a
 * clipboard is meant to survive across visits, not just the current tab.
 *
 * ClipboardTray.tsx is the floating UI that reads this store and turns
 * its contents into a studioImportStore payload for "Import into Studio".
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ClipboardColorItem = { id: string; hex: string; name: string };
export type ClipboardFontItem = { id: string; family: string; category: string };

type ClipboardState = {
  colors: ClipboardColorItem[];
  fonts: ClipboardFontItem[];
  isColorClipped: (id: string) => boolean;
  isFontClipped: (id: string) => boolean;
  toggleColor: (item: ClipboardColorItem) => void;
  toggleFont: (item: ClipboardFontItem) => void;
  removeColor: (id: string) => void;
  removeFont: (id: string) => void;
  clear: () => void;
};

export const useClipboardStore = create<ClipboardState>()(
  persist(
    (set, get) => ({
      colors: [],
      fonts: [],
      isColorClipped: (id) => get().colors.some((c) => c.id === id),
      isFontClipped: (id) => get().fonts.some((f) => f.id === id),
      toggleColor: (item) =>
        set((s) =>
          s.colors.some((c) => c.id === item.id)
            ? { colors: s.colors.filter((c) => c.id !== item.id) }
            : { colors: [...s.colors, item] }
        ),
      toggleFont: (item) =>
        set((s) =>
          s.fonts.some((f) => f.id === item.id)
            ? { fonts: s.fonts.filter((f) => f.id !== item.id) }
            : { fonts: [...s.fonts, item] }
        ),
      removeColor: (id) => set((s) => ({ colors: s.colors.filter((c) => c.id !== id) })),
      removeFont: (id) => set((s) => ({ fonts: s.fonts.filter((f) => f.id !== id) })),
      clear: () => set({ colors: [], fonts: [] }),
    }),
    {
      name: "stylebook-clipboard",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
