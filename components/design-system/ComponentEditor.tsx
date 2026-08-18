/**
 * The per-component token editor: background / text / border, plus optional
 * overrides for the four non-default states.
 *
 * Extracted from DesignSystemGallery so the Studio inspector and the AI
 * results page edit component tokens through exactly the same control. That
 * shared identity is the point — "click a button in the canvas" and "edit the
 * button card in the gallery" must not be able to drift into two editors that
 * offer different properties for the same token set.
 *
 * Writes a whole `ComponentTokenSet` back on every change rather than
 * patching a field, so the caller decides where it lands (StudioState for the
 * inspector, the DesignSystem object for the gallery) and undo/redo stays the
 * caller's concern.
 */
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ComponentTokenSet } from "@/types/designSystem";

/** The states a component can override. "default" is the token set itself, so
 *  it is deliberately absent here. Mirrors COMPONENT_STATES in
 *  lib/export/designTokens.ts — the export writes exactly these four. */
export const NON_DEFAULT_STATES = ["hover", "active", "disabled", "focus"] as const;
export type NonDefaultState = (typeof NON_DEFAULT_STATES)[number];

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px] text-[#6E675C]">
      <span className="capitalize">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-5 w-5 cursor-pointer rounded border border-black/[0.15] bg-transparent p-0"
        />
        <span className="font-mono-plex text-[10px] text-[#6E675C]">{value}</span>
      </span>
    </label>
  );
}

export function ComponentEditor({
  tokens,
  onChange,
  previewState,
  onPreviewStateChange,
  applicableStates = NON_DEFAULT_STATES,
}: {
  tokens: ComponentTokenSet;
  onChange: (next: ComponentTokenSet) => void;
  /** Which state's colours the canvas is currently forcing onto the selected
   *  instance, so a hover/active/disabled/focus edit is visible without
   *  actually having to hover, click-and-hold, or tab to it. Only the Studio
   *  inspector passes this — DesignSystemGallery has no live canvas to
   *  preview against, so the button is simply absent there. */
  previewState?: NonDefaultState | null;
  onPreviewStateChange?: (state: NonDefaultState | null) => void;
  /** Which of the four states actually have a real CSS rule behind them for
   *  this component (see lib/studio/componentSelection.ts's
   *  APPLICABLE_STATES) — a state with no live target on canvas is never
   *  offered, so the control can't claim to do something the canvas won't
   *  show. Defaults to all four for callers that don't know their
   *  component's identity. */
  applicableStates?: readonly NonDefaultState[];
}) {
  const [statesOpen, setStatesOpen] = useState(false);

  return (
    <div className="mt-3 space-y-1.5 border-t border-black/[0.08] pt-3">
      <ColorField label="background" value={tokens.background} onChange={(hex) => onChange({ ...tokens, background: hex })} />
      <ColorField label="text" value={tokens.text} onChange={(hex) => onChange({ ...tokens, text: hex })} />
      <ColorField
        label="border"
        value={tokens.border ?? tokens.background}
        onChange={(hex) => onChange({ ...tokens, border: hex })}
      />

      {applicableStates.length > 0 && (
        <button
          type="button"
          onClick={() => setStatesOpen((v) => !v)}
          className="mt-2 font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]"
        >
          {statesOpen ? "▾" : "▸"} States
        </button>
      )}
      {statesOpen && applicableStates.length > 0 && (
        <div className="mt-1.5 space-y-2.5">
          {applicableStates.map((state) => {
            const enabled = Boolean(tokens.states?.[state]);
            const override = tokens.states?.[state];
            const previewing = previewState === state;
            return (
              <div key={state} className="rounded-md bg-black/[0.03] p-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-[10px] capitalize text-[#6E675C]">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => {
                        const nextStates = { ...tokens.states };
                        if (e.target.checked) {
                          // Empty, not a clone of the default colours: the
                          // fields below still *display* the default (via
                          // their own `?? tokens.x` fallback) as a starting
                          // point to edit from, but nothing is actually
                          // stored as a real override — and therefore
                          // nothing on canvas changes — until a field is
                          // genuinely picked. A clone here made every newly
                          // enabled state look identical to the default,
                          // which reads as "this state does nothing."
                          nextStates[state] = {};
                        } else {
                          delete nextStates[state];
                        }
                        onChange({ ...tokens, states: nextStates });
                      }}
                      className="h-3 w-3 accent-[#222D52]"
                    />
                    {state}
                  </label>
                  {onPreviewStateChange && (
                    <button
                      type="button"
                      onClick={() => onPreviewStateChange(previewing ? null : state)}
                      aria-pressed={previewing}
                      title={previewing ? `Stop previewing ${state}` : `Preview ${state} on the canvas`}
                      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] ${
                        previewing ? "bg-[#222D52] text-[#F2EBE0]" : "text-[#6E675C] hover:text-[#6E675C]"
                      }`}
                    >
                      {previewing ? <Eye className="h-3 w-3" aria-hidden="true" /> : <EyeOff className="h-3 w-3" aria-hidden="true" />}
                      {previewing ? "Previewing" : "Preview"}
                    </button>
                  )}
                </div>
                {enabled && override && (
                  <div className="mt-1.5 space-y-1">
                    <ColorField
                      label="background"
                      value={override.background ?? tokens.background}
                      onChange={(hex) =>
                        onChange({ ...tokens, states: { ...tokens.states, [state]: { ...override, background: hex } } })
                      }
                    />
                    <ColorField
                      label="text"
                      value={override.text ?? tokens.text}
                      onChange={(hex) =>
                        onChange({ ...tokens, states: { ...tokens.states, [state]: { ...override, text: hex } } })
                      }
                    />
                    <ColorField
                      label="border"
                      value={override.border ?? tokens.border ?? tokens.background}
                      onChange={(hex) =>
                        onChange({ ...tokens, states: { ...tokens.states, [state]: { ...override, border: hex } } })
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
