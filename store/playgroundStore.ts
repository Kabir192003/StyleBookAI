/**
 * Zustand store for the Design Playground (docs/DESIGN_PLAYGROUND.md).
 * Holds `PlaygroundState`: the experiment cards on the canvas plus the
 * swatch/font trays P3's controls fill.
 *
 * **Deliberately not persisted.** Every other store here that survives a
 * reload does so for a reason — the clipboard is a durable scratch tray
 * (localStorage), an AI result is a navigation hand-off (sessionStorage).
 * The playground is neither: it's a scratch surface where a user spins up
 * throwaway experiments, and the spec's persistence requirement is an
 * explicit "Save Playground" action in P4, not silent auto-save. Writing
 * every keystroke into sessionStorage would make that deliberate save
 * meaningless and would resurrect abandoned experiments on the next visit.
 * If P4 needs durability it should serialise this state into the saved
 * Project — and mind `lib/db/projectMapper.ts`, which is a `Pick<>`
 * allowlist that silently drops unknown fields.
 *
 * Selector discipline: components subscribe to one experiment
 * (`useExperiment(id)`) or to the id list (`useExperimentIds`), never to
 * the whole `experiments` array. Editing one card's tokens then re-renders
 * only that card, which is the point of the whole surface — you change a
 * colour in experiment B and watch only B move.
 */
import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type {
  Experiment,
  PlaygroundFont,
  PlaygroundRole,
  PlaygroundState,
  PlaygroundSwatch,
  PlaygroundTypeRole,
} from "@/lib/playground/types";

let experimentCounter = 0;

/**
 * Ids are generated only in response to user actions (add/duplicate), never
 * during module init or the first render — a counter or a random value read
 * at render time differs between the server HTML and the client's first
 * render and trips a hydration mismatch, which is the same defect
 * LivePreviewSection's mount guard exists for. Seed experiments therefore
 * carry fixed ids (see lib/playground/baseSystem.ts).
 */
function makeExperimentId(): string {
  experimentCounter += 1;
  return `exp-${Date.now().toString(36)}-${experimentCounter}`;
}

type PlaygroundActions = {
  /** Replaces the canvas contents. Used once on mount to plant the seeds. */
  hydrate: (experiments: Experiment[]) => void;
  addExperiment: (experiment?: Partial<Experiment>) => string;
  duplicateExperiment: (id: string) => string | null;
  renameExperiment: (id: string, name: string) => void;
  deleteExperiment: (id: string) => void;
  /** Drops every override, leaving the card showing the base system. */
  clearExperiment: (id: string) => void;
  reorderExperiments: (activeId: string, overId: string) => void;
  setExperimentColor: (id: string, role: PlaygroundRole, hex: string | null) => void;
  setExperimentFont: (id: string, role: PlaygroundTypeRole, family: string | null) => void;
  setExperimentRadius: (id: string, radius: number | undefined) => void;
  setExperimentGroups: (id: string, groupIds: string[]) => void;
  addSwatches: (swatches: PlaygroundSwatch[]) => void;
  removeSwatch: (id: string) => void;
  addFonts: (fonts: PlaygroundFont[]) => void;
  removeFont: (id: string) => void;
};

type PlaygroundStore = PlaygroundState & PlaygroundActions;

const EMPTY_EXPERIMENT: Omit<Experiment, "id" | "name"> = { colors: {}, fonts: {} };

/**
 * Rewrites exactly one experiment and leaves every other object identity
 * untouched, so `useExperiment(otherId)` returns the same reference and
 * those cards don't re-render.
 */
function patchOne(
  experiments: Experiment[],
  id: string,
  patch: (exp: Experiment) => Experiment
): Experiment[] {
  let changed = false;
  const next = experiments.map((exp) => {
    if (exp.id !== id) return exp;
    changed = true;
    return patch(exp);
  });
  return changed ? next : experiments;
}

