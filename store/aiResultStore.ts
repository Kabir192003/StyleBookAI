/**
 * Persists the most recent AI Generate result (prompt + response) across
 * navigation and reload within the tab — sessionStorage, cleared when the
 * tab closes. This is what makes the Studio "← Back to AI result" button
 * (StudioBuilder.tsx) work, and lets /studio/ai restore the last result
 * instead of always starting from a blank prompt.
 *
 * `savedProjectId` rides along as the same bridge's way of telling Studio
 * "this session came from an already-saved project" — set by
 * app/dashboard/[projectId]/page.tsx's "Edit in Studio" so Studio's Save
 * button updates that row (PUT) instead of creating a duplicate (POST). A
 * fresh AI generation or a from-scratch manual build always starts with
 * this null, since neither is tied to a saved row yet.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AIGeneratedProject } from "@/types/ai";

type AIResultState = {
  prompt: string;
  includeDesignSystem: boolean;
  result: AIGeneratedProject | null;
  savedProjectId: string | null;
  setResult: (prompt: string, includeDesignSystem: boolean, result: AIGeneratedProject) => void;
  setSavedProjectId: (id: string | null) => void;
  clear: () => void;
};

export const useAIResultStore = create<AIResultState>()(
  persist(
    (set) => ({
      prompt: "",
      includeDesignSystem: false,
      result: null,
      savedProjectId: null,
      setResult: (prompt, includeDesignSystem, result) =>
        set({ prompt, includeDesignSystem, result, savedProjectId: null }),
      setSavedProjectId: (id) => set({ savedProjectId: id }),
      clear: () => set({ prompt: "", includeDesignSystem: false, result: null, savedProjectId: null }),
    }),
    {
      name: "stylebook-ai-result",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
