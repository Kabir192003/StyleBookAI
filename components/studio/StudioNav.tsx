/**
 * Shared sub-nav across Studio's four sections. Studio's IA has always been
 * route-based (/studio, /studio/ai, /studio/compare, and now
 * /studio/playground), but nothing on any of those pages linked to the
 * others — you could only reach the Preview Lab by typing the URL, which is
 * how the playground would have shipped invisible too.
 *
 * Deliberately a thin strip mounted *above* each page's own content rather
 * than a layout wrapper: /studio/compare renders its own <main> with its own
 * background, and StudioBuilder owns its full-bleed canvas, so a shared
 * layout.tsx would have had to fight both. Nothing here touches either
 * page's internals.
 *
 * Styled in the site's editorial language — #EDE6DA page, #F2EBE0 card,
 * #211E18 ink, #6E675C muted, #222D52 accent, font-mono-plex uppercase
 * labels — the same values StudioBuilder and LivePreviewSection use inline.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/studio", label: "Builder", hint: "Tokens by hand" },
  { href: "/studio/ai", label: "AI Generate", hint: "From a brief" },
  { href: "/studio/compare", label: "Preview Lab", hint: "Colour + type" },
  { href: "/studio/playground", label: "Playground", hint: "Experiments" },
] as const;

export function StudioNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Studio sections" className="border-b border-black/[0.08] bg-[#EDE6DA]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-3">
        <span className="font-mono-plex mr-2 text-[10px] uppercase tracking-[0.2em] text-[#B4AD9E]">Studio</span>
        {SECTIONS.map((section) => {
          // Exact match, not `startsWith` — "/studio" is a prefix of every
          // other section's href, so a prefix test lights up the Builder tab
          // on all four pages.
          const isActive = pathname === section.href;
          return (
            <Link
              key={section.href}
              href={section.href}
              aria-current={isActive ? "page" : undefined}
              title={section.hint}
              className={cn(
                "font-mono-plex rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors",
                isActive
                  ? "bg-[#222D52] text-[#F2EBE0]"
                  : "border border-black/[0.12] bg-[#F2EBE0] text-[#6E675C] hover:text-[#211E18]"
              )}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
