/**
 * The palette, read back out of the canvas rather than passed in.
 *
 * This group is props-free like every other one (see index.ts), which raises
 * an obvious question: where do the hex values printed under each swatch come
 * from? `getComputedStyle` on an element inside the scope, after paint.
 *
 * That is deliberate and it is the only honest source. Threading the resolved
 * palette in as a prop would break the props-free contract *and* create a
 * second copy of the truth that can disagree with what is actually on screen —
 * which is exactly the class of bug where the swatch says #222D52 and the
 * button next to it is painted something else. Reading the computed value
 * means the label is, by construction, the colour the browser used.
 *
 * The trade-off is one post-paint measurement pass and a re-measure whenever
 * the tokens change; `useLayoutEffect` keeps that off-screen rather than
 * showing a frame of empty labels.
 */
"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { getContrastRatio, getWcagLevel } from "@/lib/colors/colorUtils";
import { GroupShell, Specimen } from "./primitives";

/** The roles worth showing as swatches, in the order a brand is read in.
 *  `on` names the property whose contrast against the swatch is meaningful —
 *  a surface is judged against ink, an accent against its own on-colour. */
const SWATCH_ROLES = [
  { property: "--pgc-primary", on: "--pgc-on-primary", label: "Primary" },
  { property: "--pgc-secondary", on: "--pgc-on-secondary", label: "Secondary" },
  { property: "--pgc-accent", on: "--pgc-on-accent", label: "Accent" },
  { property: "--pgc-bg", on: "--pgc-ink", label: "Background" },
  { property: "--pgc-surface", on: "--pgc-ink", label: "Surface" },
  { property: "--pgc-ink", on: "--pgc-surface", label: "Ink" },
  { property: "--pgc-muted", on: "--pgc-surface", label: "Muted" },
  { property: "--pgc-success", on: "--pgc-on-success", label: "Success" },
  { property: "--pgc-warning", on: "--pgc-on-warning", label: "Warning" },
  { property: "--pgc-error", on: "--pgc-on-error", label: "Error" },
] as const;

type Measured = { label: string; property: string; hex: string; onHex: string };

/**
 * Normalises whatever `getComputedStyle` hands back into a 6-digit hex.
 * Computed custom properties come through as the *authored* string, which for
 * this system is already a hex — but a `color-mix()` or an `rgb()` would not
 * be, and `getContrastRatio` parses with `parseInt(…, 16)` and would return
 * nonsense rather than throw. Anything unrecognised is dropped instead.
 */
function toHex(value: string): string | null {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [r, g, b] = trimmed.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const rgb = trimmed.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (rgb) {
    const hex = [rgb[1], rgb[2], rgb[3]]
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("");
    return `#${hex}`.toUpperCase();
  }
  return null;
}

export function PaletteGroup() {
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<Measured[]>([]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    function read() {
      if (!el) return;
      const styles = getComputedStyle(el);
      const next: Measured[] = [];
      for (const role of SWATCH_ROLES) {
        const hex = toHex(styles.getPropertyValue(role.property));
        const onHex = toHex(styles.getPropertyValue(role.on));
        if (hex && onHex) next.push({ label: role.label, property: role.property, hex, onHex });
      }
      setMeasured(next);
    }

    read();

    // The canvas rewrites its <style> block on every token edit. That mutates
    // the stylesheet, not this element, so nothing here would otherwise
    // re-render — the swatches would keep showing the previous system's hexes.
    const observer = new MutationObserver(read);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <GroupShell>
      <div ref={ref}>
        <Specimen label="Roles">
          <div className="pg-swatches">
            {measured.map((swatch) => {
              const ratio = getContrastRatio(swatch.hex, swatch.onHex);
              const level = getWcagLevel(ratio);
              return (
                <div key={swatch.property} className="pg-swatch">
                  <div className="pg-swatch__chip" style={{ background: `var(${swatch.property})` }} />
                  <div className="pg-swatch__meta">
                    <span className="pg-swatch__name">{swatch.label}</span>
                    <span className="pg-swatch__hex">{swatch.hex}</span>
                    {/* Measured, never claimed — same principle as the
                        verified-contrast panel on the AI results page. */}
                    <span className="pg-swatch__hex">
                      {ratio.toFixed(2)}:1 · {level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Specimen>
      </div>
    </GroupShell>
  );
}
