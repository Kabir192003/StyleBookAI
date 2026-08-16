/**
 * The panel that opens when something in the canvas is clicked.
 *
 * It has two shapes, because the canvas contains two genuinely different
 * kinds of thing and pretending otherwise would mean showing a background
 * colour picker for a headline:
 *
 *   - **A component** (button, card, input, …) has a `ComponentTokenSet`:
 *     background, text, border, and overrides for its hover / active /
 *     disabled / focus states. Edited through the same `ComponentEditor` the
 *     AI results page uses, and written to
 *     `designSystem[variant].components[name]`.
 *   - **A type role** (display, heading, body) has a typeface. Edited by
 *     picking from the whole font catalogue, and written to
 *     `StudioState.headFont` / `.bodyFont`.
 *
 * Both then share a "whole system" block — radius and the type scale — which
 * is labelled as system-wide rather than quietly mixed in. A user who edits
 * "radius" from inside a panel headed "Primary button" and watches every card
 * and input change shape too has been misled by the UI; the honest fix is the
 * label, not hiding the control, because the radius genuinely is one token and
 * inventing a per-component one would mean emitting tokens no export has a
 * slot for.
 *
 * Everything writes through callbacks, so undo/redo and dirty-tracking stay
 * entirely `StudioBuilder`'s concern.
 */
"use client";

import { X } from "lucide-react";
import { ComponentEditor, type NonDefaultState } from "@/components/design-system/ComponentEditor";
import { FontPicker } from "./FontPicker";
import { COMPONENT_LABELS, TYPE_ROLE_LABELS, type Selection } from "@/lib/studio/componentSelection";
import type { ComponentTokenSet } from "@/types/designSystem";
import type { TypeScale } from "@/types/theme";

export function ComponentInspector({
  selection,
  variant,
  tokens,
  radius,
  headFont,
  bodyFont,
  typeScale,
  previewState,
  onPreviewStateChange,
  onTokensChange,
  onRadiusChange,
  onHeadFontChange,
  onBodyFontChange,
  onBaseSizeChange,
  onClose,
}: {
  selection: Selection;
  variant: "light" | "dark";
  /** Null while the selection is a type role, which has no component tokens. */
  tokens: ComponentTokenSet | null;
  radius: number;
  headFont: string;
  bodyFont: string;
  typeScale: TypeScale;
  /** Which state the canvas is currently forcing onto the selected instance. */
  previewState: NonDefaultState | null;
  onPreviewStateChange: (state: NonDefaultState | null) => void;
  onTokensChange: (next: ComponentTokenSet) => void;
  onRadiusChange: (next: number) => void;
  onHeadFontChange: (next: string) => void;
  onBodyFontChange: (next: string) => void;
  onBaseSizeChange: (next: number) => void;
  onClose: () => void;
}) {
  const isType = selection.kind === "type";
  const title = isType ? TYPE_ROLE_LABELS[selection.role] : COMPONENT_LABELS[selection.name];
  // Display and heading share the display face — the system has two faces,
  // not seven, and the picker must write to the one actually in use.
  const usesBodyFace = isType && selection.role === "body";

  return (
    <aside
      className="flex flex-col gap-4 border-t border-black/[0.18] bg-[#F2EBE0] px-4 py-4 lg:sticky lg:top-[105px] lg:max-h-[calc(100vh-105px)] lg:overflow-y-auto lg:border-l lg:border-t-0"
      aria-label={`${title} settings`}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono-plex text-[10px] uppercase tracking-[0.18em] text-[#222D52]">Selected</p>
          <h2 className="mt-0.5 truncate text-[15px] font-medium text-[#211E18]">{title}</h2>
          <p className="mt-0.5 text-[11px] text-[#8A8477]">
            {isType
              ? usesBodyFace
                ? "Uses the body typeface"
                : "Uses the display typeface"
              : // Which theme variant is being written is not cosmetic —
                // editing in Dark and expecting Light to change is an easy and
                // silent mistake, so the panel says so rather than leaving it
                // implied by a toggle at the other end of the page.
                `Editing the ${variant} variant`}
          </p>
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

      {isType ? (
        <section>
          <h3 className="font-mono-plex mb-2 text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Typeface</h3>
          {usesBodyFace ? (
            <FontPicker label="Body font" value={bodyFont} onChange={onBodyFontChange} />
          ) : (
            <FontPicker label="Display font" value={headFont} onChange={onHeadFontChange} />
          )}
        </section>
      ) : (
        tokens && (
          <section>
            <h3 className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">This component</h3>
            <ComponentEditor
              tokens={tokens}
              onChange={onTokensChange}
              previewState={previewState}
              onPreviewStateChange={onPreviewStateChange}
            />
          </section>
        )
      )}

      <section className="border-t border-black/[0.1] pt-3">
        <h3 className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Whole system</h3>
        <p className="mt-1 text-[10px] leading-snug text-[#B4AD9E]">
          Single system tokens. Changing one moves every component that uses it, not just this one.
        </p>

        <label className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[#6E675C]">
          <span>Corner radius</span>
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

        <label className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[#6E675C]">
          <span>Base text size</span>
          <span className="font-mono-plex text-[10px] text-[#8A8477]">{typeScale.baseSize}px</span>
        </label>
        <input
          type="range"
          min={12}
          max={24}
          value={typeScale.baseSize}
          onChange={(e) => onBaseSizeChange(Number(e.target.value))}
          className="mt-1 w-full accent-[#222D52]"
          aria-label="Base text size"
        />

        {/* The other face is still reachable from here, so a user who clicked a
            button rather than a heading is not sent back to the canvas to find
            one before they can change a typeface. */}
        {!isType && (
          <div className="mt-3 flex flex-col gap-3">
            <FontPicker label="Display font" value={headFont} onChange={onHeadFontChange} />
            <FontPicker label="Body font" value={bodyFont} onChange={onBodyFontChange} />
          </div>
        )}
      </section>
    </aside>
  );
}
