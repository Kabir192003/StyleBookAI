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
import { Project } from "@/types/project";

type StudioState = {
  colors: Array<Color & { role?: string }>;
  primaryFont?: Font;
  secondaryFont?: Font;
  typeScale?: TypeScale;
  sourceProjectId?: string;
  setColors: (colors: Array<Color & { role?: string }>) => void;
  /**
   * Loads an existing saved project into the Studio so editing continues
   * from where it left off — the "Edit in Studio" action on
   * /dashboard/[projectId]. `sourceProjectId` lets Studio's eventual save
   * action PUT back to the same project instead of creating a new one;
   * Studio itself still owns deciding what to do with that field.
   */
  loadFromProject: (project: Project) => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  colors: [],
  setColors: (colors) => set({ colors }),
  loadFromProject: (project) =>
    set({
      colors: project.colors,
      primaryFont: project.fonts.primary,
      secondaryFont: project.fonts.secondary,
      typeScale: project.typeScale,
      sourceProjectId: project.id,
    }),
}));
