/**
 * Live mock preview on the AI results screen. Renders from
 * `result.mockup` — real nav/hero/card copy the model wrote specifically
 * for the described business (a car dealership brief gets inventory
 * cards and "Schedule a test drive", a hotel brief gets room types, a
 * SaaS brief gets feature/pricing cards), not a fixed set of generic
 * per-industry templates. See lib/ai/prompt.ts for the mockup contract
 * and lib/ai/schema.ts for its shape.
 *
 * Every visual element still derives its color/font from the same
 * resolved tokens passed in — only the copy comes from the model.
 * `buildFallbackMockup` covers `result.mockup` being absent (older
 * sessionStorage-cached aiResultStore entries from before this field
 * existed) with generic-but-real copy instead of crashing.
 */
import { AIGeneratedProject } from "@/types/ai";
import { MockupSpec } from "@/types/ai";

type Tokens = {
  result: AIGeneratedProject;
  surface: string;
  ink: string;
  accent: string;
  support: string;
  onAccent: string;
};

const FALLBACK_MOCKUPS: Record<string, MockupSpec> = {
  ecommerce: {
    siteLabel: "Shop",
    navItems: ["New arrivals", "Shop all", "About", "Cart"],
    hero: { headline: "New arrivals, made to last.", subheadline: "A shopfront styled entirely from your generated tokens.", primaryCta: "Shop now" },
    cards: [
      { title: "Everyday tote", subtitle: "Canvas, hand-finished", meta: "$68", cta: "Add to cart" },
      { title: "Studio candle", subtitle: "Soy wax, 40hr burn", meta: "$24", cta: "Add to cart" },
    ],
  },
  government: {
    siteLabel: "Official portal",
    navItems: ["Services", "Forms", "Contact", "Search"],
    hero: { headline: "Official information portal", subheadline: "Find services, forms, and guidance below.", primaryCta: "Search" },
    cards: [
      { title: "Renew a licence", subtitle: "Online in under 10 minutes", cta: "Start" },
      { title: "Pay a fine", subtitle: "Secure payment portal", cta: "Pay now" },
      { title: "Book an appointment", subtitle: "Choose a nearby office", cta: "Book" },
    ],
  },
  editorial: {
    siteLabel: "Field notes",
    navItems: ["Stories", "Essays", "About", "Subscribe"],
    hero: { eyebrow: "Field notes · 6 min read", headline: "On building something worth reading.", subheadline: "Every layout here is painted with the tokens generated from your prompt.", primaryCta: "Read more" },
    cards: [
      { title: "The long way round", subtitle: "On patience as a design principle", cta: "Read" },
      { title: "Notes from the studio", subtitle: "A year in sketches", cta: "Read" },
    ],
  },
  saas: {
    siteLabel: "Product",
    navItems: ["Product", "Pricing", "Docs", "Sign in"],
    hero: { eyebrow: "Live preview", headline: "Your brand, instantly dressed.", subheadline: "Every element here is painted with the tokens generated from your prompt.", primaryCta: "Sign up", secondaryCta: "See pricing" },
    cards: [
      { title: "Fast setup", subtitle: "Live in minutes, not weeks", cta: "Learn more" },
      { title: "On brand", subtitle: "Every token stays consistent", cta: "Learn more" },
    ],
  },
};

function buildFallbackMockup(context: string): MockupSpec {
  return FALLBACK_MOCKUPS[context] ?? FALLBACK_MOCKUPS.saas;
}

