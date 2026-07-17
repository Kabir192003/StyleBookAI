/**
 * Navbar — top nav used on every page except the landing page (which has
 * its own minimal header, see components/landing/LandingNav.tsx).
 *
 * Owner: Amna
 *
 * Mounted via each route group's own layout.tsx (app/dashboard/layout.tsx,
 * app/account/layout.tsx, app/pricing/layout.tsx, and — once those owners
 * add one — app/browse/layout.tsx / app/studio/layout.tsx) rather than the
 * root layout, so it never doubles up with LandingNav on `/`.
 */
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";

const BROWSE_LINKS = [
  { label: "Colours", href: "/browse/colors" },
  { label: "Fonts", href: "/browse/fonts" },
  { label: "Themes", href: "/browse/themes" },
];

const PRIMARY_LINKS = [
  { label: "Studio", href: "/studio" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isTouch = useIsTouchDevice();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const openBrowse = () => {
    clearTimeout(closeTimer.current);
    setBrowseOpen(true);
  };
  const scheduleCloseBrowse = () => {
    closeTimer.current = setTimeout(() => setBrowseOpen(false), 120);
  };

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-app-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-editorial-serif text-lg font-semibold text-app-heading"
          aria-label="StyleBook home"
        >
          <img src="/brand/stylebook-glyph.svg" alt="" aria-hidden="true" width={26} height={26} />
          StyleBook
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          <div
            className="relative"
            onMouseEnter={!isTouch ? openBrowse : undefined}
            onMouseLeave={!isTouch ? scheduleCloseBrowse : undefined}
          >
            <button
              type="button"
              onClick={() => setBrowseOpen((v) => !v)}
              aria-expanded={browseOpen}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isActive("/browse") ? "text-app-text" : "text-app-text-secondary hover:text-app-text"
              }`}
            >
              Browse
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${browseOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            <AnimatePresence>
              {browseOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-1/2 top-full mt-2 w-44 -translate-x-1/2 rounded-xl border border-app-border bg-app-surface p-1.5 shadow-lg"
                >
                  {BROWSE_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-lg px-3 py-2 text-sm text-app-text transition-colors hover:bg-app-surface-hover"
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href) ? "text-app-text" : "text-app-text-secondary hover:text-app-text"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: auth state */}
        <div className="hidden items-center gap-4 md:flex">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="text-sm font-medium text-app-text-secondary hover:text-app-text">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-pearl transition-colors hover:bg-app-accent-hover"
            >
              Sign up
            </Link>
          </SignedOut>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex items-center justify-center rounded-lg p-2 text-app-text md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-app-border bg-app-bg md:hidden"
            aria-label="Primary"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              <span className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-app-text-muted">
                Browse
              </span>
              {BROWSE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-2 py-2 text-sm text-app-text hover:bg-app-surface-hover"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-app-border" />
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-2 py-2 text-sm text-app-text hover:bg-app-surface-hover"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-app-border" />
              <SignedIn>
                <div className="flex items-center gap-3 px-2 py-2">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-sm text-app-text-secondary">Account</span>
                </div>
              </SignedIn>
              <SignedOut>
                <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2 text-sm text-app-text hover:bg-app-surface-hover">
                  Sign in
                </Link>
                <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="rounded-lg bg-app-accent px-2 py-2 text-sm font-medium text-pearl">
                  Sign up
                </Link>
              </SignedOut>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
