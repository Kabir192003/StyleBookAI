/**
 * Renders the optional `designSystem` block from an AI Generate result —
 * component tokens/states, a light/dark toggle, accessibility notes, icon
 * style, and grid/breakpoints. Only mounted when the user checked "Generate
 * a full design system" in <PromptInput /> and the model actually returned
 * one. Static state swatches (not real :hover/:active) since this is a
 * preview, not a live component library — same honest-static-tile pattern
 * PromptInput already uses for the color strip and moodboard.
 */
"use client";

import { useState } from "react";
import { DesignSystem, ComponentName, ComponentTokenSet } from "@/types/designSystem";
import { getContrastRatio } from "@/lib/colors/colorUtils";

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

const STATE_ORDER = ["default", "hover", "active", "disabled", "focus"] as const;

function swatchesForComponent(tokens: ComponentTokenSet) {
  return STATE_ORDER.map((state) => {
    if (state === "default") {
      return { state, background: tokens.background, text: tokens.text, border: tokens.border };
    }
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

export function DesignSystemPreview({ designSystem }: { designSystem: DesignSystem }) {
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
          {componentEntries.map(([name, tokens]) => (
            <div key={name} className="rounded-xl border border-white/[0.1] bg-white/[0.02] p-3.5">
              <p className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#EFE9DC]/50">
                {COMPONENT_LABELS[name]}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {swatchesForComponent(tokens).map(({ state, background, text, border }) => (
                  <div
                    key={state}
                    className="rounded-lg px-3 py-2 text-[11px] capitalize"
                    style={{ backgroundColor: background, color: text, border: border ? `1px solid ${border}` : undefined }}
                  >
                    {state}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
