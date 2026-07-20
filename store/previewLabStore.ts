/**
 * Zustand store for the Preview Lab — persists color/font selections as
 * the user flips between the swatches/mockup/font-on-color tabs (§3 of
 * docs/PRODUCT_AND_UX.md). Separate from studioStore so the Lab can be
 * used standalone or embedded inside the Studio without state collisions.
 *
 * Owner: Qi
 */
import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import { allColors } from "@/data/colors";
import { Color } from "@/types/color";
import { Font } from "@/types/font";

const defaultColors = allColors.slice(0, 4);

const defaultHeadingFont: Font = {
  id: "inter",
  family: "Inter, sans-serif",
  category: "sans-serif",
  variants: ["400", "500", "600", "700"],
  mood: ["clean"],
  style: ["modern"],
  era: "modern",
  useCase: ["heading"],
  googleFontsId: "Inter",
  isPro: false,
  pairsWith: ["manrope"],
  note: "Inter keeps the interface crisp and editorial without feeling overly technical.",
};

const defaultBodyFont: Font = {
  id: "manrope",
  family: "Manrope, sans-serif",
  category: "sans-serif",
  variants: ["400", "500", "600", "700"],
  mood: ["friendly"],
  style: ["modern"],
  era: "modern",
  useCase: ["body"],
  googleFontsId: "Manrope",
  isPro: false,
  pairsWith: ["inter"],
  note: "Manrope feels approachable and balanced, which makes it a strong body text choice.",
};

type PreviewLabState = {
  selectedColors: Color[];
  headingFont?: Font;
  bodyFont?: Font;
  activeView: "swatches" | "mockup" | "fontOnColor";
  setSelectedColors: (colors: Color[]) => void;
  setActiveView: (view: PreviewLabState["activeView"]) => void;
  reorderColors: (activeId: string, overId: string) => void;
  setHeadingFont: (font: Font) => void;
  setBodyFont: (font: Font) => void;
};

export const usePreviewLabStore = create<PreviewLabState>((set) => ({
  selectedColors: defaultColors,
  headingFont: defaultHeadingFont,
  bodyFont: defaultBodyFont,
  activeView: "swatches",
  setSelectedColors: (colors) => set({ selectedColors: colors }),
  setActiveView: (view) => set({ activeView: view }),
  reorderColors: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.selectedColors.findIndex((color) => color.id === activeId);
      const newIndex = state.selectedColors.findIndex((color) => color.id === overId);

      if (oldIndex === -1 || newIndex === -1) {
        return state;
      }

      return {
        selectedColors: arrayMove(state.selectedColors, oldIndex, newIndex),
      };
    }),
  setHeadingFont: (font) => set({ headingFont: font }),
  setBodyFont: (font) => set({ bodyFont: font }),
}));
