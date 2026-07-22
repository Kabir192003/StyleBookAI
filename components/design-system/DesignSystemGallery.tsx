/**
 * Renders the optional `designSystem` block from an AI Generate result —
 * component tokens/states, a light/dark toggle, accessibility notes, icon
 * style, and grid/breakpoints. Shared between the AI results page
 * (components/ai/PromptInput.tsx, always read-only) and Studio
 * (components/studio/StudioBuilder.tsx, `editable` there so every token
 * that's editable elsewhere in Studio is editable here too) once a project
 * carries a designSystem.
 *
 * Styled to the site's one light editorial theme (bg-[#F2EBE0] cards,
 * #211E18 ink, #8A8477 muted, border-black/[0.12]) — same vocabulary as
 * PromptInput.tsx and StudioBuilder.tsx, so this panel doesn't need its
 * own dark/light chrome toggle; `variant` below is the *generated design
 * system's own* light/dark theme-role toggle, unrelated to page chrome.
 *
 * Each ComponentName gets its own small mock shape (button = pill, card =
 * bordered container with a header + body lines, table = mini grid, etc.)
 * driven by its "default" tokens, so a card doesn't look like a button —
 * only the shape differs per type; the same tokens (background/text/border)
 * drive every shape. Non-default states (hover/active/disabled/focus) are
 * shown as small labeled swatches below the shape — real :hover/:active
 * can't be simulated in a static preview, so this is a legible approximation,
 * not a live component library.
 */
"use client";

import { useState } from "react";
import { DesignSystem, ComponentName, ComponentTokenSet, ThemeVariantTokens } from "@/types/designSystem";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { SpacingVisualization } from "./SpacingVisualization";
import { SpacingScale } from "@/types/designTokens";

function onColor(hex: string): string {
  return getContrastRatio(hex, "#FBF8F2") >= getContrastRatio(hex, "#141110") ? "#FBF8F2" : "#141110";
}

const COMPONENT_LABELS: Record<ComponentName, string> = {
  button: "Button",
  buttonSecondary: "Secondary button",
  input: "Input",
  dropdown: "Dropdown",
  card: "Card",
  navigation: "Navigation",
  table: "Table",
  modal: "Modal",
  alert: "Alert",
  badge: "Badge",
};

const NON_DEFAULT_STATES = ["hover", "active", "disabled", "focus"] as const;

function nonDefaultSwatches(tokens: ComponentTokenSet) {
  return NON_DEFAULT_STATES.map((state) => {
    const override = tokens.states?.[state];
    if (!override) return null;
    return {
      state,
      background: override.background ?? tokens.background,
      text: override.text ?? tokens.text,
      border: override.border ?? tokens.border,
    };
  }).filter((s): s is NonNullable<typeof s> => Boolean(s));
}

