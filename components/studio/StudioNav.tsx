// Shared sub-nav across Studio's three sections. Deliberately a thin strip
// mounted above each page's own content, not a layout wrapper — /studio/compare
// renders its own <main> with its own background, and StudioBuilder owns its
// full-bleed canvas, so a shared layout.tsx would fight both.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/studio", label: "Builder", hint: "Tokens by hand" },
  { href: "/studio/ai", label: "AI Generate", hint: "From a brief" },
  { href: "/studio/compare", label: "Preview Lab", hint: "Colour + type" },
] as const;

export function StudioNav() {
  const pathname = usePathname();
  // Shown as a plain caption, not a hover title, so a first-time visitor sees
  // what the active tab is for without needing to hover anything.
  const active = SECTIONS.find((s) => s.href === pathname) ?? SECTIONS[0];

  return (
    <nav aria-label="Studio sections" className="border-b border-black/[0.08] bg-[#EDE6DA]">
      <div className="mx-auto max-w-6xl px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono-plex mr-2 text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Studio</span>
          {SECTIONS.map((section) => {
            // Exact match, not startsWith — "/studio" prefixes every other
            // section's href, so a prefix test would light up Builder everywhere.
            const isActive = pathname === section.href;
            return (
              <Link
                key={section.href}
                href={section.href}
                aria-current={isActive ? "page" : undefined}
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
        <p className="mt-1.5 pl-[calc(10px+0.5rem)] text-[11px] text-[#6E675C]">{active.hint}</p>
      </div>
    </nav>
  );
}
