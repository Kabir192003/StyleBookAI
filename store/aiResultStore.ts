// Persists the most recent AI Generate result across navigation/reload in
// the tab (sessionStorage) — powers Studio's "Back to AI result" button and
// lets /studio/ai restore the last result instead of a blank prompt.
// `savedProjectId` tags a result as coming from an already-saved project
// (set by "Edit in Studio") so Studio's Save button does a PUT instead of
// creating a duplicate; stays null for a fresh generation or manual build.
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
