/**
 * Footer — simple, shared across all non-landing pages. Mirrors the link
 * taxonomy the landing page's own footer uses (see FOOTER_LINKS in
 * components/landing/FinalCTA.tsx) plus the two in-app-only routes.
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
    <footer className="border-t border-app-border bg-app-bg">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <Link href="/" className="font-editorial-serif text-base font-semibold text-app-heading">
            StyleBook
          </Link>
          <span className="text-xs text-app-text-muted">Design decisions, unified.</span>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-app-text-secondary transition-colors hover:text-app-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <span className="text-xs text-app-text-muted">
          © {new Date().getFullYear()} StyleBook AI
        </span>
      </div>

      {/*
        "Built with StyleBook AI" badge concept (per this file's TODO): once
        /api/export can stamp a small credit line onto exported PDFs/images,
        the same <BuiltWithBadge /> markup can live here for the marketing
        site and on the export artifact itself. Not built yet — v1 export
        is plain, uncredited output; revisit post-v1.
      */}
    </footer>
  );
}
