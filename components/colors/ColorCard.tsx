"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card } from "@/components/browse/Card";
import { Color } from "@/types/color";

export function ColorCard({ color }: { color: Color & { role?: string } }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can fail (permissions, insecure context) — button label
      // simply won't flip to "Copied", no need to surface an error.
    }
  }

  return (
    <Card className="group p-0 hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className="h-28 w-full transition-transform duration-300 group-hover:scale-[1.02]"
        style={{ backgroundColor: color.hex }}
        aria-label={`${color.name} swatch`}
      />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-neutral-900">{color.name}</h3>
            <p className="mt-0.5 font-mono text-xs uppercase text-neutral-500">{color.hex}</p>
          </div>
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-600">
            {color.family}
          </span>
        </div>
        <p className="line-clamp-2 text-xs text-neutral-500">{color.note}</p>
        <button
          type="button"
          onClick={copy}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy hex"}
        </button>
      </div>
    </Card>
  );
}