export const usePlaygroundStore = create<PlaygroundStore>((set, get) => ({
  experiments: [],
  swatches: [],
  fonts: [],

  hydrate: (experiments) => set({ experiments }),

  addExperiment: (partial) => {
    const id = partial?.id ?? makeExperimentId();
    const count = get().experiments.length;
    // `id` is reapplied after the caller's partial so a caller passing a
    // partial that happens to carry a stale id can't desync the returned id
    // from the experiment actually inserted.
    const experiment: Experiment = {
      ...EMPTY_EXPERIMENT,
      name: `Experiment ${count + 1}`,
      ...partial,
      id,
    };
    set((s) => ({ experiments: [...s.experiments, experiment] }));
    return id;
  },

  duplicateExperiment: (id) => {
    const source = get().experiments.find((exp) => exp.id === id);
    if (!source) return null;
    const newId = makeExperimentId();
    // Deep-ish copy of the two override maps: a shallow spread of the
    // experiment would share the `colors`/`fonts` objects, so editing a role
    // on the copy would silently change the original too.
    const copy: Experiment = {
      ...source,
      id: newId,
      name: `${source.name} copy`,
      colors: { ...source.colors },
      fonts: { ...source.fonts },
      ...(source.visibleGroups ? { visibleGroups: [...source.visibleGroups] } : {}),
    };
    set((s) => {
      const index = s.experiments.findIndex((exp) => exp.id === id);
      const next = [...s.experiments];
      // Inserted next to its source rather than appended — a duplicate you
      // have to go hunting for at the end of the grid isn't a duplicate.
      next.splice(index + 1, 0, copy);
      return { experiments: next };
    });
    return newId;
  },

  renameExperiment: (id, name) =>
    set((s) => ({ experiments: patchOne(s.experiments, id, (exp) => ({ ...exp, name })) })),

  deleteExperiment: (id) => set((s) => ({ experiments: s.experiments.filter((exp) => exp.id !== id) })),

  clearExperiment: (id) =>
    set((s) => ({
      experiments: patchOne(s.experiments, id, (exp) => ({
        ...exp,
        colors: {},
        fonts: {},
        radius: undefined,
      })),
    })),

  reorderExperiments: (activeId, overId) =>
    set((s) => {
      const oldIndex = s.experiments.findIndex((exp) => exp.id === activeId);
      const newIndex = s.experiments.findIndex((exp) => exp.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return s;
      return { experiments: arrayMove(s.experiments, oldIndex, newIndex) };
    }),

  setExperimentColor: (id, role, hex) =>
    set((s) => ({
      experiments: patchOne(s.experiments, id, (exp) => {
        const colors = { ...exp.colors };
        // null clears the override rather than storing an empty string —
        // resolveExperimentTokens falls back on *absence*, so a "" would
        // resolve to a real, invalid CSS value instead of the base token.
        if (hex === null) delete colors[role];
        else colors[role] = hex;
        return { ...exp, colors };
      }),
    })),

  setExperimentFont: (id, role, family) =>
    set((s) => ({
      experiments: patchOne(s.experiments, id, (exp) => {
        const fonts = { ...exp.fonts };
        if (family === null) delete fonts[role];
        else fonts[role] = family;
        return { ...exp, fonts };
      }),
    })),

  setExperimentRadius: (id, radius) =>
    set((s) => ({ experiments: patchOne(s.experiments, id, (exp) => ({ ...exp, radius })) })),

  setExperimentGroups: (id, groupIds) =>
    set((s) => ({ experiments: patchOne(s.experiments, id, (exp) => ({ ...exp, visibleGroups: groupIds })) })),

  addSwatches: (swatches) =>
    set((s) => {
      // De-duplicated by id: the clipboard import flow can legitimately be
      // run twice over an overlapping selection, and a tray full of repeats
      // is worse than a no-op.
      const existing = new Set(s.swatches.map((sw) => sw.id));
      const additions = swatches.filter((sw) => !existing.has(sw.id));
      return additions.length ? { swatches: [...s.swatches, ...additions] } : s;
    }),

  removeSwatch: (id) => set((s) => ({ swatches: s.swatches.filter((sw) => sw.id !== id) })),

  addFonts: (fonts) =>
    set((s) => {
      const existing = new Set(s.fonts.map((f) => f.id));
      const additions = fonts.filter((f) => !existing.has(f.id));
      return additions.length ? { fonts: [...s.fonts, ...additions] } : s;
    }),

  removeFont: (id) => set((s) => ({ fonts: s.fonts.filter((f) => f.id !== id) })),
}));

// ---------------------------------------------------------------------------
// Granular selectors — use these, not `usePlaygroundStore((s) => s.experiments)`
// ---------------------------------------------------------------------------

/** Subscribes to the *order* only. Reordering or adding re-renders the grid
 *  shell; editing a card's tokens does not, because the ids are unchanged. */
export function useExperimentIds(): string[] {
  return usePlaygroundStore(useShallow((s) => s.experiments.map((exp) => exp.id)));
}

/** Subscribes to one card. Returns the stable object identity `patchOne`
 *  preserves for untouched experiments, so sibling cards never re-render. */
export function useExperiment(id: string): Experiment | undefined {
  return usePlaygroundStore((s) => s.experiments.find((exp) => exp.id === id));
}

export function useExperimentCount(): number {
  return usePlaygroundStore((s) => s.experiments.length);
}
