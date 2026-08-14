/**
 * The panel that opens when a component in the canvas is clicked.
 *
 * Two clearly separated halves, and the separation is the whole design:
 *
 *   1. **This component** — its `ComponentTokenSet` (background / text /
 *      border, plus the four state overrides), edited through the exact same
 *      `ComponentEditor` the AI results page uses. Writes to
 *      `designSystem[variant].components[name]`.
 *   2. **The whole system** — radius and the two font families. These are
 *      `StudioState` fields, so changing them here moves every component in
 *      the canvas, not just the selected one.
 *
 * Half 2 is labelled as system-wide rather than quietly mixed in with half 1.
 * A user who edits "radius" from inside a panel headed "Primary button" and
 * watches every card and input change shape too has been misled by the UI,
 * and the fix for that is honest labelling, not hiding the control — the
 * radius genuinely is one system token, and pretending each component owns
 * its own would mean inventing tokens the export has no slot for.
 *
 * Everything here writes through the callbacks it is given, so undo/redo and
 * dirty-tracking stay entirely `StudioBuilder`'s concern.
 */
"use client";

import { X } from "lucide-react";
import { ComponentEditor } from "@/components/design-system/ComponentEditor";
import { COMPONENT_LABELS } from "@/lib/studio/componentSelection";
import type { ComponentName, ComponentTokenSet } from "@/types/designSystem";

export function ComponentInspector({
  name,
  variant,
  tokens,
  radius,
  headFont,
  bodyFont,
  fontOptions,
  onTokensChange,
  onRadiusChange,
  onHeadFontChange,
  onBodyFontChange,
  onClose,
}: {
  name: ComponentName;
  variant: "light" | "dark";
  tokens: ComponentTokenSet;
  radius: number;
  headFont: string;
  bodyFont: string;
  fontOptions: string[];
  onTokensChange: (next: ComponentTokenSet) => void;
  onRadiusChange: (next: number) => void;
  onHeadFontChange: (next: string) => void;
  onBodyFontChange: (next: string) => void;
  onClose: () => void;
}) {
  return (
    <aside
      className="flex w-[268px] flex-none flex-col gap-4 overflow-y-auto border-l border-black/[0.18] bg-[#F2EBE0] px-4 py-4"
      aria-label={`${COMPONENT_LABELS[name]} settings`}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono-plex text-[10px] uppercase tracking-[0.18em] text-[#222D52]">Selected</p>
          <h2 className="mt-0.5 truncate text-[15px] font-medium text-[#211E18]">{COMPONENT_LABELS[name]}</h2>
          {/* Which theme variant is being written is not cosmetic — editing
              in Dark and expecting Light to change is an easy and silent
              mistake, so the panel says so rather than leaving it implied by
              the toggle at the other end of the page. */}
          <p className="mt-0.5 text-[11px] text-[#8A8477]">Editing the {variant} variant</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspector"
          className="rounded p-1 text-[#B4AD9E] hover:text-[#211E18]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <section>
        <h3 className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">This component</h3>
        <ComponentEditor tokens={tokens} onChange={onTokensChange} />
      </section>

      <section className="border-t border-black/[0.1] pt-3">
        <h3 className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Whole system</h3>
        <p className="mt-1 text-[10px] leading-snug text-[#B4AD9E]">
          These are single system tokens. Changing one moves every component that uses it, not just this one.
        </p>

        <label className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[#6E675C]">
          <span>Radius</span>
          <span className="font-mono-plex text-[10px] text-[#8A8477]">{radius}px</span>
        </label>
        <input
          type="range"
          min={0}
          max={24}
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="mt-1 w-full accent-[#222D52]"
          aria-label="Corner radius"
        />

        <label className="mt-3 block text-[11px] text-[#6E675C]">
          Display font
          <select
            value={headFont}
            onChange={(e) => onHeadFontChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/[0.16] bg-white px-2 py-1.5 text-[12px] text-[#211E18]"
          >
            {fontOptions.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-2.5 block text-[11px] text-[#6E675C]">
          Body font
          <select
            value={bodyFont}
            onChange={(e) => onBodyFontChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/[0.16] bg-white px-2 py-1.5 text-[12px] text-[#211E18]"
          >
            {fontOptions.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>
      </section>
    </aside>
  );
}
