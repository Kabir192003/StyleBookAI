/**
 * Zustand store for the Preview Lab — persists color/font selections as
 * the user flips between the swatches/mockup/font-on-color tabs (§3 of
 * docs/PRODUCT_AND_UX.md). Separate from studioStore so the Lab can be
 * used standalone or embedded inside the Studio without state collisions.
 */
import { create } from "zustand";
import { Color } from "@/types/color";
import { Font } from "@/types/font";

type PreviewLabState = {
  selectedColors: Color[];
  headingFont?: Font;
  bodyFont?: Font;
  activeView: "swatches" | "mockup" | "fontOnColor";
  setSelectedColors: (colors: Color[]) => void;
  setActiveView: (view: PreviewLabState["activeView"]) => void;
};

export const usePreviewLabStore = create<PreviewLabState>((set) => ({
  selectedColors: [],
  activeView: "swatches",
  setSelectedColors: (colors) => set({ selectedColors: colors }),
  setActiveView: (view) => set({ activeView: view }),
}));
