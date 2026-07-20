/**
 * /browse layout — sticky tab nav across Colors/Fonts/Themes.
 * Ported from Dhanshri's Lovable design ("Design Browse Hub") — see
 * docs/CONTEXT.md for the porting note.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, Type, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/browse/colors", label: "Colors", icon: Palette },
  { href: "/browse/fonts", label: "Fonts", icon: Type },
  { href: "/browse/themes", label: "Themes", icon: Layers },
] as const;

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold tracking-tight text-neutral-900">
            StyleBook
          </Link>
          <nav className="flex items-center gap-1">
            {TABS.map((t) => {
              const active = pathname?.startsWith(t.href);
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">{children}</main>
    </div>
  );
}
