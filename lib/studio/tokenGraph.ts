/**
 * Two-tier color token graph for Studio's palette editor. A `PrimitiveColor`
 * is a named, unlimited-count swatch; a `ColorValue` is either a literal hex
 * (today's behavior, and every existing saved project's shape — no
 * migration needed) or a reference to a primitive by id. Editing a
 * primitive's hex cascades to every semantic slot (light or dark) aliased
 * to it, instead of re-typing the same color in every place it's used.
 *
 * Deliberately one hop only (semantics alias primitives, primitives never
 * alias each other) — this makes cycles structurally impossible, so no
 * cycle-detection is needed. Resolution always happens before this data
 * reaches anything outside Studio's own editing state (export, preview,
 * the advanced design-system layer) — those consumers only ever see plain
 * resolved hex strings, exactly as before this existed.
 */
export type PrimitiveColor = { id: string; name: string; hex: string };
export type ColorRef = { primitiveId: string };
export type ColorValue = string | ColorRef;

export function isColorRef(value: ColorValue): value is ColorRef {
  return typeof value === "object" && value !== null && "primitiveId" in value;
}

export function resolveColor(value: ColorValue, primitives: PrimitiveColor[]): string {
  if (typeof value === "string") return value;
  return primitives.find((p) => p.id === value.primitiveId)?.hex ?? "#000000";
}

export function resolvePalette<T extends Record<string, ColorValue>>(
  palette: T,
  primitives: PrimitiveColor[]
): { [K in keyof T]: string } {
  const resolved = {} as { [K in keyof T]: string };
  (Object.keys(palette) as Array<keyof T>).forEach((key) => {
    resolved[key] = resolveColor(palette[key], primitives);
  });
  return resolved;
}

// Used when a primitive is deleted — any role still aliasing it freezes to
// its last-resolved hex instead of silently resolving to black.
export function unlinkPrimitiveFromPalette<T extends Record<string, ColorValue>>(
  palette: T,
  primitiveId: string,
  primitives: PrimitiveColor[]
): T {
  const next = { ...palette };
  (Object.keys(next) as Array<keyof T>).forEach((key) => {
    const value = next[key];
    if (isColorRef(value) && value.primitiveId === primitiveId) {
      next[key] = resolveColor(value, primitives) as T[typeof key];
    }
  });
  return next;
}

export function makePrimitiveId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `prim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
