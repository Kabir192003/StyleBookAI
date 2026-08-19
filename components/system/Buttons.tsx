// Every state here is real, not a screenshot: hover/active/focus-visible/
// disabled come from real CSS in styles.ts, and loading is real async state
// with a real CSS spinner. Consequence: the only way to see the hover color
// is to hover, so the specimen list shows one button per variant instead of
// a state matrix — forced-state classes would drift from the real ones.
"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Download, Heart, MoreHorizontal, Plus, Trash2 } from "lucide-react";

// click -> disabled + spinner -> confirmed -> back to idle. Proof the
// components are live React, not static markup.
export function SaveButton() {
  const [phase, setPhase] = useState<"idle" | "saving" | "saved">("idle");
  // Torn down on unmount — the canvas mounts/unmounts these freely as
  // experiments are added and deleted, and a pending setState after that warns.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function run() {
    if (phase !== "idle") return;
    setPhase("saving");
    timers.current.push(setTimeout(() => setPhase("saved"), 1100));
    timers.current.push(setTimeout(() => setPhase("idle"), 2600));
  }

  return (
    <button
      type="button"
      className="pg-btn pg-btn--primary"
      onClick={run}
      data-loading={phase === "saving" ? "true" : undefined}
      // Disabled pulls it out of the tab order while working; the label
      // change gets announced since the accessible name is the text content.
      disabled={phase === "saving"}
      aria-live="polite"
    >
      {phase === "saving" && <span className="pg-spinner" aria-hidden="true" />}
      {phase === "saved" && <Check size={15} aria-hidden="true" />}
      {phase === "idle" ? "Save changes" : phase === "saving" ? "Saving…" : "Saved"}
    </button>
  );
}

// aria-pressed flips for real, not a fake toggled class.
export function LikeButton() {
  const [liked, setLiked] = useState(false);
  return (
    <button
      type="button"
      className={liked ? "pg-btn pg-btn--secondary" : "pg-btn pg-btn--outline"}
      aria-pressed={liked}
      onClick={() => setLiked((v) => !v)}
    >
      <Heart size={15} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
      {liked ? "Saved to list" : "Save to list"}
      <span className="pg-sr-only">{liked ? " (currently saved)" : ""}</span>
    </button>
  );
}
