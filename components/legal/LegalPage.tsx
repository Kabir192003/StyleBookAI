// Shared title block + prose container for /privacy, /terms, /ai-disclaimer,
// /guide. Styling the prose by hand with arbitrary selectors below since
// @tailwindcss/typography isn't installed here.
import Link from "next/link";

const RELATED_PAGES = [
  { href: "/guide", label: "How to use StyleBook" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/ai-disclaimer", label: "AI Disclaimer" },
];

// Real content for the sidebar on the narrower pages (privacy/terms/AI
// disclaimer), which don't have a table of contents of their own the way
// the guide does. Without this the wide two-column layout had nothing to
// put beside the text, so widening the page just left a bigger empty gap
// instead of fixing it.
function RelatedLinks({ currentHref }: { currentHref: string }) {
  return (
    <nav aria-label="Legal pages" className="lg:mt-0">
      <div className="font-mono-plex text-[10px] uppercase tracking-[0.16em] text-[#8A8477]">On this site</div>
      <ul className="mt-3 flex flex-wrap gap-2 lg:mt-3 lg:flex-col lg:items-start lg:gap-1.5">
        {RELATED_PAGES.filter((p) => p.href !== currentHref).map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="inline-block rounded-full border border-black/[0.14] px-3.5 py-1.5 font-mono-plex text-[10.5px] uppercase tracking-[0.12em] text-[#211E18] no-underline transition-colors hover:bg-[#211E18] hover:text-[#F2EBE0] lg:block lg:rounded-none lg:border-0 lg:px-0 lg:py-1 lg:text-[13px] lg:normal-case lg:tracking-normal lg:text-[#6E675C] lg:hover:bg-transparent lg:hover:text-[#211E18] lg:hover:underline"
            >
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  wide = false,
  currentHref,
  afterIntro,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro?: React.ReactNode;
  // widens the container further — the guide page uses this, the others don't
  wide?: boolean;
  // this page's own path, so the sidebar doesn't link to itself
  currentHref: string;
  // sits below the intro, outside the prose styling — for a table of contents.
  // Falls back to RelatedLinks when not given, so every legal page gets a
  // real sidebar instead of empty space on a wide screen.
  afterIntro?: React.ReactNode;
  children: React.ReactNode;
}) {
  const sidebar = afterIntro ?? <RelatedLinks currentHref={currentHref} />;

  return (
    <div className={wide ? "mx-auto max-w-[1160px] px-6 py-14 sm:px-10 sm:py-16" : "mx-auto max-w-[1040px] px-6 py-14 sm:px-10 sm:py-16"}>
      <Link
        href="/"
        className="font-mono-plex text-[11px] uppercase tracking-[0.18em] text-[#6E675C] hover:text-[#211E18]"
      >
        ← StyleBook
      </Link>

      <div className="mt-8">
        <div className="font-mono-plex text-[11px] uppercase tracking-[0.22em] text-[#6E675C]">{eyebrow}</div>
        <h1 className="mt-2 font-editorial-serif text-[36px] font-normal leading-[1.05] tracking-[-0.02em] text-[#211E18] sm:text-[44px]">
          {title}
        </h1>
        <p className="mt-3 font-mono-plex text-[10px] uppercase tracking-[0.16em] text-[#6E675C]">
          Last updated {updated}
        </p>
        {intro && <p className="mt-6 max-w-[70ch] text-[16px] leading-relaxed text-[#3A362E]">{intro}</p>}
      </div>

      {/* Two columns from lg up on every legal page, not just the guide — a
          sticky sidebar (the section nav on the guide, cross-links to the
          other legal pages everywhere else) so the wider container has real
          content in it instead of just being a bigger empty page. */}
      <div className="lg:mt-10 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
        <div className="mt-8 lg:sticky lg:top-24 lg:mt-0 lg:self-start">{sidebar}</div>

        <div
          className="
            mt-10 max-w-[74ch] text-[15.5px] leading-relaxed text-[#3A362E] lg:mt-0
            [&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:border-t [&_h2]:border-black/[0.1] [&_h2]:pt-10
            [&_h2]:font-editorial-serif [&_h2]:text-[22px] [&_h2]:font-normal [&_h2]:tracking-[-0.01em] [&_h2]:text-[#211E18]
            [&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:font-grotesk [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-[0.06em] [&_h3]:text-[#211E18]
            [&_p]:mt-3 [&_p+p]:mt-3
            [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5
            [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5
            [&_li]:pl-1
            [&_a]:font-semibold [&_a]:text-[#222D52] [&_a]:underline [&_a]:decoration-[#222D52]/40 [&_a]:underline-offset-2 hover:[&_a]:decoration-[#222D52]
            [&_strong]:text-[#211E18] [&_strong]:font-semibold
            [&_code]:rounded [&_code]:bg-black/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono-plex [&_code]:text-[13px]
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}
