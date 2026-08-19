// The "add to clipboard" toggle on ColorPlate/font rows, alongside
// FavoriteButton. Unlike favoriting, the clipboard is a pure client-side
// scratch tray (localStorage-backed) — no account needed, so this never
// redirects to sign-in.
"use client";

import { useEffect, useState } from "react";
import { ClipboardList, ClipboardCheck } from "lucide-react";
import { useClipboardStore, ClipboardColorItem, ClipboardFontItem } from "@/store/clipboardStore";

type ClipboardTarget =
  | { type: "color"; item: ClipboardColorItem }
  | { type: "font"; item: ClipboardFontItem };

export function ClipboardButton({
  target,
  className = "",
  style,
}: {
  target: ClipboardTarget;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isColorClipped = useClipboardStore((s) => s.isColorClipped);
  const isFontClipped = useClipboardStore((s) => s.isFontClipped);
  const toggleColor = useClipboardStore((s) => s.toggleColor);
  const toggleFont = useClipboardStore((s) => s.toggleFont);

  // clipboardStore is localStorage-persisted and rehydrates synchronously
  // on the client before first paint — reading it immediately would render
  // "clipped" on the client while the server always rendered "not clipped",
  // a hydration mismatch. Stay in the server's unclipped state until mounted.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const clipped = hydrated && (target.type === "color" ? isColorClipped(target.item.id) : isFontClipped(target.item.id));

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (target.type === "color") toggleColor(target.item);
    else toggleFont(target.item);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={clipped}
      aria-label={clipped ? "Remove from clipboard" : "Add to clipboard"}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${className}`}
      style={style}
    >
      {clipped ? (
        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ClipboardList className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
