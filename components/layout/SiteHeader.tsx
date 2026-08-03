/**
 * Shared header — used on every page via the root layout. Styled to match
 * the header markup shared by Colours.dc.html / Fonts.dc.html /
 * Themes.dc.html from claude.ai/design (project "Website redesign
 * request"): Fraunces wordmark, IBM Plex Mono nav, cream/ink/navy
 * editorial palette. Studio isn't in that design (it has no app shell to
 * link to) but is styled in the same mono nav voice so the header reads
 * as one piece with the rest of the chrome.
 *
 * The old "Profile" text link is now a hamburger trigger (see
 * HamburgerMenu.tsx) that also holds Dashboard/Account/sign-in — fetches
 * the current user once here so the drawer and every FavoriteButton on
 * the page share one auth check instead of each firing their own.
 */
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
      <div className="flex h-14 items-center justify-between gap-6 px-6 sm:px-12">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-editorial-serif text-[21px] font-semibold tracking-[-0.01em] text-[#211E18]"
        >
          <img src="/brand/stylebook-logo.svg" alt="" className="h-6 w-6" aria-hidden="true" />
          StyleBook
        </Link>

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

        <div className="flex items-center gap-4">
          <Link
            href="/studio/ai"
            className="rounded-full bg-[#222D52] px-[22px] py-2.5 text-[13px] tracking-[0.02em] text-[#F2EBE0] transition-transform hover:-translate-y-0.5"
          >
            Generate with AI
          </Link>

          <HamburgerTrigger onClick={() => setMenuOpen(true)} />
        </div>
      </div>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
