"use client";

import { useState } from "react";

export function CopyHexButton({
  hex,
  className = "",
  style,
}: {
  hex: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(hex);
      setStatus("copied");
    } catch {
      // Same reasoning as components/colors/ColorPlate.tsx: a refused
      // clipboard write used to leave the button looking broken rather
      // than telling the user to select the value themselves.
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    // Confirms the actual value copied rather than a context-free
    // "Copied ✓" — same defect a UX review raised on the colour wall
    // (see components/colors/ColorPlate.tsx): the user is told the
    // clipboard changed but not what is now on it.
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy hex value ${hex} to clipboard`}
      className={className}
      style={style}
    >
      <span role="status">
        {status === "copied" ? `${hex} copied ✓` : status === "failed" ? "Copy blocked — select it" : "Copy hex"}
      </span>
    </button>
  );
}
