"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import {
  EXPORT_HINTS,
  EXPORT_MIME,
  EXPORT_TABS,
  ExportTab,
  exportFileName,
  generateExportCode,
  StudioExportTokens,
} from "@/lib/studio/exportCode";
import { exportStyleGuidePdf } from "@/lib/export/pdfStyleGuide";
import { cn } from "@/lib/utils";

export function ExportDrawer({ tokens, onClose }: { tokens: StudioExportTokens; onClose: () => void }) {
  const [tab, setTab] = useState<ExportTab>("CSS");
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState<"idle" | "generating" | "error">("idle");

  const code = generateExportCode(tab, tokens);
  const filename = exportFileName(tab, tokens.name);

  /**
   * The drawer used to offer copy-to-clipboard only, so the "download the
   * design tokens and import them into Figma" flow was impossible from the
   * Studio — you had to paste into your own editor and save the file
   * yourself, guessing the extension. The MIME type matters too: a
   * `.tokens.json` served as text/plain is refused by some import dialogs.
   */
  function download() {
    saveAs(new Blob([code], { type: EXPORT_MIME[tab] }), filename);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can fail (permissions, insecure context) — button label
      // simply won't flip to "Copied", no need to surface an error.
    }
  }

  async function downloadPdf() {
    setPdfState("generating");
    try {
      await exportStyleGuidePdf(tokens);
      setPdfState("idle");
    } catch {
      setPdfState("error");
      setTimeout(() => setPdfState("idle"), 2500);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex justify-end bg-[rgba(20,17,12,0.42)] backdrop-blur-[3px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[min(560px,94vw)] flex-col border-l border-black/20 bg-[#F2EBE0]"
      >
        <div className="flex items-start justify-between border-b border-black/[0.16] px-7 pb-[18px] pt-[26px]">
          <div>
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Export system</div>
            <h2 className="mt-1.5 font-editorial-serif text-[30px] font-normal tracking-[-0.02em] text-[#211E18]">
              {tokens.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadPdf}
              disabled={pdfState === "generating"}
              className="rounded-full border border-[#211E18]/[0.24] px-4 py-2 font-mono-plex text-[11px] tracking-[0.06em] text-[#211E18] disabled:opacity-60"
            >
              {pdfState === "generating" ? "Generating…" : pdfState === "error" ? "Try again" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-[34px] w-[34px] place-items-center rounded-full border border-black/[0.24] text-base text-[#211E18]"
              aria-label="Close export drawer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-black/[0.12] px-7 pb-3 pt-4">
          {EXPORT_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setCopied(false);
              }}
              className={cn(
                "rounded-full border px-[15px] py-2 font-mono-plex text-[11px] tracking-[0.06em]",
                t === tab ? "border-[#211E18] bg-[#211E18] text-[#F2EBE0]" : "border-black/20 bg-transparent text-[#6E675C]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="border-b border-black/[0.08] px-7 py-3 text-[12.5px] leading-[1.5] text-[#6E675C]">
          {EXPORT_HINTS[tab]}
        </p>

        <div className="flex-1 overflow-auto">
          <pre className="whitespace-pre-wrap break-words px-7 py-6 font-mono-plex text-[12.5px] leading-[1.7] text-[#2B2820]">
            {code}
          </pre>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/[0.16] px-7 py-[18px]">
          <span className="truncate font-mono-plex text-[10px] uppercase tracking-[0.14em] text-[#8A8477]">
            {filename}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={download}
              className="rounded-full border border-[#211E18]/[0.24] px-5 py-[11px] text-[13px] text-[#211E18]"
            >
              Download
            </button>
            <button
              type="button"
              onClick={copy}
              className="rounded-full bg-[#222D52] px-6 py-[11px] text-[13px] text-[#F2EBE0]"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
