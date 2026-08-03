/**
 * A one-shot "hand this to Studio" bridge — the mechanism behind both
 * Preview Lab's "Send to Studio" button and the clipboard tray's "Import
 * into Studio" action. Replaces the old store/studioStore.ts, which two
 * places wrote to and nothing ever read (a real dead end — see
 * docs/CONTEXT.md's audit notes).
 *
 * Same stage/consume shape as useAIResultStore's role in the AI→Studio
 * hand-off: the sender calls `stage()` then navigates to /studio;
 * StudioBuilder's initial state reads `consume()` once on mount (which
 * also clears it), so a stale payload never gets silently reapplied on a
 * later, unrelated visit to /studio.
 */
import { create } from "zustand";

export type StudioImportPayload = {
  colors?: Array<{ hex: string; role?: string }>;
  primaryFont?: string;
  secondaryFont?: string;
};

type StudioImportState = {
  pending: StudioImportPayload | null;
  stage: (payload: StudioImportPayload) => void;
  consume: () => StudioImportPayload | null;
};

export const useStudioImportStore = create<StudioImportState>((set, get) => ({
  pending: null,
  stage: (payload) => set({ pending: payload }),
  consume: () => {
    const payload = get().pending;
    set({ pending: null });
    return payload;
  },
}));
