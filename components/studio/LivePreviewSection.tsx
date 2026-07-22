/**
 * "Live Preview" panel in Studio — renders the app's supported components
 * (see lib/studio/livePreviewBlocks.ts) styled by the *exact* CSS the Export
 * drawer's CSS tab would give a user (generateExportCode("CSS", tokens),
 * lib/studio/exportCode.ts), injected into a sandboxed-by-origin iframe via
 * srcDoc rather than re-implemented here. Since it derives everything from
 * `tokens` (the same StudioState the rest of Studio and the export drawer
 * already read), it updates automatically whenever a token, or a whole
 * AI-generated design system, changes — no separate sync path to maintain.
 *
 * The Light/Dark toggle just flips `data-theme` on the iframe document's
 * <html>, which is exactly the selector the generated CSS's dark block
 * targets — no separate dark-mode styling logic.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { generateExportCode, StudioExportTokens } from "@/lib/studio/exportCode";
import { buildLivePreviewDocument } from "@/lib/studio/livePreviewDocument";

export function LivePreviewSection({ tokens }: { tokens: StudioExportTokens }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(480);

  const cssText = useMemo(() => generateExportCode("CSS", tokens), [tokens]);
  const srcDoc = useMemo(() => buildLivePreviewDocument(cssText, theme), [cssText, theme]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    function resize() {
      const doc = iframe?.contentDocument;
      if (doc?.body) setHeight(doc.body.scrollHeight + 8);
    }
    iframe.addEventListener("load", resize);
    return () => iframe.removeEventListener("load", resize);
  }, [srcDoc]);

  return (
    <div className="mt-5 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#222D52]">Live preview</p>
          <p className="mt-1 text-[12px] text-[#8A8477]">
            Rendered from the same CSS as Export → CSS — not a separate mock.
          </p>
        </div>
        <div className="inline-flex overflow-hidden rounded-full border border-black/[0.16]">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className="px-4 py-1.5 text-xs capitalize"
              style={{
                backgroundColor: theme === t ? "#222D52" : "transparent",
                color: theme === t ? "#F2EBE0" : "#6E675C",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title="Design system live preview"
        srcDoc={srcDoc}
        style={{ width: "100%", height, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, background: "white" }}
      />
    </div>
  );
}
