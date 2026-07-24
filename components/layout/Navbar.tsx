/**
 * Navbar — top nav used on every page except the landing page (which has
 * its own header, see components/landing/LandingNav.tsx).
 *
 * Owner: Amna
 *
 * STATUS: not currently mounted anywhere. Since this was built, someone
 * on the browse/colors-fonts-themes side added components/layout/
 * SiteHeader.tsx and wired it globally into app/layout.tsx — it already
 * covers every route (including auth-state via Clerk's SignedIn/
 * SignedOut) and matches the Colours/Fonts/Themes page designs. Mounting
 * this alongside it would double up the header. Keeping this file built
 * (per the original ticket) in case the team decides to consolidate onto
 * this version instead, but treat SiteHeader as the live one for now.
 *
 * Built against docs/StyleBook-Design-System.pdf §06 "Navigation":
 * translucent from the first pixel (rgba silk, blur), a small gold "brand
 * dot", and a glass pill CTA — never a flat-fill button in the nav. Onyx
 * stays reserved for the rare gallery moment (spec §02) — the nav itself
 * never goes dark.
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
    <header className="sticky top-0 z-40 border-b border-app-border bg-app-bg/30 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-geometric-sans text-lg font-bold text-app-heading"
          aria-label="StyleBook home"
        >
          <span
            className="block h-3.5 w-3.5 rounded-full bg-gold-foil shadow-app-sm transition-transform duration-300 group-hover:scale-125 group-hover:rotate-[18deg]"
            aria-hidden="true"
          />
          StyleBook
        </Link>

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
                isActive("/browse") ? "text-app-heading" : "text-app-text-secondary hover:text-app-heading"
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
                  className="absolute left-1/2 top-full mt-2 w-44 -translate-x-1/2 rounded-lg border border-glass-panel bg-app-glass-panel p-1.5 shadow-app-lg backdrop-blur-xl"
                >
                  {BROWSE_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-md px-3 py-2 text-sm text-app-text transition-colors hover:bg-app-surface-hover"
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
              className={`relative text-sm font-medium transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-app-heading after:transition-all after:duration-300 hover:after:w-full ${
                isActive(link.href) ? "text-app-heading after:w-full" : "text-app-text-secondary hover:text-app-heading"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="text-sm font-medium text-app-text-secondary hover:text-app-heading">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="glass-sheen rounded-full border border-glass-primary bg-glass-primary px-5 py-2 text-sm font-medium text-[#F7F3EA] shadow-app-sm backdrop-blur-md transition-all hover:-translate-y-[2px] hover:shadow-app-md"
            >
              Sign up
            </Link>
          </SignedOut>
        </div>

        <button
          type="button"
          className="flex items-center justify-center rounded-lg p-2 text-app-heading md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-app-border bg-app-bg/95 backdrop-blur-md md:hidden"
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
                <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="rounded-full border border-glass-primary bg-glass-primary px-4 py-2 text-center text-sm font-medium text-[#F7F3EA]">
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
