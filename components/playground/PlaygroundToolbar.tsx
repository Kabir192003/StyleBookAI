/**
 * The playground's top bar: what system the experiments are being derived
 * from, and the one action P1 owns (add an experiment). P3 mounts its swatch
 * and font trays and the contrast readout alongside this; P4 adds "Apply to
 * design system" and "Save playground". Kept as its own component so those
 * batches extend a toolbar rather than editing the canvas.
 */
"use client";

import { Plus } from "lucide-react";
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import { useExperimentCount, usePlaygroundStore } from "@/store/playgroundStore";

export function PlaygroundToolbar({ base, isDerivedFromAI }: { base: StudioExportTokens; isDerivedFromAI: boolean }) {
  const addExperiment = usePlaygroundStore((s) => s.addExperiment);
  const count = useExperimentCount();

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] px-5 py-4">
      <div className="min-w-0">
        <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#222D52]">Design playground</p>
        <h1 className="mt-1 text-[22px] leading-tight text-[#211E18]">
          {count} experiment{count === 1 ? "" : "s"} on {base.name}
        </h1>
        <p className="mt-1 text-[12px] text-[#6E675C]">
          {isDerivedFromAI
            ? "Derived from your latest generated system."
            : // Says so out loud rather than silently showing stock colours —
              // a user who expected their brand here needs to know why it
              // isn't, and where to go to get it.
              "No generated system in this session — showing Studio's starting tokens. Generate one in AI Generate to experiment on your own brand."}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Every role left unassigned falls through to the base system, so a
            brand-new card is a working copy of the current design, not an
            empty shell you have to fill in before anything renders. */}
        <button
          type="button"
          onClick={() => addExperiment()}
          className="font-mono-plex inline-flex items-center gap-2 rounded-full bg-[#222D52] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[#F2EBE0]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add experiment
        </button>
      </div>
    </div>
  );
}
