"use client";

import { useState } from "react";
import Link from "next/link";
import { Color } from "@/types/color";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { FavoriteButton } from "@/components/browse/FavoriteButton";
import { ClipboardButton } from "@/components/clipboard/ClipboardButton";

const AA_NORMAL_TEXT = 4.5;
/** The warm pair the salon-wall design is built around, then a pure-contrast
 *  fallback. */
const WARM_INK = ["#F6F0E5", "#191611"];
const PURE_INK = ["#FFFFFF", "#000000"];

function best(hex: string, candidates: string[]): { color: string; ratio: number } {
  return candidates
    .map((color) => ({ color, ratio: getContrastRatio(hex, color) }))
    .sort((a, b) => b.ratio - a.ratio)[0];
}

/**
 * Label colour for text sitting directly on a swatch.
 *
 * Two things were wrong before: the ratio was measured against opaque cream
 * or ink but *rendered* at 92%/78% alpha, so the real contrast was always
 * lower than the value the check approved; and on mid-luminance colours
 * neither warm tone reaches AA at all (a mid red tops out around 4.2:1
 * either way).
 *
 * So: render opaque, keep the warm pair whenever it genuinely clears AA —
 * which is the large majority of the library and preserves the editorial
 * look — and only fall back to pure white/black on the colours where warm
 * can't, since there the alternative is unreadable text rather than a
 * slightly cooler one.
 */
function overlayInkFor(hex: string): string {
  const warm = best(hex, WARM_INK);
  if (warm.ratio >= AA_NORMAL_TEXT) return warm.color;
  const pure = best(hex, PURE_INK);
  return pure.ratio > warm.ratio ? pure.color : warm.color;
}

// One "plate" on the /browse/colors salon wall — a full-bleed 200px swatch tile.
export function ColorPlate({ color, index }: { color: Color; index: number }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(color.hex);
      setStatus("copied");
    } catch {
      // Clipboard writes are refused outside a secure context and in some
      // embedded/permission-restricted browsers. Silently doing nothing
      // reads as a dead button — say so instead, since the hex is right
      // there on screen to select by hand.
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 1800);
  }

  const label =
    status === "copied" ? `${color.hex} copied ✓` : status === "failed" ? "Copy blocked — select it" : color.hex;

  const overlay = overlayInkFor(color.hex);

  return (
    // Deliberately not interactive itself (no role="button"/onClick) — it
    // used to be a click-anywhere-to-copy card wrapping three more
    // interactive controls (clipboard, favorite, detail link), which is
    // invalid nested-interactive markup and made keyboard/AT behavior
    // ambiguous. Copying now lives on its own explicit button below.
    <div className="group relative flex flex-col border-b border-r border-black/[0.18] bg-[#F2EBE0] transition-colors hover:bg-[#EBE2D2]">
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
        <ClipboardButton
          target={{ type: "color", item: { id: color.id, hex: color.hex, name: color.name } }}
          style={{ color: overlay }}
        />
        <FavoriteButton type="color" id={color.id} style={{ color: overlay }} />
      </div>
      <div
        className="flex h-[200px] items-end justify-between px-4 py-3.5"
        style={{ backgroundColor: color.hex }}
      >
        {/* Feedback names *what* landed on the clipboard, not just that
            something did. A first-time visitor clicking a colour band and
            seeing a bare "Copied ✓" has no way to know whether they took
            the hex, the colour's name, or the whole swatch — a UX review
            flagged it as confusing in the first seconds of using the site.
            role="status" also announces the same wording to a screen
            reader, which previously got no confirmation at all. */}
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy hex value ${color.hex} to clipboard`}
          className="sb-tap-target font-mono-plex text-[11px] tracking-[0.08em] underline-offset-2 hover:underline"
          style={{ color: overlay }}
        >
          <span role="status">{label}</span>
        </button>
        <span className="font-mono-plex text-[10px] uppercase tracking-[0.18em]" style={{ color: overlay }}>
          {color.mood[0]}
        </span>
      </div>
      <div className="px-4 pb-6 pt-[18px]">
        <div className="flex items-center justify-between font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">
          <span>{String(index).padStart(3, "0")}</span>
          <span>{color.family}</span>
        </div>
        <Link
          href={`/browse/colors/${color.id}`}
          className="mt-2 block font-editorial-serif text-[26px] leading-tight tracking-tight text-[#211E18] hover:underline"
        >
          {color.name}
        </Link>
        <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-[#6E675C]">{color.note}</p>
      </div>
    </div>
  );
}
