/**
 * Zustand store for the Preview Lab's Canvas — the single drag-and-drop
 * surface for testing color/font pairings (§3 of docs/PRODUCT_AND_UX.md).
 * Separate from studioStore so the Lab can be used standalone or embedded
 * inside the Studio without state collisions.
 *
 * Owner: Qi
 */
import { create } from "zustand";
import { ClipboardColorItem, ClipboardFontItem } from "@/store/clipboardStore";

export type CanvasBandFont = { family: string; category: string };
export type CanvasColorBand = { id: string; hex: string; name: string; font?: CanvasBandFont };

type PreviewLabState = {
  // Sidebar pools are unlimited (fed by "Import to Live Preview" from the
  // Clipboard); the canvas itself caps at 5 color bands, each stackable
  // with one dragged-in font.
  sidebarColors: ClipboardColorItem[];
  sidebarFonts: ClipboardFontItem[];
  canvasBands: CanvasColorBand[];
  addSidebarItems: (colors: ClipboardColorItem[], fonts: ClipboardFontItem[]) => void;
  addColorToCanvas: (color: ClipboardColorItem) => void;
  removeColorFromCanvas: (bandId: string) => void;
  assignFontToBand: (bandId: string, font: ClipboardFontItem) => void;
};

export const usePreviewLabStore = create<PreviewLabState>((set) => ({
  sidebarColors: [],
  sidebarFonts: [],
  canvasBands: [],
  addSidebarItems: (colors, fonts) =>
    set((state) => {
      const existingColorIds = new Set(state.sidebarColors.map((c) => c.id));
      const existingFontIds = new Set(state.sidebarFonts.map((f) => f.id));
      return {
        sidebarColors: [...state.sidebarColors, ...colors.filter((c) => !existingColorIds.has(c.id))],
        sidebarFonts: [...state.sidebarFonts, ...fonts.filter((f) => !existingFontIds.has(f.id))],
      };
    }),
  addColorToCanvas: (color) =>
    set((state) => {
      if (state.canvasBands.length >= 5) return state;
      return {
        canvasBands: [...state.canvasBands, { id: `${color.id}-${Date.now()}`, hex: color.hex, name: color.name }],
      };
    }),
  removeColorFromCanvas: (bandId) =>
    set((state) => ({ canvasBands: state.canvasBands.filter((band) => band.id !== bandId) })),
  assignFontToBand: (bandId, font) =>
    set((state) => ({
      canvasBands: state.canvasBands.map((band) =>
        band.id === bandId ? { ...band, font: { family: font.family, category: font.category } } : band
      ),
    })),
}));
