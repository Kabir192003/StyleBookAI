/**
 * InfoNote — the small "i" info button + popover used to surface a
 * Color's or Font's evergreen editorial `note` field. Per
 * docs/PRODUCT_AND_UX.md §6 this should feel like "a tooltip with a bit
 * more room to breathe," not a modal — so: lightweight popover, opens on
 * click (works on touch), closes on outside click or Escape.
 *
 * Owner: Amna (shared primitive — Dhanshri's browse cards can reuse this
 * too instead of building their own).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";

export function InfoNote({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Why this one"
        className="flex h-5 w-5 items-center justify-center rounded-full text-[#6E675C] transition-colors hover:bg-black/[0.05] hover:text-[#211E18]"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border border-black/[0.12] bg-[#F2EBE0] p-3 text-xs leading-relaxed text-[#6E675C] shadow-[0_20px_50px_-20px_rgba(20,17,12,0.4)]"
          >
            {note}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
