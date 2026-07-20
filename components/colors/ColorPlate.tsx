"use client";

import { useState } from "react";
import { Color } from "@/types/color";
import { getContrastRatio } from "@/lib/colors/colorUtils";

// One "plate" on the /browse/colors salon wall — distinct from the compact
// <ColorCard> used elsewhere (e.g. AI-generate results), which needs a
// smaller footprint than this design's full-bleed 200px swatch tile.
export function ColorPlate({ color, index }: { color: Color; index: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard can fail (permissions, insecure context) — the label
      // simply won't flip to "Copied ✓", no need to surface an error.
    }
  }

  const overlay =
    getContrastRatio(color.hex, "#F6F0E5") >= getContrastRatio(color.hex, "#191611")
      ? "rgba(246,240,229,0.92)"
      : "rgba(25,22,17,0.78)";

  return (
    <div
      onClick={copy}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          copy();
        }
      }}
      className="group flex cursor-pointer flex-col border-b border-r border-black/[0.18] bg-[#F2EBE0] transition-colors hover:bg-[#EBE2D2]"
    >
      <div
        className="flex h-[200px] items-end justify-between px-4 py-3.5"
        style={{ backgroundColor: color.hex }}
      >
        <span className="font-mono-plex text-[11px] tracking-[0.08em]" style={{ color: overlay }}>
          {copied ? "Copied ✓" : color.hex}
        </span>
        <span className="font-mono-plex text-[10px] uppercase tracking-[0.18em]" style={{ color: overlay }}>
          {color.mood[0]}
        </span>
      </div>
      <div className="px-4 pb-6 pt-[18px]">
        <div className="flex items-center justify-between font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">
          <span>{String(index).padStart(3, "0")}</span>
          <span>{color.family}</span>
        </div>
        <div className="mt-2 font-editorial-serif text-[26px] leading-tight tracking-tight text-[#211E18]">
          {color.name}
        </div>
        <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-[#6E675C]">{color.note}</p>
      </div>
    </div>
  );
}
