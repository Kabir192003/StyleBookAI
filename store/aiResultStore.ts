/**
 * Persists the most recent AI Generate result (prompt + response) across
 * navigation and reload within the tab — sessionStorage, cleared when the
 * tab closes. This is what makes the Studio "← Back to AI result" button
 * (StudioBuilder.tsx) work, and lets /studio/ai restore the last result
 * instead of always starting from a blank prompt.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AIGeneratedProject } from "@/types/ai";

type AIResultState = {
  prompt: string;
  includeDesignSystem: boolean;
  result: AIGeneratedProject | null;
  setResult: (prompt: string, includeDesignSystem: boolean, result: AIGeneratedProject) => void;
  clear: () => void;
};

export const useAIResultStore = create<AIResultState>()(
  persist(
    (set) => ({
      prompt: "",
      includeDesignSystem: false,
      result: null,
      setResult: (prompt, includeDesignSystem, result) => set({ prompt, includeDesignSystem, result }),
      clear: () => set({ prompt: "", includeDesignSystem: false, result: null }),
    }),
    {
      name: "stylebook-ai-result",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
