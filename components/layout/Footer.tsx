/**
 * Footer — simple, shared across all non-landing pages. Same dark onyx
 * chrome as Navbar, so the "cover" reads as one continuous frame around
 * the cream page content. Mirrors the landing page's own footer link
 * taxonomy (see FOOTER_LINKS in components/landing/FinalCTA.tsx) plus the
 * two in-app-only routes.
 *
 * Owner: Amna
 */
import Link from "next/link";

const LINKS = [
  { label: "Colours", href: "/browse/colors" },
  { label: "Fonts", href: "/browse/fonts" },
  { label: "Themes", href: "/browse/themes" },
  { label: "Studio", href: "/studio" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Pricing", href: "/pricing" },
];

export function Footer() {
  return (
    <footer className="bg-app-cover-bg">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <Link href="/" className="font-editorial-serif text-base font-semibold text-app-cover-text">
            StyleBook
          </Link>
          <span className="text-xs text-app-cover-text-muted">Design decisions, unified.</span>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-app-cover-text-muted transition-colors hover:text-app-cover-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <span className="text-xs text-app-cover-text-muted">
          © {new Date().getFullYear()} StyleBook AI
        </span>
      </div>
    </footer>
  );
}
