// The site-wide nav drawer: Dashboard/Account/sign-in-out, account-adjacent
// only (the header's top-level Colours/Fonts/Themes/Studio nav stays as-is).
//
// Rendered via a portal into document.body rather than inline where
// SiteHeader mounts it — SiteHeader's <header> is `position: sticky` with
// its own z-index, which creates a stacking context, so a `position: fixed`
// overlay nested inside it would only stack within that context instead of
// against the rest of the page. Portaling to body escapes that entirely.
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, LogOut, Menu, Palette, Shapes, Sparkles, Type, User, X } from "lucide-react";
import { useAuthStore } from "@/store";

// Mirrors NAV_LINKS in SiteHeader — the header hides its own copy below
// `sm`, so these are the only way to reach the libraries on a phone.
const PRIMARY_LINKS = [
  { href: "/browse/colors", label: "Colours", icon: Palette },
  { href: "/browse/fonts", label: "Fonts", icon: Type },
  { href: "/browse/themes", label: "Themes", icon: Shapes },
  { href: "/studio", label: "Studio", icon: Sparkles },
];

function MenuLink({ href, icon: Icon, label, onNavigate }: { href: string; icon: React.ElementType; label: string; onNavigate: () => void }) {
  const pathname = usePathname();
  const active = pathname?.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors ${
        active ? "bg-[#211E18] text-[#F2EBE0]" : "text-[#211E18] hover:bg-black/[0.05]"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function HamburgerMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  async function handleSignOut() {
    await logout();
    onClose();
    router.push("/");
  }

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex justify-start bg-[rgba(20,17,12,0.42)] backdrop-blur-[3px]"
    >
      {/* Anchored to the LEFT edge, following its trigger (see SiteHeader.tsx)
          — opening on the opposite side from the button that triggered it
          would recreate the pan-across problem this menu exists to fix. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[min(340px,88vw)] flex-col border-r border-black/20 bg-[#F2EBE0]"
      >
        <div className="flex items-center justify-between border-b border-black/[0.14] px-6 py-5">
          <span className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-black/[0.18] text-[#211E18]"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {/* Header nav is `hidden sm:flex`, so below 640px it renders
              nothing — repeated here and hidden again at `sm` so neither
              breakpoint shows them twice. */}
          <div className="sm:hidden">
            <span className="block px-4 pb-1 pt-2 font-mono-plex text-[9px] uppercase tracking-[0.18em] text-[#6E675C]">
              Browse
            </span>
            {PRIMARY_LINKS.map((link) => (
              <MenuLink key={link.href} href={link.href} icon={link.icon} label={link.label} onNavigate={onClose} />
            ))}
            <div className="my-3 border-t border-black/[0.10]" />
            <span className="block px-4 pb-1 font-mono-plex text-[9px] uppercase tracking-[0.18em] text-[#6E675C]">
              Account
            </span>
          </div>
          <MenuLink href="/dashboard" icon={LayoutGrid} label="My Projects" onNavigate={onClose} />
          <MenuLink href="/account" icon={User} label="Account" onNavigate={onClose} />
        </div>

        <div className="border-t border-black/[0.14] p-4">
          {status === "loading" ? null : user ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-black/[0.04] px-4 py-3">
              <div className="min-w-0">
                <div className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">Signed in as</div>
                <div className="truncate text-sm font-semibold text-[#211E18]">{user.username}</div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs font-medium text-[#211E18] hover:bg-black/[0.04]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/sign-in"
                onClick={onClose}
                className="rounded-full bg-[#222D52] py-2.5 text-center text-sm font-semibold text-[#F2EBE0]"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={onClose}
                className="rounded-full border border-black/20 py-2.5 text-center text-sm font-medium text-[#211E18] hover:bg-black/[0.04]"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function HamburgerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      className="grid h-8 w-8 place-items-center rounded-full text-[#211E18] transition-colors hover:bg-black/[0.06]"
    >
      <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}
