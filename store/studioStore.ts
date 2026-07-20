/**
 * Zustand store for the Studio (manual builder). Holds the in-progress
 * project before it's saved via /api/projects.
 *
 * Owner: Qi
 *
 * TODO (Qi): flesh out actions (addColor, assignRole, setFont, setTypeScale,
 * reset, loadFromProject) as the Studio UI needs them. Keep this store
 * framework-agnostic — components read/write it, they don't own this state.
 */

import { create } from "zustand";
import { Color } from "@/types/color";
import { Font } from "@/types/font";
import { TypeScale } from "@/types/theme";

export type StudioColor = Color & { role?: string };

type StudioState = {
  colors: StudioColor[];
  primaryFont?: Font;
  secondaryFont?: Font;
  typeScale?: TypeScale;
  setColors: (colors: StudioColor[]) => void;
  addColor: (color: Color, role?: string) => void;
  removeColor: (id: string) => void;
  assignRole: (id: string, role: string) => void;
  setPrimaryFont: (font: Font) => void;
  setSecondaryFont: (font: Font) => void;
  setTypeScale: (scale: TypeScale) => void;
  reset: () => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  colors: [],
  setColors: (colors) => set({ colors }),
  addColor: (color, role) =>
    set((state) => ({
      colors: [...state.colors, { ...color, role }],
    })),
  removeColor: (id) =>
    set((state) => ({
      colors: state.colors.filter((entry) => entry.id !== id),
    })),
  assignRole: (id, role) =>
    set((state) => ({
      colors: state.colors.map((entry) => (entry.id === id ? { ...entry, role } : entry)),
    })),
  setPrimaryFont: (font) => set({ primaryFont: font }),
  setSecondaryFont: (font) => set({ secondaryFont: font }),
  setTypeScale: (scale) => set({ typeScale: scale }),
  reset: () => set({ colors: [], primaryFont: undefined, secondaryFont: undefined, typeScale: undefined }),
}));
