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
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard can fail (permissions, insecure context) — the label
      // simply won't flip to "Copied ✓", no need to surface an error.
    }
  }

  return (
    <button type="button" onClick={copy} className={className} style={style}>
      {copied ? "Copied ✓" : "Copy hex"}
    </button>
  );
}
