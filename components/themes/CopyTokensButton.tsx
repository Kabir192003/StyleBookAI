"use client";

import { useState } from "react";
import { Theme } from "@/types/theme";

export function CopyTokensButton({ theme, ink }: { theme: Theme; ink: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const p = theme.colorRoles;
    const css = [
      ":root {",
      `  --primary: ${p.primary};`,
      `  --secondary: ${p.secondary};`,
      `  --accent: ${p.accent};`,
      `  --background: ${p.background};`,
      `  --surface: ${p.surface};`,
      `  --text: ${p.text};`,
      `  --text-muted: ${p.textMuted};`,
      `  --font-display: '${theme.primaryFont.family}';`,
      `  --font-body: '${theme.secondaryFont.family}';`,
      "}",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can fail (permissions, insecure context) — button label
      // simply won't flip to "Copied", no need to surface an error.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="cursor-pointer rounded-[4px] border px-6 py-3 text-sm"
      style={{ borderColor: ink, color: ink }}
    >
      {copied ? "Copied ✓" : "Copy tokens"}
    </button>
  );
}
