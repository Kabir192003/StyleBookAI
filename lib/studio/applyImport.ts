/**
 * Applies a staged StudioImportPayload (see store/studioImportStore.ts)
 * onto a StudioState — the actual merge logic shared by Preview Lab's
 * "Send to Studio", the clipboard tray's "Import into Studio" and the
 * the clipboard tray's "Import into Studio", all of which just stage a
 * payload and navigate; StudioBuilder consumes it once and folds it in.
 *
 * Two colour-assignment modes, deliberately:
 *
 *  - **Positional** (Browse / Preview Lab / the clipboard). Those senders
 *    have hexes and nothing else — no roles exist to send — so colours are
 *    assigned in order to accent/support/surface/ink/muted. Extra colours
 *    beyond 5 are ignored; fewer than 5 leaves the rest as they were. This
 *    is the original behaviour and both existing callers still hit it,
 *    because neither sets `role`.
 *
 *  - **Explicit role**. A sender assigns colours to
 *    named roles, so guessing from array order would be strictly worse than
 *    the information we already have: a user who put a hex on `secondary`
 *    would watch it land on `accent` purely because it came first in the
 *    array. A colour carrying a recognised `role` claims that slot; anything
 *    left over still falls back to the positional walk, skipping slots
 *    already claimed so the two modes can't fight over one slot.
 */
import type { StudioState } from "@/components/studio/StudioBuilder";
import type { PaletteTokens } from "@/lib/studio/exportCode";
import type { StudioImportPaletteRole, StudioImportPayload } from "@/store/studioImportStore";

const ROLE_ORDER: Array<keyof PaletteTokens> = ["accent", "support", "surface", "ink", "muted"];

function isPaletteRole(role: string | undefined): role is StudioImportPaletteRole {
  return role !== undefined && (ROLE_ORDER as string[]).includes(role);
}

export function applyStudioImport(base: StudioState, payload: StudioImportPayload): StudioState {
  let next = base;

  if (payload.colors && payload.colors.length > 0) {
    const variant = next.mode === "Dark" ? "dark" : "light";
    const updatedPalette = { ...next[variant] };

    const claimed = new Set<keyof PaletteTokens>();
    payload.colors.forEach((color) => {
      if (!isPaletteRole(color.role)) return;
      updatedPalette[color.role] = color.hex;
      claimed.add(color.role);
    });

    // Slots the explicit pass didn't take, still filled in array order — so a
    // mixed payload (some roles known, some not) places what it knows and
    // then behaves exactly like the old positional import for the remainder.
    const openSlots = ROLE_ORDER.filter((role) => !claimed.has(role));
    payload.colors
      .filter((color) => !isPaletteRole(color.role))
      .slice(0, openSlots.length)
      .forEach((color, i) => {
        updatedPalette[openSlots[i]] = color.hex;
      });

    next = { ...next, [variant]: updatedPalette };
  }

  if (payload.primaryFont) next = { ...next, headFont: payload.primaryFont };
  if (payload.secondaryFont) next = { ...next, bodyFont: payload.secondaryFont };
  if (payload.accentFont) next = { ...next, accentFont: payload.accentFont };
  if (payload.radius !== undefined) next = { ...next, radius: payload.radius };
  // Replaced wholesale rather than deep-merged: a sender of this field builds
  // it by cloning Studio's *current* design system and patching it, so it is
  // already the merged result. Merging again here would be a second,
  // differently-shaped merge of the same data — and would make it impossible
  // to ever clear a component token.
  if (payload.designSystem) next = { ...next, designSystem: payload.designSystem };

  return next;
}
