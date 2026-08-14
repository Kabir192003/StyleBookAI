/**
 * One experiment on the playground canvas.
 *
 * The whole feature lives in ~15 lines of this file: a scoped <style> block
 * from lib/playground/resolveExperiment.ts, and a `[data-pg-exp="<id>"]`
 * wrapper containing the *shared* component library. The components are
 * byte-identical React in every card — they resolve different custom
 * properties because they sit inside different scopes. That's requirement 18
 * (one component set, many themes) satisfied structurally rather than by
 * convention: there is no code path by which a component could hard-code a
 * per-experiment style, because it is never told which experiment it's in.
 *
 * Subscribes to a single experiment via `useExperiment(id)`, so editing one
 * card leaves its siblings' React trees untouched.
 */
"use client";

import { memo, useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2, Eraser } from "lucide-react";
import { PLAYGROUND_COMPONENT_GROUPS } from "@/components/playground/components";
import { experimentCss } from "@/lib/playground/resolveExperiment";
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import { useExperiment, usePlaygroundStore } from "@/store/playgroundStore";

function ExperimentCardInner({ id, base }: { id: string; base: StudioExportTokens }) {
  const experiment = useExperiment(id);
  const renameExperiment = usePlaygroundStore((s) => s.renameExperiment);
  const duplicateExperiment = usePlaygroundStore((s) => s.duplicateExperiment);
  const deleteExperiment = usePlaygroundStore((s) => s.deleteExperiment);
  const clearExperiment = usePlaygroundStore((s) => s.clearExperiment);
  const [editingName, setEditingName] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  // Regenerated only when this card's own overrides (or the base system)
  // change — the CSS string is the expensive part of a card render, and it
  // is fully determined by those two inputs.
  const css = useMemo(() => (experiment ? experimentCss(base, experiment) : ""), [base, experiment]);

  // Deleting a card unmounts it, but a stale render can still land between
  // the store update and the unmount; bail rather than crash on undefined.
  if (!experiment) return null;

  const overrideCount =
    Object.keys(experiment.colors).length +
    Object.keys(experiment.fonts).length +
    (experiment.radius === undefined ? 0 : 1);

  const groups = experiment.visibleGroups?.length
    ? PLAYGROUND_COMPONENT_GROUPS.filter((g) => experiment.visibleGroups!.includes(g.id))
    : PLAYGROUND_COMPONENT_GROUPS;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/[0.12] bg-[#F2EBE0]"
    >
      {/* dangerouslySetInnerHTML, not a text child — a <style> text child gets
          HTML-entity-escaped differently between SSR and hydration and trips a
          hydration mismatch (same reason and same fix as
          components/studio/LivePreviewSection.tsx). Safe: `css` is our own
          generated token CSS, and the only interpolated identifier is the
          store-generated experiment id, never user text. */}
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header className="flex items-center gap-1.5 border-b border-black/[0.1] px-3 py-2.5">
        <button
          type="button"
          className="cursor-grab rounded p-1 text-[#B4AD9E] active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${experiment.name}`}
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        {editingName ? (
          <input
            autoFocus
            defaultValue={experiment.name}
            onBlur={(e) => {
              // Empty names make the card unidentifiable in the grid and in
              // P4's apply-confirmation diff, so a blank reverts.
              const next = e.target.value.trim();
              if (next) renameExperiment(id, next);
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditingName(false);
            }}
            className="min-w-0 flex-1 rounded border border-black/[0.16] bg-white px-2 py-1 text-[13px] text-[#211E18] outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            title="Rename"
            className="min-w-0 flex-1 truncate text-left text-[13px] font-medium text-[#211E18]"
          >
            {experiment.name}
          </button>
        )}

        <span className="font-mono-plex shrink-0 text-[9px] uppercase tracking-[0.12em] text-[#B4AD9E]">
          {overrideCount === 0 ? "base" : `${overrideCount} override${overrideCount === 1 ? "" : "s"}`}
        </span>

        <button
          type="button"
          onClick={() => clearExperiment(id)}
          disabled={overrideCount === 0}
          className="rounded p-1 text-[#B4AD9E] hover:text-[#211E18] disabled:opacity-40"
          aria-label={`Clear overrides on ${experiment.name}`}
          title="Clear overrides"
        >
          <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => duplicateExperiment(id)}
          className="rounded p-1 text-[#B4AD9E] hover:text-[#211E18]"
          aria-label={`Duplicate ${experiment.name}`}
          title="Duplicate"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => deleteExperiment(id)}
          className="rounded p-1 text-[#B4AD9E] hover:text-[#B23B3B]"
          aria-label={`Delete ${experiment.name}`}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </header>

      {/* The scope. Everything below resolves this experiment's tokens; the
          chrome above deliberately sits outside it so the card's own UI stays
          legible no matter how extreme the experiment's palette gets. */}
      <div
        data-pg-exp={id}
        className="flex-1 overflow-y-auto p-4"
        style={{
          background: "var(--pg-background)",
          color: "var(--pg-text)",
          fontFamily: "var(--pg-font-body)",
        }}
      >
        {groups.length === 0 ? (
          <p className="text-[12px] text-[#8A8477]">No component groups selected.</p>
        ) : (
          <div className="flex flex-col gap-7">
            {groups.map((group) => (
              <section key={group.id}>
                <h3
                  className="font-mono-plex mb-3 text-[9px] uppercase tracking-[0.18em]"
                  style={{ color: "var(--pg-muted)" }}
                >
                  {group.label}
                </h3>
                <group.Component />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// memo + the granular `useExperiment` subscription is what keeps a token
// edit in one card from re-rendering the whole board: the grid passes only
// `id` and the shared `base`, both stable across a sibling's edit.
export const ExperimentCard = memo(ExperimentCardInner);
