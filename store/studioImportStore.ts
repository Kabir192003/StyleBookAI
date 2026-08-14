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
import type { DesignSystem } from "@/types/designSystem";

/**
 * The five Studio palette slots a colour may name. `role` was always in this
 * shape but nothing read it (lib/studio/applyImport.ts assigned positionally),
 * so Browse/Preview Lab/clipboard senders — which genuinely have no roles —
 * keep working untouched while the playground's "Apply to design system",
 * which knows exactly which slot each hex belongs in, can say so.
 */
export type StudioImportPaletteRole = "accent" | "support" | "surface" | "ink" | "muted";

export type StudioImportPayload = {
  /** `role` is honoured when it names a palette slot; otherwise positional. */
  colors?: Array<{ hex: string; role?: string }>;
  primaryFont?: string;
  secondaryFont?: string;
  /** The small-text/label face. Studio's `accentFont` — optional there too. */
  accentFont?: string;
  radius?: number;
  /**
   * Component-level tokens (colorRoles + per-component background/text/border)
   * for senders that have them. The playground needs this because four of its
   * eleven roles — background, surface, border, and the text/muted pair as
   * component tokens — have no home in the 5-slot palette at all, so a payload
   * limited to `colors` would silently drop a user's explicit override. Senders
   * without component tokens (Preview Lab, the clipboard) simply omit it, and
   * Studio's own save re-derives one from the palette exactly as before.
   */
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
