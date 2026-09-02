// Applies a staged StudioImportPayload onto a StudioState, shared by both
// Preview Lab and the clipboard tray's "Import into Studio". Colours with
// a recognised role claim that slot directly; the rest fall back to
// positional order (accent/support/surface/ink/muted).
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
