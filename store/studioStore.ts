/**
 * Zustand store for the Studio (manual builder). Holds the in-progress
 * project before it's saved via /api/projects.
 *
 * TODO: flesh out actions (addColor, assignRole, setFont, setTypeScale,
 * reset, loadFromProject) as the Studio UI needs them. Keep this store
 * framework-agnostic — components read/write it, they don't own this state.
 */
import { create } from "zustand";
import { Color } from "@/types/color";
import { Font } from "@/types/font";
import { TypeScale } from "@/types/theme";

type StudioState = {
  colors: Array<Color & { role?: string }>;
  primaryFont?: Font;
  secondaryFont?: Font;
  typeScale?: TypeScale;
  setColors: (colors: Array<Color & { role?: string }>) => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  colors: [],
  setColors: (colors) => set({ colors }),
}));
