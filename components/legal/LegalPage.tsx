// Shared title block + prose container for /privacy, /terms, /ai-disclaimer,
// /guide. Styling the prose by hand with arbitrary selectors below since
// @tailwindcss/typography isn't installed here.
import Link from "next/link";

export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  wide = false,
  afterIntro,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro?: React.ReactNode;
  // widens the container — the guide page uses this, the others don't
  wide?: boolean;
  // sits below the intro, outside the prose styling — for a table of contents
  afterIntro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "mx-auto max-w-[880px] px-6 py-16 sm:py-20" : "mx-auto max-w-[760px] px-6 py-16 sm:py-20"}>
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
        {intro && <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-[#3A362E]">{intro}</p>}
      </div>

      {afterIntro}

      <div
        className="
          mt-10 max-w-[62ch] text-[15px] leading-relaxed text-[#3A362E]
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
  );
}
