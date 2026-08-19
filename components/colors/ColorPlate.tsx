"use client";

import { useState } from "react";
import Link from "next/link";
import { Color } from "@/types/color";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { FavoriteButton } from "@/components/browse/FavoriteButton";
import { ClipboardButton } from "@/components/clipboard/ClipboardButton";

const AA_NORMAL_TEXT = 4.5;
// The salon-wall's warm ink pair, tried first, then a pure b/w fallback.
const WARM_INK = ["#F6F0E5", "#191611"];
const PURE_INK = ["#FFFFFF", "#000000"];

function best(hex: string, candidates: string[]): { color: string; ratio: number } {
  return candidates
    .map((color) => ({ color, ratio: getContrastRatio(hex, color) }))
    .sort((a, b) => b.ratio - a.ratio)[0];
}

// Label colour for text sitting directly on a swatch. Used to be checked
// against opaque cream/ink but rendered at 92%/78% alpha, so the real
// contrast was always lower than what passed. Now renders opaque and
// keeps the warm pair wherever it genuinely clears AA, falling back to
// pure white/black only where warm can't (unreadable text otherwise).
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
    // used to be a click-anywhere card wrapping three other interactive
    // controls, which is invalid nested-interactive markup. Copying now
    // lives on its own button below.
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
        {/* Names *what* landed on the clipboard rather than a bare "Copied ✓"
            — otherwise there's no way to tell if you got the hex, the name,
            or the swatch. role="status" announces the same text to screen
            readers. */}
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
