// Renders the optional designSystem block from an AI Generate result.
// Shared between the AI results page (components/ai/PromptInput.tsx, always
// read-only) and Studio (StudioBuilder.tsx, editable there) once a project
// carries a designSystem.
//
// Styled to the site's one light editorial theme, same vocabulary as
// PromptInput.tsx/StudioBuilder.tsx, so this panel needs no dark/light chrome
// toggle of its own — `variant` below is the generated design system's own
// light/dark theme-role toggle, unrelated to page chrome.
//
// Each ComponentName gets a small mock shape (button = pill, card = bordered
// container, table = mini grid, etc) driven by its default tokens, so only
// the shape differs per type while the same background/text/border tokens
// drive all of them. Non-default states show as small labeled swatches below
// the shape since real :hover/:active can't be simulated in a static preview.
"use client";

import { useState } from "react";
import { DesignSystem, ComponentName, ComponentTokenSet, ThemeVariantTokens } from "@/types/designSystem";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { ContrastBadge } from "@/components/ui/ContrastBadge";
import { ComponentEditor, NON_DEFAULT_STATES } from "./ComponentEditor";
import { SpacingVisualization } from "./SpacingVisualization";
import { SpacingScale } from "@/types/designTokens";
import { cn } from "@/lib/utils";

function onColor(hex: string): string {
  return getContrastRatio(hex, "#FBF8F2") >= getContrastRatio(hex, "#141110") ? "#FBF8F2" : "#141110";
}

// The AI's own accessibility.level/notes are prose it wrote about the
// palette, not a calculated fact, so we independently verify the actual
// foreground/background pairs users will read (core text roles against their
// surfaces, plus every component's text vs background). WCAG normal-text AA
// is 4.5:1 — anything under that fails regardless of what the AI claimed.
const NORMAL_TEXT_AA = 4.5;

type VerifiedPair = { label: string; foreground: string; background: string; ratio: number };

function verifyContrastPairs(active: ThemeVariantTokens): VerifiedPair[] {
  const { colorRoles, components } = active;
  const pairs: Array<{ label: string; foreground: string; background: string }> = [
    { label: "Text on surface", foreground: colorRoles.text, background: colorRoles.surface },
    { label: "Text on background", foreground: colorRoles.text, background: colorRoles.background },
    { label: "Muted text on surface", foreground: colorRoles.textMuted, background: colorRoles.surface },
  ];
  (Object.keys(components) as ComponentName[]).forEach((name) => {
    const tokens = components[name];
    if (tokens) pairs.push({ label: `${COMPONENT_LABELS[name]} text`, foreground: tokens.text, background: tokens.background });
  });
  return pairs.map((p) => ({ ...p, ratio: getContrastRatio(p.foreground, p.background) }));
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


export function DesignSystemGallery({
  designSystem,
  spacing,
  editable = false,
  onChange,
  onSpacingChange,
  variant: variantProp,
  onVariantChange,
}: {
  designSystem: DesignSystem;
  spacing?: SpacingScale;
  editable?: boolean;
  onChange?: (next: DesignSystem) => void;
  onSpacingChange?: (next: SpacingScale) => void;
  // Controlled by the caller when provided (Studio, so its own Light/Dark
  // toggle drives this panel too). Omitted on the AI results page, which
  // falls back to its own local toggle.
  variant?: "light" | "dark";
  onVariantChange?: (variant: "light" | "dark") => void;
}) {
  const [internalVariant, setInternalVariant] = useState<"light" | "dark">("light");
  const variant = variantProp ?? internalVariant;
  const setVariant = onVariantChange ?? setInternalVariant;
  const active = variant === "dark" && designSystem.dark ? designSystem.dark : designSystem.light;
  const componentEntries = (Object.keys(active.components) as ComponentName[])
    .filter((name) => active.components[name])
    .map((name) => [name, active.components[name]!] as const);
  const verifiedPairs = verifyContrastPairs(active);
  const failingPairs = verifiedPairs.filter((p) => p.ratio < NORMAL_TEXT_AA);

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
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">
                  {COMPONENT_LABELS[name]}
                </p>
                <ContrastBadge foreground={tokens.text} background={tokens.background} />
              </div>
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

      {verifiedPairs.length > 0 && (
        <div className={cn("mb-5 rounded-xl border p-3.5", failingPairs.length > 0 ? "border-[#B3261E]/30 bg-[#B3261E]/[0.04]" : "border-[#22733F]/25 bg-[#22733F]/[0.04]")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">
              System-verified contrast — not the AI&rsquo;s claim
            </p>
            <span className="font-mono-plex text-[10px] uppercase tracking-[0.1em] text-[#211E18]">
              {verifiedPairs.length - failingPairs.length}/{verifiedPairs.length} pairs pass normal-text AA (4.5:1)
            </span>
          </div>
          {failingPairs.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5">
              {failingPairs.map((pair) => (
                <li key={pair.label} className="flex flex-wrap items-center gap-2 text-[11px] text-[#211E18]">
                  <span
                    className="inline-flex h-4 w-4 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: pair.background }}
                  />
                  <span
                    className="font-mono-plex text-[10px]"
                    style={{ color: pair.foreground, backgroundColor: pair.background, padding: "1px 5px", borderRadius: 4 }}
                  >
                    Aa
                  </span>
                  {pair.label}
                  <ContrastBadge foreground={pair.foreground} background={pair.background} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[11px] text-[#22733F]">
              Every checked text/background pair independently passes WCAG AA for normal text.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {designSystem.accessibility && (
          <div className="rounded-xl border border-black/[0.1] bg-white p-3.5">
            <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">
              AI-written accessibility notes
            </p>
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
                <p className="mt-1 font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">
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
            <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">Icon style</p>
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
                <span className="text-[10px] text-[#6E675C]">px stroke</span>
              </div>
            ) : (
              <>
                <p className="mt-2 text-[12px] capitalize text-[#211E18]">
                  {designSystem.iconStyle.style}
                  {designSystem.iconStyle.strokeWidth ? ` · ${designSystem.iconStyle.strokeWidth}px stroke` : ""}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#6E675C]">{designSystem.iconStyle.note}</p>
              </>
            )}
          </div>
        )}

        {(designSystem.grid || designSystem.breakpoints) && (
          <div className="rounded-xl border border-black/[0.1] bg-white p-3.5">
            <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">Grid & breakpoints</p>
            {editable ? (
              <div className="mt-2 space-y-2 text-[11px] text-[#211E18]">
                {designSystem.grid && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["columns", "gutter", "maxWidth"] as const).map((field) => (
                      <label key={field} className="flex flex-col gap-0.5 text-[9px] capitalize text-[#6E675C]">
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
                      <label key={field} className="flex flex-col gap-0.5 text-[9px] uppercase text-[#6E675C]">
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
