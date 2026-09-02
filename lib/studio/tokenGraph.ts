// Two-tier colour graph: a PrimitiveColor is a named swatch, a ColorValue
// is either a literal hex or a reference to one by id. One hop only, so
// cycles are structurally impossible. Everything outside Studio's editing
// state only ever sees plain resolved hex.
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
