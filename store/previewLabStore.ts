// Preview Lab's drag-and-drop canvas for testing color/font pairings
// (§3 of docs/PRODUCT_AND_UX.md). Kept separate from studioStore so the Lab
// can be used standalone or embedded inside Studio without state collisions.
import { create } from "zustand";
import { ClipboardColorItem, ClipboardFontItem } from "@/store/clipboardStore";

export type CanvasBandFont = { family: string; category: string };
// textColor is optional: when unset, the band uses the automatically
// computed most-readable color (white or near-black) against its
// background. Setting it lets someone test a specific text color they
// actually have in mind, not just the safe default.
export type CanvasColorBand = { id: string; hex: string; name: string; font?: CanvasBandFont; textColor?: string };

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
  updateBandColor: (bandId: string, hex: string) => void;
  updateBandTextColor: (bandId: string, textColor: string) => void;
  resetBandTextColor: (bandId: string) => void;
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
  // Lets a dropped-in color be nudged live rather than removed and
  // re-dragged from scratch whenever it's not quite right — the swatch
  // itself becomes a real color picker, same pattern as Studio's palette
  // role inputs. The band keeps its original library `name` even after an
  // edit, since the hex no longer necessarily matches a catalog entry.
  updateBandColor: (bandId, hex) =>
    set((state) => ({
      canvasBands: state.canvasBands.map((band) => (band.id === bandId ? { ...band, hex } : band)),
    })),
  // Overrides the auto-computed text color so someone can test a specific
  // pairing rather than only the safest one.
  updateBandTextColor: (bandId, textColor) =>
    set((state) => ({
      canvasBands: state.canvasBands.map((band) => (band.id === bandId ? { ...band, textColor } : band)),
    })),
  resetBandTextColor: (bandId) =>
    set((state) => ({
      canvasBands: state.canvasBands.map((band) => {
        if (band.id !== bandId) return band;
        const { textColor: _drop, ...rest } = band;
        return rest;
      }),
    })),
}));
