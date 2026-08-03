/**
 * Applies a staged StudioImportPayload (see store/studioImportStore.ts)
 * onto a StudioState — the actual merge logic shared by Preview Lab's
 * "Send to Studio" and the clipboard tray's "Import into Studio", both of
 * which just stage a payload and navigate; StudioBuilder calls this once
 * on mount to fold it into its initial state.
 *
 * Colors have no defined role coming from Browse/Preview Lab/the
 * clipboard (they're just hexes), so they're assigned in order to
 * Studio's 5 named roles — accent first, then support/surface/ink/muted.
 * Extra colors beyond 5 are ignored; fewer than 5 leaves the remaining
 * roles at whatever they already were.
 */
import type { StudioState } from "@/components/studio/StudioBuilder";
import type { PaletteTokens } from "@/lib/studio/exportCode";
import type { StudioImportPayload } from "@/store/studioImportStore";

const ROLE_ORDER: Array<keyof PaletteTokens> = ["accent", "support", "surface", "ink", "muted"];

export function applyStudioImport(base: StudioState, payload: StudioImportPayload): StudioState {
  let next = base;

  if (payload.colors && payload.colors.length > 0) {
    const variant = next.mode === "Dark" ? "dark" : "light";
    const updatedPalette = { ...next[variant] };
    payload.colors.slice(0, ROLE_ORDER.length).forEach((color, i) => {
      updatedPalette[ROLE_ORDER[i]] = color.hex;
    });
    next = { ...next, [variant]: updatedPalette };
  }

  if (payload.primaryFont) next = { ...next, headFont: payload.primaryFont };
  if (payload.secondaryFont) next = { ...next, bodyFont: payload.secondaryFont };

  return next;
}