function Header({ result, ink, accent, onAccent, navItems, ctaLabel }: Tokens & { navItems: string[]; ctaLabel: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-[18px] py-3.5"
      style={{ borderBottom: `1px solid color-mix(in srgb, ${ink} 10%, transparent)` }}
    >
      <span style={{ fontFamily: `'${result.fonts.primary.family}', serif`, fontWeight: 700, fontSize: 17, whiteSpace: "nowrap" }}>
        {result.name}
      </span>
      <div className="hidden flex-1 items-center justify-center gap-4 sm:flex">
        {navItems.slice(0, 4).map((item) => (
          <span
            key={item}
            className="truncate text-[11px]"
            style={{ fontFamily: `'${result.fonts.secondary.family}', sans-serif`, color: `color-mix(in srgb, ${ink} 62%, transparent)` }}
          >
            {item}
          </span>
        ))}
      </div>
      <span
        className="shrink-0 rounded-[10px] px-[15px] py-2 text-xs font-semibold"
        style={{ backgroundColor: accent, color: onAccent, fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
      >
        {ctaLabel}
      </span>
    </div>
  );
}

function Hero({ result, ink, accent, onAccent, mockup }: Tokens & { mockup: MockupSpec }) {
  return (
    <div className="flex flex-col gap-3.5 px-[22px] py-[26px]">
      {mockup.hero.eyebrow && (
        <span
          className="self-start rounded-full px-[11px] py-[5px] text-[10px] uppercase tracking-[0.14em]"
          style={{
            fontFamily: `'${result.fonts.secondary.family}', sans-serif`,
            color: `color-mix(in srgb, ${ink} 62%, transparent)`,
            border: `1px solid color-mix(in srgb, ${ink} 24%, transparent)`,
          }}
        >
          {mockup.hero.eyebrow}
        </span>
      )}
      <div style={{ fontFamily: `'${result.fonts.primary.family}', serif`, fontWeight: 700, fontSize: 30, lineHeight: 1.08, letterSpacing: "-0.01em" }}>
        {mockup.hero.headline}
      </div>
      <p
        style={{
          fontFamily: `'${result.fonts.secondary.family}', sans-serif`,
          fontSize: 14,
          lineHeight: 1.55,
          margin: 0,
          color: `color-mix(in srgb, ${ink} 68%, transparent)`,
        }}
      >
        {mockup.hero.subheadline}
      </p>
      <div className="mt-0.5 flex gap-2.5">
        <span
          className="rounded-[10px] px-5 py-[11px] text-[13px] font-semibold"
          style={{ backgroundColor: accent, color: onAccent, fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
        >
          {mockup.hero.primaryCta}
        </span>
        {mockup.hero.secondaryCta && (
          <span
            className="rounded-[10px] px-[18px] py-2.5 text-[13px]"
            style={{ border: `1px solid color-mix(in srgb, ${ink} 28%, transparent)`, color: ink, fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
          >
            {mockup.hero.secondaryCta}
          </span>
        )}
      </div>
    </div>
  );
}

function Cards({ result, surface, ink, accent, support, onAccent, cards }: Tokens & { cards: MockupSpec["cards"] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-[22px] pb-[26px]">
      {cards.slice(0, 4).map((card, i) => (
        <div
          key={card.title}
          className="rounded-[10px] p-3.5"
          style={{ backgroundColor: `color-mix(in srgb, ${ink} 5%, ${surface})`, border: `1px solid color-mix(in srgb, ${ink} 9%, transparent)` }}
        >
          <div
            className="h-[26px] w-[26px] rounded-md"
            style={{ backgroundColor: `color-mix(in srgb, ${i % 2 === 0 ? accent : support} ${i % 2 === 0 ? 18 : 26}%, transparent)` }}
          />
          <div className="mt-2.5 truncate text-sm font-semibold" style={{ fontFamily: `'${result.fonts.primary.family}', serif` }}>
            {card.title}
          </div>
          <div
            className="mt-0.5 truncate text-[11px]"
            style={{ fontFamily: `'${result.fonts.secondary.family}', sans-serif`, color: `color-mix(in srgb, ${ink} 62%, transparent)` }}
          >
            {card.subtitle}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            {card.meta ? (
              <span className="truncate text-[12px]" style={{ color: `color-mix(in srgb, ${ink} 68%, transparent)` }}>
                {card.meta}
              </span>
            ) : (
              <span />
            )}
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ backgroundColor: accent, color: onAccent, fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
            >
              {card.cta}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Footer({ result, ink, footerNote }: Tokens & { footerNote?: string }) {
  if (!footerNote) return null;
  return (
    <div
      className="px-[22px] py-3 text-[11px]"
      style={{
        borderTop: `1px solid color-mix(in srgb, ${ink} 10%, transparent)`,
        color: `color-mix(in srgb, ${ink} 55%, transparent)`,
        fontFamily: `'${result.fonts.secondary.family}', sans-serif`,
      }}
    >
      {footerNote}
    </div>
  );
}

export function LivePreviewMock(props: Tokens) {
  const { result, surface, ink } = props;
  const context = result.context ?? "generic";
  const mockup = result.mockup ?? buildFallbackMockup(context);
  const ctaLabel = mockup.hero.primaryCta;

  return (
    <div className={`overflow-hidden border border-white/[0.12] ${context === "government" ? "rounded-md" : "rounded-2xl"}`} style={{ backgroundColor: surface, color: ink }}>
      <Header {...props} navItems={mockup.navItems} ctaLabel={ctaLabel} />
      <Hero {...props} mockup={mockup} />
      <Cards {...props} cards={mockup.cards} />
      <Footer {...props} footerNote={mockup.footerNote} />
    </div>
  );
}
