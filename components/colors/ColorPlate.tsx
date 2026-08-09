"use client";

import { useState } from "react";
import Link from "next/link";
import { Color } from "@/types/color";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { FavoriteButton } from "@/components/browse/FavoriteButton";
import { ClipboardButton } from "@/components/clipboard/ClipboardButton";

// One "plate" on the /browse/colors salon wall — a full-bleed 200px swatch tile.
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
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy hex value ${color.hex}`}
          className="font-mono-plex text-[11px] tracking-[0.08em] underline-offset-2 hover:underline"
          style={{ color: overlay }}
        >
          {copied ? "Copied ✓" : color.hex}
        </button>
        <span className="font-mono-plex text-[10px] uppercase tracking-[0.18em]" style={{ color: overlay }}>
          {color.mood[0]}
        </span>
      </div>
      <div className="px-4 pb-6 pt-[18px]">
        <div className="flex items-center justify-between font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">
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