function ComponentShape({ name, tokens }: { name: ComponentName; tokens: ComponentTokenSet }) {
  const { background, text, border } = tokens;
  const borderStyle = border ? `1px solid ${border}` : undefined;

  switch (name) {
    case "button":
    case "buttonSecondary":
      return (
        <span
          className="inline-flex items-center rounded-full px-4 py-2 text-[12px] font-semibold"
          style={{ backgroundColor: background, color: text, border: borderStyle }}
        >
          {name === "button" ? "Primary action" : "Secondary"}
        </span>
      );
    case "badge":
      return (
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: background, color: text, border: borderStyle }}
        >
          Badge
        </span>
      );
    case "alert":
      return (
        <div
          className="rounded-lg px-3.5 py-2.5 text-[11px] leading-relaxed"
          style={{ backgroundColor: background, color: text, border: borderStyle }}
        >
          Something needs your attention.
        </div>
      );
    case "input":
      return (
        <div className="w-full max-w-[180px]">
          <div className="mb-1 text-[10px] opacity-60" style={{ color: text }}>
            Label
          </div>
          <div
            className="rounded-lg px-3 py-2 text-[11px]"
            style={{ backgroundColor: background, color: text, border: borderStyle ?? `1px solid ${text}22` }}
          >
            Placeholder text
          </div>
        </div>
      );
    case "dropdown":
      return (
        <div className="w-full max-w-[180px]">
          <div className="mb-1 text-[10px] opacity-60" style={{ color: text }}>
            Label
          </div>
          <div
            className="flex items-center justify-between rounded-lg px-3 py-2 text-[11px]"
            style={{ backgroundColor: background, color: text, border: borderStyle ?? `1px solid ${text}22` }}
          >
            <span>Select an option</span>
            <span aria-hidden>⌄</span>
          </div>
        </div>
      );
    case "card":
      return (
        <div
          className="w-full max-w-[200px] overflow-hidden rounded-xl"
          style={{ backgroundColor: background, color: text, border: borderStyle ?? `1px solid ${text}18` }}
        >
          <div className="h-8 w-full" style={{ backgroundColor: `${text}14` }} />
          <div className="space-y-1.5 p-3">
            <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: `${text}40` }} />
            <div className="h-2 w-1/2 rounded-full" style={{ backgroundColor: `${text}25` }} />
          </div>
        </div>
      );
    case "navigation":
      return (
        <div
          className="flex w-full max-w-[220px] items-center justify-between rounded-full px-4 py-2"
          style={{ backgroundColor: background, color: text, border: borderStyle }}
        >
          <span className="text-[11px] font-semibold">Brand</span>
          <div className="flex gap-2.5 text-[10px] opacity-70">
            <span>Home</span>
            <span>About</span>
            <span>·</span>
          </div>
        </div>
      );
    case "table":
      return (
        <div
          className="w-full max-w-[200px] overflow-hidden rounded-lg"
          style={{ border: borderStyle ?? `1px solid ${text}22` }}
        >
          <div
            className="grid grid-cols-3 gap-px text-[9px] font-semibold uppercase"
            style={{ backgroundColor: `${text}14`, color: text }}
          >
            {["Name", "Status", "Date"].map((h) => (
              <div key={h} className="px-2 py-1.5">
                {h}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-px text-[10px]" style={{ backgroundColor: background, color: text }}>
            {["Item", "Active", "Today"].map((cell) => (
              <div key={cell} className="px-2 py-1.5 opacity-80">
                {cell}
              </div>
            ))}
          </div>
        </div>
      );
    case "modal":
      return (
        <div
          className="w-full max-w-[200px] overflow-hidden rounded-xl"
          style={{ backgroundColor: background, color: text, border: borderStyle ?? `1px solid ${text}18` }}
        >
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${text}14` }}>
            <span className="text-[11px] font-semibold">Confirm</span>
            <span className="text-[11px] opacity-60" aria-hidden>
              ✕
            </span>
          </div>
          <div className="px-3 py-2 text-[10px] opacity-70">Are you sure you want to continue?</div>
          <div className="flex justify-end gap-1.5 px-3 pb-2.5">
            <span className="rounded-md px-2.5 py-1 text-[10px]" style={{ backgroundColor: `${text}14` }}>
              Cancel
            </span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
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

function ComponentEditor({
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

export function DesignSystemGallery({
  designSystem,
  spacing,
  editable = false,
  onChange,
  onSpacingChange,
}: {
  designSystem: DesignSystem;
  spacing?: SpacingScale;
  editable?: boolean;
  onChange?: (next: DesignSystem) => void;
  onSpacingChange?: (next: SpacingScale) => void;
}) {
  const [variant, setVariant] = useState<"light" | "dark">("light");
  const active = variant === "dark" && designSystem.dark ? designSystem.dark : designSystem.light;
  const componentEntries = (Object.keys(active.components) as ComponentName[])
    .filter((name) => active.components[name])
    .map((name) => [name, active.components[name]!] as const);

  function updateDesignSystem(mutator: (ds: DesignSystem) => DesignSystem) {
    if (!onChange) return;
    onChange(mutator(designSystem));
  }

  function updateActiveVariant(mutator: (v: ThemeVariantTokens) => ThemeVariantTokens) {
    updateDesignSystem((ds) => {
      if (variant === "dark" && ds.dark) {
        return { ...ds, dark: mutator(ds.dark) };
      }
      return { ...ds, light: mutator(ds.light) };
    });
  }

  return (
    <div className="mt-5 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#222D52]">Design system</p>
        {designSystem.dark && (
          <div className="inline-flex overflow-hidden rounded-full border border-black/[0.16]">
            {(["light", "dark"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                className="px-4 py-1.5 text-xs capitalize"
                style={{
                  backgroundColor: variant === v ? "#222D52" : "transparent",
                  color: variant === v ? "#F2EBE0" : "#6E675C",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="mb-5 rounded-xl p-4"
        style={{ backgroundColor: active.colorRoles.surface, color: active.colorRoles.text }}
      >
        <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em]" style={{ color: active.colorRoles.textMuted }}>
          Theme roles
        </p>
        {editable ? (
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {(Object.entries(active.colorRoles) as [keyof ThemeVariantTokens["colorRoles"], string][]).map(([role, hex]) => (
              <label key={role} className="flex items-center justify-between gap-2 rounded-lg bg-black/[0.05] px-2.5 py-1.5 text-[11px] capitalize">
                {role}
                <span className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) =>
                      updateActiveVariant((v) => ({ ...v, colorRoles: { ...v.colorRoles, [role]: e.target.value } }))
                    }
                    className="h-5 w-5 cursor-pointer rounded border border-black/[0.15] bg-transparent p-0"
                  />
                  <span className="font-mono-plex text-[10px] opacity-70">{hex}</span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(active.colorRoles).map(([role, hex]) => (
              <span
                key={role}
                className="rounded-full px-3 py-1 text-[11px]"
                style={{ backgroundColor: hex, color: onColor(hex), border: `1px solid ${active.colorRoles.border}` }}
              >
                {role}: {hex}
              </span>
            ))}
          </div>
        )}
      </div>

      {componentEntries.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {componentEntries.map(([name, tokens]) => (
            <div key={name} className="rounded-xl border border-black/[0.1] bg-white p-3.5">
              <p className="mb-3 font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#8A8477]">
                {COMPONENT_LABELS[name]}
              </p>
              <div className="flex justify-start">
                <ComponentShape name={name} tokens={tokens} />
              </div>
              {!editable && nonDefaultSwatches(tokens).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {nonDefaultSwatches(tokens).map(({ state, background, text, border }) => (
                    <div
                      key={state}
                      className="rounded-md px-2 py-1 text-[10px] capitalize"
                      style={{ backgroundColor: background, color: text, border: border ? `1px solid ${border}` : undefined }}
                    >
                      {state}
                    </div>
                  ))}
                </div>
              )}
              {editable && (
                <ComponentEditor
                  tokens={tokens}
                  onChange={(next) =>
                    updateActiveVariant((v) => ({ ...v, components: { ...v.components, [name]: next } }))
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}

      {spacing && (
        <div className="mb-5 rounded-xl border border-black/[0.1] bg-white p-3.5">
          <SpacingVisualization spacing={spacing} editable={editable} onChange={onSpacingChange} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {designSystem.accessibility && (
          <div className="rounded-xl border border-black/[0.1] bg-white p-3.5">
            <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#8A8477]">Accessibility</p>
            {editable ? (
              <div className="mt-2 space-y-2">
                <select
                  value={designSystem.accessibility.level}
                  onChange={(e) =>
                    updateDesignSystem((ds) => ({
                      ...ds,
                      accessibility: { ...ds.accessibility!, level: e.target.value as "AA" | "AAA" },
                    }))
                  }
                  className="rounded-md border border-black/[0.15] bg-white px-2 py-1 text-[11px] text-[#211E18]"
                >
                  <option value="AA">WCAG AA</option>
                  <option value="AAA">WCAG AAA</option>
                </select>
                <textarea
                  value={designSystem.accessibility.notes.join("\n")}
                  onChange={(e) =>
                    updateDesignSystem((ds) => ({
                      ...ds,
                      accessibility: { ...ds.accessibility!, notes: e.target.value.split("\n") },
                    }))
                  }
                  rows={4}
                  className="w-full rounded-md border border-black/[0.15] bg-white px-2 py-1.5 text-[11px] leading-relaxed text-[#211E18]"
                />
              </div>
            ) : (
              <>
                <p className="mt-1 font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#8A8477]">
                  WCAG {designSystem.accessibility.level}
                </p>
                <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-[#211E18]">
                  {designSystem.accessibility.notes.map((note, i) => (
                    <li key={i}>· {note}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {designSystem.iconStyle && (
          <div className="rounded-xl border border-black/[0.1] bg-white p-3.5">
            <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#8A8477]">Icon style</p>
            {editable ? (
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={designSystem.iconStyle.style}
                  onChange={(e) =>
                    updateDesignSystem((ds) => ({
                      ...ds,
                      iconStyle: { ...ds.iconStyle!, style: e.target.value as "line" | "solid" | "duotone" },
                    }))
                  }
                  className="rounded-md border border-black/[0.15] bg-white px-2 py-1 text-[11px] capitalize text-[#211E18]"
                >
                  <option value="line">Line</option>
                  <option value="solid">Solid</option>
                  <option value="duotone">Duotone</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={designSystem.iconStyle.strokeWidth ?? 1.5}
                  onChange={(e) =>
                    updateDesignSystem((ds) => ({
                      ...ds,
                      iconStyle: { ...ds.iconStyle!, strokeWidth: Number(e.target.value) },
                    }))
                  }
                  className="w-14 rounded-md border border-black/[0.15] bg-white px-2 py-1 text-[11px] text-[#211E18]"
                />
                <span className="text-[10px] text-[#8A8477]">px stroke</span>
              </div>
            ) : (
              <>
                <p className="mt-2 text-[12px] capitalize text-[#211E18]">
                  {designSystem.iconStyle.style}
                  {designSystem.iconStyle.strokeWidth ? ` · ${designSystem.iconStyle.strokeWidth}px stroke` : ""}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#8A8477]">{designSystem.iconStyle.note}</p>
              </>
            )}
          </div>
        )}

        {(designSystem.grid || designSystem.breakpoints) && (
          <div className="rounded-xl border border-black/[0.1] bg-white p-3.5">
            <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#8A8477]">Grid & breakpoints</p>
            {editable ? (
              <div className="mt-2 space-y-2 text-[11px] text-[#211E18]">
                {designSystem.grid && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["columns", "gutter", "maxWidth"] as const).map((field) => (
                      <label key={field} className="flex flex-col gap-0.5 text-[9px] capitalize text-[#8A8477]">
                        {field}
                        <input
                          type="number"
                          value={designSystem.grid![field]}
                          onChange={(e) =>
                            updateDesignSystem((ds) => ({
                              ...ds,
                              grid: { ...ds.grid!, [field]: Number(e.target.value) },
                            }))
                          }
                          className="rounded-md border border-black/[0.15] bg-white px-1.5 py-1 text-[11px] text-[#211E18]"
                        />
                      </label>
                    ))}
                  </div>
                )}
                {designSystem.breakpoints && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["sm", "md", "lg", "xl"] as const).map((field) => (
                      <label key={field} className="flex flex-col gap-0.5 text-[9px] uppercase text-[#8A8477]">
                        {field}
                        <input
                          type="number"
                          value={designSystem.breakpoints![field]}
                          onChange={(e) =>
                            updateDesignSystem((ds) => ({
                              ...ds,
                              breakpoints: { ...ds.breakpoints!, [field]: Number(e.target.value) },
                            }))
                          }
                          className="rounded-md border border-black/[0.15] bg-white px-1.5 py-1 text-[11px] text-[#211E18]"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <dl className="mt-2 space-y-1 text-[12px] text-[#211E18]">
                {designSystem.grid && (
                  <>
                    <div>Columns: {designSystem.grid.columns}</div>
                    <div>Gutter: {designSystem.grid.gutter}px</div>
                    <div>Max width: {designSystem.grid.maxWidth}px</div>
                  </>
                )}
                {designSystem.breakpoints && (
                  <div>
                    Breakpoints: sm {designSystem.breakpoints.sm} · md {designSystem.breakpoints.md} · lg{" "}
                    {designSystem.breakpoints.lg} · xl {designSystem.breakpoints.xl}
                  </div>
                )}
              </dl>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
