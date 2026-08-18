/**
 * Footer — simple, shared across all non-landing pages. Same Silk ground
 * as the rest of the app-shell — Onyx is reserved for the rare gallery
 * moment (spec §02), not general chrome.
 *
 * Owner: Amna
 *
 * Unlike Navbar.tsx, nobody's added a global footer yet, so this one is
 * live: mounted per-route via app/account/layout.tsx and
 * app/dashboard/layout.tsx. Not mounted on the landing page
 * (LandingExperience.tsx already ends in its own <footer>) or on auth
 * screens (kept minimal/centered).
 */
import Link from "next/link";

const LINKS = [
  { label: "Colours", href: "/browse/colors" },
  { label: "Fonts", href: "/browse/fonts" },
  { label: "Themes", href: "/browse/themes" },
  { label: "Studio", href: "/studio" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Footer() {
  return (
    <footer className="border-t border-black/[0.14] bg-[#EDE6DA]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <Link href="/" className="font-editorial-serif text-base font-bold text-[#211E18]">
            StyleBook
          </Link>
          <span className="text-xs text-[#6E675C]">Design decisions, unified.</span>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-[#6E675C] transition-colors hover:text-[#211E18]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <span className="text-xs text-[#6E675C]">
          © {new Date().getFullYear()} StyleBook AI
        </span>
      </div>
    </footer>
  );
}
