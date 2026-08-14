/**
 * Which tray chips are currently multi-selected.
 *
 * This is UI selection, not document state: it is not part of
 * `PlaygroundState`, it is never persisted, and P4's "Apply to design system"
 * must never read it. Keeping it out of `store/playgroundStore.ts` also keeps
 * a selection click from invalidating any selector that watches experiments.
 *
 * It lives under `lib/playground/` rather than `store/` only because file
 * ownership for this batch stops at `store/`; if the two are ever
 * consolidated this is the file to move, and nothing but the import path
 * changes.
 *
 * Why selection is shared state at all: the trays live in the toolbar and the
 * role grids live inside each experiment card, and the whole interaction is
 * "narrow the palette down to the four colours I'm actually deciding between,
 * then assign them". A card-local selection would make that impossible.
 */
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

type TraySelectionState = {
  selectedSwatchIds: string[];
  selectedFontIds: string[];
  toggleSwatch: (id: string) => void;
  toggleFont: (id: string) => void;
  clearSwatchSelection: () => void;
  clearFontSelection: () => void;
  /** Called when a chip leaves the tray, so selection can't strand an id. */
  forgetSwatch: (id: string) => void;
  forgetFont: (id: string) => void;
};

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export const useTraySelectionStore = create<TraySelectionState>((set) => ({
  selectedSwatchIds: [],
  selectedFontIds: [],
  toggleSwatch: (id) => set((s) => ({ selectedSwatchIds: toggle(s.selectedSwatchIds, id) })),
  toggleFont: (id) => set((s) => ({ selectedFontIds: toggle(s.selectedFontIds, id) })),
  clearSwatchSelection: () => set({ selectedSwatchIds: [] }),
  clearFontSelection: () => set({ selectedFontIds: [] }),
  forgetSwatch: (id) => set((s) => ({ selectedSwatchIds: s.selectedSwatchIds.filter((x) => x !== id) })),
  forgetFont: (id) => set((s) => ({ selectedFontIds: s.selectedFontIds.filter((x) => x !== id) })),
}));

/** Membership only — a chip re-renders when *its own* selection flips, not
 *  when any other chip in the tray is clicked. */
export function useIsSwatchSelected(id: string): boolean {
  return useTraySelectionStore((s) => s.selectedSwatchIds.includes(id));
}

export function useIsFontSelected(id: string): boolean {
  return useTraySelectionStore((s) => s.selectedFontIds.includes(id));
}

export function useSelectedSwatchIds(): string[] {
  return useTraySelectionStore(useShallow((s) => s.selectedSwatchIds));
}

export function useSelectedFontIds(): string[] {
  return useTraySelectionStore(useShallow((s) => s.selectedFontIds));
}
