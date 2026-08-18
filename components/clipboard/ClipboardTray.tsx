/**
 * ClipboardTray — a floating, always-mounted panel (see app/layout.tsx)
 * for the in-app design clipboard (store/clipboardStore.ts). Collects
 * colors/fonts added from Browse via ClipboardButton, and turns them into
 * a single "Import into Studio" action via the same studioImportStore
 * stage/consume bridge Preview Lab's "Send to Studio" uses
 * (lib/studio/applyImport.ts) — so Studio ends up being the one place
 * every "send this to Studio" path converges on.
 *
 * `hydrated` gates the first real render: clipboardStore is persisted to
 * localStorage, so the store's initial value on the client differs from
 * the server-rendered empty state until zustand's persist middleware
 * rehydrates — rendering the badge/panel before that would either mismatch
 * or briefly flash "0".
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ClipboardList, X, ArrowUpRight, Trash2 } from "lucide-react";
import { useClipboardStore } from "@/store/clipboardStore";
import { useStudioImportStore } from "@/store/studioImportStore";
import { usePreviewLabStore } from "@/store/previewLabStore";

export function ClipboardTray() {
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const colors = useClipboardStore((s) => s.colors);
  const fonts = useClipboardStore((s) => s.fonts);
  const removeColor = useClipboardStore((s) => s.removeColor);
  const removeFont = useClipboardStore((s) => s.removeFont);
  const clear = useClipboardStore((s) => s.clear);
  const stageStudioImport = useStudioImportStore((s) => s.stage);
  const addSidebarItems = usePreviewLabStore((s) => s.addSidebarItems);

  useEffect(() => setHydrated(true), []);
  // Studio consumes the staged payload once on its own mount — closing the
  // tray here just tidies the UI, it isn't what makes the import work.
  useEffect(() => setOpen(false), [pathname]);

  if (!hydrated) return null;

  const count = colors.length + fonts.length;

  function handleImport() {
    if (count === 0) return;
    stageStudioImport({
      colors: colors.map((c) => ({ hex: c.hex })),
      primaryFont: fonts[0]?.family,
      secondaryFont: fonts[1]?.family,
    });
    setOpen(false);
    router.push("/studio");
  }

  function handleImportToLivePreview() {
    if (count === 0) return;
    addSidebarItems(colors, fonts);
    setOpen(false);
    router.push("/studio/compare");
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[300px] max-w-[85vw] rounded-2xl border border-black/[0.14] bg-[#F2EBE0] shadow-xl">
          <div className="flex items-center justify-between border-b border-black/[0.12] px-4 py-3">
            <span className="font-mono-plex text-[11px] uppercase tracking-[0.18em] text-[#211E18]">
              Clipboard — {count}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close clipboard"
              className="rounded-full p-1 text-[#6E675C] hover:bg-black/[0.06] hover:text-[#211E18]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[280px] overflow-y-auto px-4 py-3">
            {count === 0 ? (
              <p className="py-6 text-center text-[13px] leading-relaxed text-[#6E675C]">
                Nothing clipped yet. Use the clipboard icon on any colour or font in Browse.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {colors.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5">
                    <span
                      className="h-6 w-6 shrink-0 rounded-full border border-black/[0.14]"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-[#211E18]">{c.name}</p>
                      <p className="font-mono-plex text-[10px] uppercase tracking-[0.1em] text-[#6E675C]">{c.hex}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeColor(c.id)}
                      aria-label={`Remove ${c.name} from clipboard`}
                      className="rounded-full p-1 text-[#6E675C] hover:bg-black/[0.06] hover:text-[#211E18]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {fonts.map((f) => (
                  <div key={f.id} className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/[0.14] font-editorial-serif text-[13px] text-[#211E18]">
                      Aa
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-[#211E18]">{f.family}</p>
                      <p className="font-mono-plex text-[10px] uppercase tracking-[0.1em] text-[#6E675C]">
                        {f.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFont(f.id)}
                      aria-label={`Remove ${f.family} from clipboard`}
                      className="rounded-full p-1 text-[#6E675C] hover:bg-black/[0.06] hover:text-[#211E18]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {count > 0 && (
            <div className="flex flex-col gap-2 border-t border-black/[0.12] px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImport}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#222D52] px-3 py-2 text-[12px] font-medium text-[#F5F1E8] transition-colors hover:bg-[#1A2340]"
                >
                  Import into Studio <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={clear}
                  aria-label="Clear clipboard"
                  className="rounded-full border border-black/[0.14] p-2 text-[#6E675C] hover:bg-black/[0.06] hover:text-[#211E18]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleImportToLivePreview}
                className="flex items-center justify-center gap-1.5 rounded-full border border-[#222D52]/30 px-3 py-2 text-[12px] font-medium text-[#222D52] transition-colors hover:bg-[#222D52]/[0.06]"
              >
                Import to Live Preview <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close clipboard" : "Open clipboard"}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.14] bg-[#211E18] text-[#F5F1E8] shadow-lg transition-transform hover:scale-105"
      >
        <ClipboardList className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C36B3E] px-1 font-mono-plex text-[10px] text-white">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}
