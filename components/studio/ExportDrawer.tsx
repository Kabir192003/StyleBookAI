"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import {
  EXPORT_HINTS,
  EXPORT_MIME,
  EXPORT_PRIMARY_TABS,
  EXPORT_SECONDARY_TABS,
  ExportTab,
  exportFileName,
  generateExportCode,
  StudioExportTokens,
} from "@/lib/studio/exportCode";

const FIGMA_STEPS = [
  <>Install the <strong>Tokens Studio for Figma</strong> plugin from Figma&rsquo;s Community tab (search &ldquo;Tokens Studio&rdquo;).</>,
  <>Open the plugin in your Figma file, click <strong>Import</strong>, and paste or upload this file.</>,
  <>Inside the plugin, click <strong>Create Styles / Variables</strong> — that&rsquo;s the step that actually turns these tokens into usable Figma variables and text styles.</>,
] as const;
import { exportStyleGuidePdf } from "@/lib/export/pdfStyleGuide";
import { cn } from "@/lib/utils";

type FigmaExportState =
  | { kind: "idle" }
  | { kind: "generating" }
  | { kind: "ready"; code: string; expiresInMinutes: number; missing: string[] }
  | { kind: "error"; message: string };

export function ExportDrawer({ tokens, onClose }: { tokens: StudioExportTokens; onClose: () => void }) {
  const [tab, setTab] = useState<ExportTab>("CSS");
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState<"idle" | "generating" | "error">("idle");
  const [figmaComponentLibrary, setFigmaComponentLibrary] = useState(true);
  const [figmaCanvas, setFigmaCanvas] = useState(true);
  const [figmaState, setFigmaState] = useState<FigmaExportState>({ kind: "idle" });
  const [showFigmaPanel, setShowFigmaPanel] = useState(false);

  async function generateFigmaCode() {
    setFigmaState({ kind: "generating" });
    try {
      // Lazy import — captureCanvas reaches for `document` and pulls in the
      // DOM serializer, which most exports never need in the initial bundle.
      const [{ captureFromCanvas }, { buildFigmaPayload }] = await Promise.all([
        import("@/lib/figmaExport/captureCanvas"),
        import("@/lib/figmaExport/serializePayload"),
      ]);
      const capture = captureFromCanvas({ canvas: figmaCanvas, componentLibrary: figmaComponentLibrary });
      const payload = buildFigmaPayload(tokens, capture);

      const res = await fetch("/api/figma-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate export code");
      setFigmaState({ kind: "ready", code: data.code, expiresInMinutes: data.expiresInMinutes, missing: capture.missing });
    } catch (err) {
      setFigmaState({ kind: "error", message: err instanceof Error ? err.message : "Failed to generate export code" });
    }
  }

  const code = generateExportCode(tab, tokens);
  const filename = exportFileName(tab, tokens.name);

  // MIME type matters here — a `.tokens.json` served as text/plain gets refused by some import dialogs.
  function download() {
    saveAs(new Blob([code], { type: EXPORT_MIME[tab] }), filename);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can fail (permissions, insecure context) — button just won't flip to "Copied".
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
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Export system</div>
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

        <div className="flex flex-col gap-3 border-b border-black/[0.12] px-7 pb-4 pt-4">
          <div className="flex flex-wrap gap-2">
            {EXPORT_PRIMARY_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setCopied(false);
                  setShowFigmaPanel(false);
                }}
                className={cn(
                  "rounded-full border px-5 py-2.5 font-mono-plex text-[12px] tracking-[0.06em]",
                  !showFigmaPanel && t === tab ? "border-[#211E18] bg-[#211E18] text-[#F2EBE0]" : "border-[#211E18]/30 bg-white/60 text-[#211E18]"
                )}
              >
                {t}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowFigmaPanel(true)}
              className={cn(
                "rounded-full border px-5 py-2.5 font-mono-plex text-[12px] tracking-[0.06em]",
                showFigmaPanel ? "border-[#211E18] bg-[#211E18] text-[#F2EBE0]" : "border-[#211E18]/30 bg-white/60 text-[#211E18]"
              )}
            >
              Figma Components ↗
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 border-t border-black/[0.08] pt-3">
            <span className="font-mono-plex mr-1 shrink-0 text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">
              Other formats
            </span>
            {EXPORT_SECONDARY_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setCopied(false);
                  setShowFigmaPanel(false);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-mono-plex text-[10.5px] tracking-[0.06em]",
                  !showFigmaPanel && t === tab ? "border-[#211E18] bg-[#211E18] text-[#F2EBE0]" : "border-black/20 bg-transparent text-[#6E675C]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {showFigmaPanel ? (
          <p className="border-b border-black/[0.08] px-7 py-3 text-[12.5px] leading-[1.5] text-[#6E675C]">
            Real, editable Figma frames — components bound to live Figma Variables, not a token file you have to
            reconnect by hand. Generates a one-time code you paste into the StyleBook plugin inside Figma.
          </p>
        ) : (
          <p className="border-b border-black/[0.08] px-7 py-3 text-[12.5px] leading-[1.5] text-[#6E675C]">
            {EXPORT_HINTS[tab]}
          </p>
        )}

        {tab === "Figma" && !showFigmaPanel && (
          <div className="border-b border-black/[0.08] bg-white/60 px-7 py-4">
            <p className="font-mono-plex text-[10px] uppercase tracking-[0.18em] text-[#222D52]">
              How to use this in Figma
            </p>
            <ol className="mt-2.5 flex flex-col gap-2">
              {FIGMA_STEPS.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-[#6E675C]">
                  <span className="font-mono-plex flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-[#222D52] text-[9px] text-[#F2EBE0]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {showFigmaPanel ? (
          <div className="flex-1 overflow-auto px-7 py-6">
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-[13px] text-[#211E18]">
                <input type="checkbox" checked={figmaComponentLibrary} onChange={(e) => setFigmaComponentLibrary(e.target.checked)} />
                Component Library — buttons, cards, inputs, etc. as a Figma component set with hover/active/disabled/focus variants
              </label>
              <label className="flex items-center gap-2 text-[13px] text-[#211E18]">
                <input type="checkbox" checked={figmaCanvas} onChange={(e) => setFigmaCanvas(e.target.checked)} />
                Current Canvas — the assembled page, as one Figma frame
              </label>
            </div>

            <button
              type="button"
              onClick={generateFigmaCode}
              disabled={figmaState.kind === "generating" || (!figmaComponentLibrary && !figmaCanvas)}
              className="mt-6 rounded-full bg-[#222D52] px-6 py-[11px] text-[13px] text-[#F2EBE0] disabled:opacity-60"
            >
              {figmaState.kind === "generating" ? "Generating…" : "Generate export code"}
            </button>

            {figmaState.kind === "ready" && (
              <div className="mt-6 rounded-lg border border-black/[0.12] bg-white/60 p-5">
                <p className="font-mono-plex text-[10px] uppercase tracking-[0.18em] text-[#222D52]">Your code</p>
                <p className="mt-2 font-mono-plex text-[32px] tracking-[0.14em] text-[#211E18]">{figmaState.code}</p>
                <p className="mt-2 text-[12px] text-[#6E675C]">
                  Expires in {figmaState.expiresInMinutes} minutes. In Figma, run the StyleBook Import plugin and paste
                  this code.
                </p>
                {figmaState.missing.length > 0 && (
                  <p className="mt-3 border-t border-black/[0.08] pt-3 text-[12px] text-[#6E675C]">
                    Not included: {figmaState.missing.join(", ")} — no instance of these is on the canvas right now, so
                    there was nothing to capture.
                  </p>
                )}
              </div>
            )}
            {figmaState.kind === "error" && (
              <p className="mt-6 text-[13px] text-red-700">{figmaState.message}</p>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <pre className="whitespace-pre-wrap break-words px-7 py-6 font-mono-plex text-[12.5px] leading-[1.7] text-[#2B2820]">
              {code}
            </pre>
          </div>
        )}

        {!showFigmaPanel && (
          <div className="flex items-center justify-between gap-3 border-t border-black/[0.16] px-7 py-[18px]">
            <span className="truncate font-mono-plex text-[10px] uppercase tracking-[0.14em] text-[#6E675C]">
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
        )}
      </div>
    </div>
  );
}
