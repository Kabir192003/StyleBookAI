// A one-shot "hand this to Studio" bridge — behind both Preview Lab's "Send
// to Studio" button and the clipboard tray's "Import into Studio" action.
// Same stage/consume shape as useAIResultStore's AI→Studio hand-off: the
// sender calls stage() then navigates to /studio; StudioBuilder reads
// consume() once on mount (which also clears it), so a stale payload never
// gets silently reapplied on a later, unrelated visit to /studio.
import { create } from "zustand";
import type { DesignSystem } from "@/types/designSystem";

// The five Studio palette slots a color may name. Browse/Preview
// Lab/clipboard senders have no roles and just go positional; a sender that
// knows exactly which slot a hex belongs in can set `role` instead.
export type StudioImportPaletteRole = "accent" | "support" | "surface" | "ink" | "muted";

export type StudioImportPayload = {
  colors?: Array<{ hex: string; role?: string }>; // role honoured if it names a palette slot, else positional
  primaryFont?: string;
  secondaryFont?: string;
  accentFont?: string; // small-text/label face
  radius?: number;
  // Component-level tokens for senders that have them. Several slots here
  // (background, surface, border, text/muted) have no home in the 5-slot
  // palette, so without this a payload could silently drop an override.
  // Senders without component tokens (Preview Lab, clipboard) omit it, and
  // Studio's own save re-derives one from the palette as before.
  designSystem?: DesignSystem;
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
