/**
 * Renders the optional `designSystem` block from an AI Generate result —
 * component tokens/states, a light/dark toggle, accessibility notes, icon
 * style, and grid/breakpoints. Shared between the AI results page
 * (components/ai/PromptInput.tsx) and Studio (components/studio/StudioBuilder.tsx)
 * once a project carries a designSystem.
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
import { DesignSystem, ComponentName, ComponentTokenSet } from "@/types/designSystem";
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

export function DesignSystemGallery({
  designSystem,
  spacing,
}: {
  designSystem: DesignSystem;
  spacing?: SpacingScale;
}) {
  const [variant, setVariant] = useState<"light" | "dark">("light");
  const active = variant === "dark" && designSystem.dark ? designSystem.dark : designSystem.light;
  const componentEntries = (Object.keys(active.components) as ComponentName[])
    .filter((name) => active.components[name])
    .map((name) => [name, active.components[name]!] as const);

  return (
    <div className="mt-5 rounded-2xl border border-white/[0.12] bg-white/[0.03] p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#D2B68A]">Design system</p>
        {designSystem.dark && (
          <div className="inline-flex overflow-hidden rounded-full border border-white/[0.16]">
            {(["light", "dark"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                className="px-4 py-1.5 text-xs capitalize"
                style={{
                  backgroundColor: variant === v ? "#EFE9DC" : "transparent",
                  color: variant === v ? "#141019" : "#EFE9DC",
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
      </div>

      {componentEntries.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {componentEntries.map(([name, tokens]) => {
            const stateSwatches = nonDefaultSwatches(tokens);
            return (
              <div key={name} className="rounded-xl border border-white/[0.1] bg-white/[0.02] p-3.5">
                <p className="mb-3 font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#EFE9DC]/50">
                  {COMPONENT_LABELS[name]}
                </p>
                <div className="flex justify-start">
                  <ComponentShape name={name} tokens={tokens} />
                </div>
                {stateSwatches.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {stateSwatches.map(({ state, background, text, border }) => (
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
              </div>
            );
          })}
        </div>
      )}

      {spacing && (
        <div className="mb-5 rounded-xl border border-white/[0.1] bg-white/[0.02] p-3.5">
          <SpacingVisualization spacing={spacing} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {designSystem.accessibility && (
          <div className="rounded-xl border border-white/[0.1] bg-white/[0.02] p-3.5">
            <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#EFE9DC]/50">
              Accessibility · WCAG {designSystem.accessibility.level}
            </p>
            <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-[#EFE9DC]/80">
              {designSystem.accessibility.notes.map((note, i) => (
                <li key={i}>· {note}</li>
              ))}
            </ul>
          </div>
        )}

        {designSystem.iconStyle && (
          <div className="rounded-xl border border-white/[0.1] bg-white/[0.02] p-3.5">
            <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#EFE9DC]/50">Icon style</p>
            <p className="mt-2 text-[12px] capitalize text-[#EFE9DC]/80">
              {designSystem.iconStyle.style}
              {designSystem.iconStyle.strokeWidth ? ` · ${designSystem.iconStyle.strokeWidth}px stroke` : ""}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#EFE9DC]/60">{designSystem.iconStyle.note}</p>
          </div>
        )}

        {(designSystem.grid || designSystem.breakpoints) && (
          <div className="rounded-xl border border-white/[0.1] bg-white/[0.02] p-3.5">
            <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#EFE9DC]/50">Grid & breakpoints</p>
            <dl className="mt-2 space-y-1 text-[12px] text-[#EFE9DC]/80">
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
          </div>
        )}
      </div>
    </div>
  );
}
