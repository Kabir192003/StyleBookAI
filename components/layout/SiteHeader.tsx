// Shared header, used on every page via the root layout. The hamburger
// trigger (see HamburgerMenu.tsx) holds Dashboard/Account/sign-in; fetches
// the current user once here so the drawer and every FavoriteButton on the
// page share one auth check instead of each firing their own.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { HamburgerMenu, HamburgerTrigger } from "./HamburgerMenu";

const NAV_LINKS = [
  { href: "/browse/colors", label: "Colours" },
  { href: "/browse/fonts", label: "Fonts" },
  { href: "/browse/themes", label: "Themes" },
  { href: "/studio", label: "Studio" },
];

function navLinkClasses(active: boolean) {
  return cn(
    "border-b-2 pb-[3px] font-mono-plex text-[11px] uppercase tracking-[0.18em] transition-colors",
    active ? "border-[#211E18] text-[#211E18]" : "border-transparent text-[#6E675C] hover:text-[#211E18]"
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.18] bg-[#F2EBE0]/[0.94] backdrop-blur-md">
      {/* Visually hidden until focused, so keyboard and screen-reader users
          can jump the nav instead of tabbing it on every page. Every route's
          <main> carries id="main" to receive it. */}
      <a
        href="#main"
        className="sr-only rounded-b-lg focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[100] focus:bg-[#211E18] focus:px-4 focus:py-2 focus:text-[13px] focus:text-[#F2EBE0]"
      >
        Skip to main content
      </a>
      <div className="flex h-14 items-center justify-between gap-6 px-6 sm:px-12">
        {/* Menu trigger sits at the far LEFT, before the wordmark — a
            top-right menu is off-screen at high zoom for magnification
            users, who scan from the left edge. Also first in DOM order so
            tab order matches visual order. */}
        <div className="flex shrink-0 items-center gap-3">
          <HamburgerTrigger onClick={() => setMenuOpen(true)} />
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-editorial-serif text-[21px] font-semibold tracking-[-0.01em] text-[#211E18]"
          >
            <img src="/brand/stylebook-logo.svg" alt="" className="h-6 w-6" aria-hidden="true" />
            StyleBook
          </Link>
        </div>

        <nav className="hidden items-center gap-8 sm:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={navLinkClasses(!!active)}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/studio/ai"
          className="shrink-0 rounded-full bg-[#222D52] px-[22px] py-2.5 text-[13px] tracking-[0.02em] text-[#F2EBE0] transition-transform hover:-translate-y-0.5"
        >
          Generate with AI
        </Link>
      </div>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
