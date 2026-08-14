/**
 * The colour tray (docs/DESIGN_PLAYGROUND.md §3, §4): every colour available
 * to the experiments on the board — the generated system's own palette, plus
 * anything added from the in-app clipboard, an OS paste, or the custom
 * picker.
 *
 * Multi-select is not decoration. The role popovers inside each experiment
 * card put the selected swatches first, so the tray is how a user narrows
 * "every colour I have" down to "the four I'm deciding between" before they
 * start assigning. Selection lives in lib/playground/traySelectionStore.ts,
 * separate from `PlaygroundState`, because it is a view concern and must
 * never reach P4's apply step.
 */
"use client";

import { useState } from "react";
import { Check, ClipboardPaste, Pipette, X } from "lucide-react";
import { CustomColorPicker } from "./CustomColorPicker";
import { makeSwatch } from "@/lib/playground/traySources";
import {
  useIsSwatchSelected,
  useSelectedSwatchIds,
  useTraySelectionStore,
} from "@/lib/playground/traySelectionStore";
import type { PlaygroundSwatch } from "@/lib/playground/types";
import { usePlaygroundStore } from "@/store/playgroundStore";

/** Readable ink for the tick drawn on top of a swatch. Deliberately the
 *  crude luminance test and not `getContrastRatio`: this is a 10px glyph on
 *  a 28px chip, not a token pair anyone will measure. */
function tickColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const luma = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return luma > 150 ? "#211E18" : "#FFFFFF";
}

function SwatchChip({ swatch }: { swatch: PlaygroundSwatch }) {
  const selected = useIsSwatchSelected(swatch.id);
  const toggleSwatch = useTraySelectionStore((s) => s.toggleSwatch);
  const forgetSwatch = useTraySelectionStore((s) => s.forgetSwatch);
  const removeSwatch = usePlaygroundStore((s) => s.removeSwatch);

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => toggleSwatch(swatch.id)}
        title={`${swatch.name} · ${swatch.hex}`}
        aria-pressed={selected}
        className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 transition-colors ${
          selected ? "border-[#222D52] bg-[#222D52]/[0.08]" : "border-black/[0.14] bg-white/50 hover:border-black/30"
        }`}
      >
        <span
          className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-black/[0.14]"
          style={{ backgroundColor: swatch.hex }}
        >
          {selected && <Check className="h-2.5 w-2.5" style={{ color: tickColor(swatch.hex) }} aria-hidden="true" />}
        </span>
        <span className="font-mono-plex text-[10px] uppercase tracking-[0.06em] text-[#211E18]">{swatch.hex}</span>
      </button>

      {/* System swatches have no remove affordance: they are re-seeded from
          the base system on every mount, so removing one would silently come
          back and read as a bug. Everything the user added, they can drop. */}
      {swatch.origin !== "system" && (
        <button
          type="button"
          onClick={() => {
            removeSwatch(swatch.id);
            forgetSwatch(swatch.id);
          }}
          aria-label={`Remove ${swatch.hex} from the tray`}
          className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[#211E18] text-[#F2EBE0] group-hover:flex"
        >
          <X className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function SwatchTray({ onOpenImport }: { onOpenImport: () => void }) {
  const swatches = usePlaygroundStore((s) => s.swatches);
  const addSwatches = usePlaygroundStore((s) => s.addSwatches);
  const selectedIds = useSelectedSwatchIds();
  const clearSwatchSelection = useTraySelectionStore((s) => s.clearSwatchSelection);
  const toggleSwatch = useTraySelectionStore((s) => s.toggleSwatch);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">
          Colours
          <span className="ml-2 text-[#B4AD9E]">{swatches.length}</span>
        </h2>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={clearSwatchSelection}
            className="font-mono-plex text-[10px] uppercase tracking-[0.12em] text-[#222D52] underline-offset-2 hover:underline"
          >
            {selectedIds.length} selected — clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="font-mono-plex inline-flex items-center gap-1.5 rounded-full border border-black/[0.16] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#211E18] hover:bg-black/[0.04]"
          >
            <Pipette className="h-3 w-3" aria-hidden="true" />
            Custom
          </button>
          <button
            type="button"
            onClick={onOpenImport}
            className="font-mono-plex inline-flex items-center gap-1.5 rounded-full border border-black/[0.16] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#211E18] hover:bg-black/[0.04]"
          >
            <ClipboardPaste className="h-3 w-3" aria-hidden="true" />
            Paste
          </button>
        </div>
      </div>

      {pickerOpen && (
        <div className="mt-2 max-w-[380px]">
          <CustomColorPicker
            onAdd={(hex) => {
              const swatch = makeSwatch(hex, hex, "custom");
              addSwatches([swatch]);
              // Auto-selected: someone who just mixed a colour by hand is
              // about to assign it, and making them click it again in the
              // tray is a step with no decision in it.
              if (!selectedIds.includes(swatch.id)) toggleSwatch(swatch.id);
            }}
            onClose={() => setPickerOpen(false)}
          />
        </div>
      )}

      <div className="mt-2 flex max-h-[92px] flex-wrap gap-1.5 overflow-y-auto pr-1">
        {swatches.length === 0 ? (
          <p className="text-[12px] text-[#8A8477]">No colours yet.</p>
        ) : (
          swatches.map((swatch) => <SwatchChip key={swatch.id} swatch={swatch} />)
        )}
      </div>
    </section>
  );
}
