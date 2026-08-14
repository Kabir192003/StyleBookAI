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
import { ComponentTokenSet } from "@/types/designSystem";

/** The states a component can override. "default" is the token set itself, so
 *  it is deliberately absent here. Mirrors COMPONENT_STATES in
 *  lib/export/designTokens.ts — the export writes exactly these four. */
export const NON_DEFAULT_STATES = ["hover", "active", "disabled", "focus"] as const;

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
        <span className="font-mono-plex text-[10px] text-[#8A8477]">{value}</span>
      </span>
    </label>
  );
}

export function ComponentEditor({
  tokens,
  onChange,
}: {
  tokens: ComponentTokenSet;
  onChange: (next: ComponentTokenSet) => void;
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

      <button
        type="button"
        onClick={() => setStatesOpen((v) => !v)}
        className="mt-2 font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#8A8477]"
      >
        {statesOpen ? "▾" : "▸"} States
      </button>
      {statesOpen && (
        <div className="mt-1.5 space-y-2.5">
          {NON_DEFAULT_STATES.map((state) => {
            const enabled = Boolean(tokens.states?.[state]);
            const override = tokens.states?.[state];
            return (
              <div key={state} className="rounded-md bg-black/[0.03] p-2">
                <label className="flex items-center gap-1.5 text-[10px] capitalize text-[#6E675C]">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      const nextStates = { ...tokens.states };
                      if (e.target.checked) {
                        nextStates[state] = { background: tokens.background, text: tokens.text, border: tokens.border };
                      } else {
                        delete nextStates[state];
                      }
                      onChange({ ...tokens, states: nextStates });
                    }}
                    className="h-3 w-3 accent-[#222D52]"
                  />
                  {state}
                </label>
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
