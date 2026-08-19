// Owner: Amna
//
// Mounted on browse, legal, account and dashboard. Not on the landing page
// (it has its own footer, same links, own visual style), not on Studio (it's
// a full-screen canvas, a footer would just be scroll noise), and not on the
// auth screens (those just get a one-line legal mention, see AuthForm.tsx).
import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "Colours", href: "/browse/colors" },
  { label: "Fonts", href: "/browse/fonts" },
  { label: "Themes", href: "/browse/themes" },
  { label: "Studio", href: "/studio" },
  { label: "AI Generate", href: "/studio/ai" },
  { label: "Preview Lab", href: "/studio/compare" },
  { label: "Dashboard", href: "/dashboard" },
];

const HELP_LINKS = [
  { label: "How to use StyleBook", href: "/guide" },
  { label: "Colours & fonts", href: "/guide#colours" },
  { label: "Studio & AI Generate", href: "/guide#studio" },
  { label: "Exports & tokens", href: "/guide#exports" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "AI Disclaimer", href: "/ai-disclaimer" },
];

function FooterColumn({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={heading}>
      <div className="font-mono-plex text-[10px] uppercase tracking-[0.16em] text-[#8A8477]">{heading}</div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-[13px] font-medium text-[#6E675C] transition-colors hover:text-[#211E18]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-black/[0.14] bg-[#EDE6DA]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
            <Link href="/" className="font-editorial-serif text-base font-bold text-[#211E18]">
              StyleBook
            </Link>
            <span className="text-xs text-[#6E675C]">Design decisions, unified.</span>
          </div>

          <FooterColumn heading="Product" links={PRODUCT_LINKS} />
          <FooterColumn heading="Help" links={HELP_LINKS} />
          <FooterColumn heading="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-black/[0.1] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[52ch] text-[12px] leading-relaxed text-[#6E675C]">
            AI Generate is built on Google Gemini — like any AI tool, it can make mistakes. Review generated
            palettes, fonts, and reasoning before relying on them.{" "}
            <Link href="/ai-disclaimer" className="font-medium text-[#211E18] underline decoration-black/30 underline-offset-2 hover:decoration-black/60">
              Read the AI disclaimer
            </Link>
            .
          </p>
          <span className="shrink-0 text-xs text-[#6E675C]">© {new Date().getFullYear()} StyleBook AI</span>
        </div>
      </div>
    </footer>
  );
}
