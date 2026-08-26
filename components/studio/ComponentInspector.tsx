// Two shapes, because the canvas holds two genuinely different kinds of
// thing: a component (button, card, input) has a ComponentTokenSet edited
// through the same ComponentEditor the AI results page uses, written to
// designSystem[variant].components[name]; a type role (display, heading,
// body) has a typeface, written to StudioState.headFont/.bodyFont. Both
// share a "whole system" block (radius, type scale) labeled as system-wide
// rather than mixed in quietly — radius is genuinely one token, and a
// per-component one would mean emitting tokens no export has a slot for.
// Everything writes through callbacks, so undo/redo and dirty-tracking stay
// StudioBuilder's concern.
"use client";

import { X } from "lucide-react";
import { ColorField, ComponentEditor, type NonDefaultState } from "@/components/design-system/ComponentEditor";
import { FontPicker } from "./FontPicker";
import {
  APPLICABLE_STATES,
  COMPONENT_LABELS,
  COMPONENT_SCOPE_NOTES,
  TYPE_ROLE_LABELS,
  type Selection,
} from "@/lib/studio/componentSelection";
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
  inkColor,
  mutedColor,
  previewState,
  onPreviewStateChange,
  onTokensChange,
  onRadiusChange,
  onHeadFontChange,
  onBodyFontChange,
  onBaseSizeChange,
  onInkChange,
  onMutedChange,
  onClose,
}: {
  selection: Selection;
  variant: "light" | "dark";
  // Null while the selection is a type role, which has no component tokens.
  tokens: ComponentTokenSet | null;
  radius: number;
  headFont: string;
  bodyFont: string;
  typeScale: TypeScale;
  // Resolved palette text colours. Type roles have no colour token of their
  // own — every heading reads --pgc-ink and captions read --pgc-muted — so
  // editing text colour here edits the palette rather than inventing a
  // per-role token no export format has a slot for.
  inkColor: string;
  mutedColor: string;
  // Which state the canvas is currently forcing onto the selected instance.
  previewState: NonDefaultState | null;
  onPreviewStateChange: (state: NonDefaultState | null) => void;
  onTokensChange: (next: ComponentTokenSet) => void;
  onRadiusChange: (next: number) => void;
  onHeadFontChange: (next: string) => void;
  onBodyFontChange: (next: string) => void;
  onBaseSizeChange: (next: number) => void;
  onInkChange: (hex: string) => void;
  onMutedChange: (hex: string) => void;
  onClose: () => void;
}) {
  const isType = selection.kind === "type";
  const title = isType ? TYPE_ROLE_LABELS[selection.role] : COMPONENT_LABELS[selection.name];
  // Display and heading share the display face — only two faces exist, and
  // the picker must write to the one actually in use.
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
          <p className="mt-0.5 text-[11px] text-[#6E675C]">
            {isType
              ? usesBodyFace
                ? "Uses the body typeface"
                : "Uses the display typeface"
              : // Says which variant is being edited outright, since editing
                // Dark while expecting Light to change is an easy silent mistake.
                `Editing the ${variant} variant`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspector"
          className="rounded p-1 text-[#6E675C] hover:text-[#211E18]"
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

          <h3 className="font-mono-plex mb-1 mt-4 text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Text colour</h3>
          <p className="mb-2 text-[11px] leading-snug text-[#6E675C]">
            {usesBodyFace
              ? "Body and captions read the palette's text colours, so this moves every piece of body copy, not just this one."
              : "Headings read the palette's text colour, so this moves every heading, not just this one."}
          </p>
          <div className="space-y-1.5">
            <ColorField label="text" value={inkColor} onChange={onInkChange} />
            {usesBodyFace && <ColorField label="muted text" value={mutedColor} onChange={onMutedChange} />}
          </div>
        </section>
      ) : (
        tokens && (
          <section>
            <h3 className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">This component</h3>
            {!isType && COMPONENT_SCOPE_NOTES[selection.name] && (
              <p className="mt-0.5 text-[11px] leading-snug text-[#6E675C]">{COMPONENT_SCOPE_NOTES[selection.name]}</p>
            )}
            <ComponentEditor
              tokens={tokens}
              onChange={onTokensChange}
              previewState={previewState}
              onPreviewStateChange={onPreviewStateChange}
              applicableStates={!isType ? APPLICABLE_STATES[selection.name] : undefined}
            />
          </section>
        )
      )}

      <section className="border-t border-black/[0.1] pt-3">
        <h3 className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Whole system</h3>
        <p className="mt-1 text-[10px] leading-snug text-[#6E675C]">
          Single system tokens. Changing one moves every component that uses it, not just this one.
        </p>

        <label className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[#6E675C]">
          <span>Corner radius</span>
          <span className="font-mono-plex text-[10px] text-[#6E675C]">{radius}px</span>
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
          <span className="font-mono-plex text-[10px] text-[#6E675C]">{typeScale.baseSize}px</span>
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

        {/* Keeps both faces reachable here so clicking a button doesn't require going back to the canvas for a typeface. */}
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
