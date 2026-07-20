/**
 * Shared header — used on every page via the root layout. Same branding
 * and links as the landing page's original nav (components/landing/LandingNav.tsx,
 * now retired in favor of this), with active-tab highlighting and a real
 * profile control instead of a decorative one.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/browse/colors", label: "Colours" },
  { href: "/browse/fonts", label: "Fonts" },
  { href: "/browse/themes", label: "Themes" },
  { href: "/studio", label: "Studio" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#F2EBE0]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-[15px] font-bold tracking-tight text-[#16192A]">
          <img src="/brand/stylebook-logo.svg" alt="" className="h-7 w-7" aria-hidden="true" />
          StyleBook
        </Link>

        <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-sm transition-colors",
                  active ? "font-semibold text-[#16192A]" : "font-medium text-[#494E60] hover:text-[#16192A]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/studio/ai"
            className="rounded-full bg-[#222D52] px-4 py-2 text-sm font-semibold text-[#F7F3EA] transition-transform hover:-translate-y-0.5"
          >
            Generate with AI
          </Link>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              aria-current={pathname?.startsWith("/sign-in") || pathname?.startsWith("/account") ? "page" : undefined}
              className={cn(
                "text-sm transition-colors",
                pathname?.startsWith("/sign-in") || pathname?.startsWith("/account")
                  ? "font-semibold text-[#16192A]"
                  : "font-medium text-[#494E60] hover:text-[#16192A]"
              )}
            >
              Profile
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
