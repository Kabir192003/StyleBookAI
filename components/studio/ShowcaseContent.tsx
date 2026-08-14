/**
 * The canvas's default content: a real product page, not a specimen sheet.
 *
 * The distinction matters more than it looks. A page of labelled component
 * groups ("Buttons", "Inputs", …) tells you the parts exist; it cannot tell
 * you whether the system *works* — whether the accent survives next to the
 * muted text, whether the display face and the body face belong together,
 * whether a table of numbers is still readable under the brand. Those only
 * show up when the components sit in the arrangement a user would actually
 * meet them in. So this is a landing page for a fictional product, and the
 * component coverage is a consequence of building a believable page rather
 * than the goal of it.
 *
 * Every element is a live component reading canvas tokens, and every one of
 * the ten editable `ComponentName`s appears at least once in a natural
 * position, so clicking anything in the page opens the inspector for the
 * thing you clicked. Nothing here defines a colour, a font or a radius — this
 * file only arranges; see components/system/styles.ts for the token chain.
 */
"use client";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import { SaveButton, LikeButton } from "@/components/system/Buttons";
import { FollowButton } from "@/components/system/Cards";
import { Navbar, Tabs, Breadcrumbs } from "@/components/system/Navigation";
import { ValidatedEmailField } from "@/components/system/Inputs";
import {
  CheckboxSet,
  RadioSet,
  Switch,
  SelectField,
  ProgressDemo,
  Tooltip,
  ModalDemo,
} from "@/components/system/Controls";
import { useSystemStyles } from "@/components/system/primitives";

const STATS = [
  { value: "1,284", label: "Tokens under management" },
  { value: "37", label: "Products on the system" },
  { value: "99.2%", label: "Contrast checks passing" },
];

const FEATURES = [
  {
    badge: "Foundations",
    title: "One source of truth",
    body: "Colour, type, spacing and shape live in a single system every surface reads from — no more three slightly different blues.",
  },
  {
    badge: "Live",
    title: "Change once, everywhere",
    body: "Edit a token and watch every component that references it move in the same instant, across light and dark.",
  },
  {
    badge: "Export",
    title: "Ships where you work",
    body: "CSS, Tailwind, SwiftUI, Flutter, Figma and design tokens — generated from the same definitions you edited.",
  },
];

const PLANS = [
  { name: "Starter", seats: "Up to 3 editors", price: "£0", note: "Free forever", status: "Current", tone: "pg-badge--soft" },
  { name: "Studio", seats: "Up to 20 editors", price: "£18", note: "per editor / month", status: "Popular", tone: "pg-badge--success" },
  { name: "Enterprise", seats: "Unlimited editors", price: "Custom", note: "Annual, invoiced", status: "SSO", tone: "pg-badge--outline" },
];

const SWATCH_ROLES = [
  { property: "--pgc-primary", label: "Primary" },
  { property: "--pgc-secondary", label: "Secondary" },
  { property: "--pgc-surface", label: "Surface" },
  { property: "--pgc-ink", label: "Ink" },
  { property: "--pgc-muted", label: "Muted" },
];

/** A page section with a heading, so the mockup reads as a document rather
 *  than a stack of unrelated panels. */
function Section({
  eyebrow,
  title,
  children,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4, 20px)" }}>
      <div>
        <p className="pg-caption" style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {eyebrow}
        </p>
        <h2 className="pg-h2" style={{ marginTop: 6 }}>
          {title}
        </h2>
        {lead && (
          <p className="pg-body pg-body--muted pg-prose" style={{ marginTop: 8 }}>
            {lead}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export function ShowcaseContent({ systemName }: { systemName: string }) {
  // The page composes components directly rather than through GroupShell, so
  // it has to bring the stylesheet in itself.
  useSystemStyles();

  return (
    <div className="pg-scope">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6, 44px)", padding: "22px 26px 34px" }}>
        <Navbar />

        {/* ---------------------------------------------------------- Hero */}
        <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 16px)", maxWidth: "44rem" }}>
          <Breadcrumbs />
          <span className="pg-badge pg-badge--soft" style={{ alignSelf: "flex-start" }}>
            <Sparkles size={12} aria-hidden="true" />
            Now in early access
          </span>
          <h1 className="pg-display">Design that ships itself</h1>
          <p className="pg-body pg-prose">
            {systemName} keeps every colour, typeface and component in one place, so the interface your team builds is
            the interface you designed — down to the last hover state.
          </p>
          <div className="pg-row" style={{ marginTop: 4 }}>
            <button type="button" className="pg-btn pg-btn--primary pg-btn--lg">
              Start free trial
            </button>
            <button type="button" className="pg-btn pg-btn--outline pg-btn--lg">
              Book a walkthrough
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
          <div className="pg-row" style={{ marginTop: 8, gap: "var(--space-3, 14px)" }}>
            <div className="pg-avatar-group">
              {["RK", "TS", "AB", "AY"].map((initials) => (
                <span key={initials} className="pg-avatar" aria-hidden="true">
                  {initials}
                </span>
              ))}
              <span className="pg-avatar pg-avatar--accent" aria-hidden="true">
                +9
              </span>
            </div>
            <span className="pg-caption">Trusted by 13 product teams this month</span>
          </div>
        </header>

        {/* --------------------------------------------------------- Notice */}
        <div className="pg-alert pg-alert--info" role="status">
          <span className="pg-alert__icon" aria-hidden="true">
            <Check size={15} />
          </span>
          <div className="pg-alert__body">
            <span className="pg-alert__title">Dark variant derived automatically</span>
            <span className="pg-alert__text">
              Every role below has a dark counterpart. You can override any of them before you publish.
            </span>
          </div>
        </div>

        {/* ---------------------------------------------------------- Stats */}
        <div className="pg-grid">
          {STATS.map((stat) => (
            <div key={stat.label} className="pg-card" style={{ padding: "var(--space-4, 20px)" }}>
              <span className="pg-h2" style={{ fontSize: "var(--text-h2, 25px)" }}>
                {stat.value}
              </span>
              <span className="pg-caption" style={{ marginTop: 6 }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* -------------------------------------------------------- Feature */}
        <Section
          eyebrow="Why teams switch"
          title="Everything the interface is made of"
          lead="Three things a design system has to get right before anyone trusts it with production."
        >
          <div className="pg-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="pg-card pg-card--interactive" style={{ padding: "var(--space-4, 20px)" }}>
                <span className="pg-badge pg-badge--soft" style={{ alignSelf: "flex-start" }}>
                  {feature.badge}
                </span>
                <h3 className="pg-h3" style={{ marginTop: 12 }}>
                  {feature.title}
                </h3>
                <p className="pg-body" style={{ fontSize: "var(--text-sm, 14px)", marginTop: 8 }}>
                  {feature.body}
                </p>
                <button type="button" className="pg-btn pg-btn--ghost" style={{ alignSelf: "flex-start", marginTop: 14, paddingLeft: 0 }}>
                  Read the guide
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </Section>

        {/* ----------------------------------------------------------- Tabs */}
        <Section eyebrow="Inside the product" title="Built to be looked at closely">
          <Tabs />
        </Section>

        {/* -------------------------------------------------------- Pricing */}
        <Section eyebrow="Pricing" title="Plans that scale with the system">
          <div className="pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th scope="col">Plan</th>
                  <th scope="col">Editors</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="pg-table__num">
                    Price
                  </th>
                  <th scope="col" className="pg-table__num">
                    <span className="pg-sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLANS.map((plan) => (
                  <tr key={plan.name}>
                    <td style={{ fontWeight: 600 }}>{plan.name}</td>
                    <td>{plan.seats}</td>
                    <td>
                      <span className={`pg-badge ${plan.tone}`}>{plan.status}</span>
                    </td>
                    <td className="pg-table__num">
                      <span style={{ fontWeight: 600 }}>{plan.price}</span>
                      <span className="pg-caption" style={{ display: "block" }}>
                        {plan.note}
                      </span>
                    </td>
                    <td className="pg-table__num">
                      <button type="button" className="pg-btn pg-btn--secondary pg-btn--sm">
                        Choose
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ----------------------------------------------------------- Form */}
        <Section
          eyebrow="Get started"
          title="Request a walkthrough"
          lead="A real form, with real validation and real focus states — the fastest way to judge whether your palette works on the surfaces people actually type into."
        >
          <div className="pg-grid" style={{ gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)", alignItems: "start" }}>
            <form className="pg-card" style={{ padding: "var(--space-4, 20px)", gap: "var(--space-3, 16px)" }} onSubmit={(e) => e.preventDefault()}>
              <div className="pg-field">
                <label className="pg-label" htmlFor="sb-company">
                  Company
                </label>
                <input id="sb-company" className="pg-input" placeholder="Northwind Studio" defaultValue="Northwind Studio" />
                <span className="pg-hint">Shown on your workspace and in every export.</span>
              </div>

              <ValidatedEmailField />
              <SelectField />

              <div className="pg-field">
                <label className="pg-label" htmlFor="sb-brief">
                  What are you building?
                </label>
                <textarea
                  id="sb-brief"
                  className="pg-textarea"
                  placeholder="A booking platform for independent travel agents…"
                />
                <span className="pg-hint">The generator reads this to propose a palette and a type pairing.</span>
              </div>

              <div className="pg-row" style={{ justifyContent: "space-between", marginTop: 4 }}>
                <Tooltip tip="Measured against WCAG 2.2 AA">
                  <button type="button" className="pg-btn pg-btn--ghost pg-btn--sm">
                    Accessibility promise
                  </button>
                </Tooltip>
                <SaveButton />
              </div>
            </form>

            <aside style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 16px)" }}>
              <div className="pg-card" style={{ padding: "var(--space-4, 20px)" }}>
                <h3 className="pg-h3" style={{ fontSize: "var(--text-base, 16px)", marginBottom: 12 }}>
                  What to send me
                </h3>
                <CheckboxSet />
              </div>
              <div className="pg-card" style={{ padding: "var(--space-4, 20px)" }}>
                <RadioSet />
              </div>
              <div className="pg-card" style={{ padding: "var(--space-4, 20px)", gap: 14 }}>
                <Switch label="Auto-derive dark mode" desc="Recompute the dark palette whenever light changes." defaultOn />
                <Switch label="Share with workspace" desc="Anyone with the link can read this system." />
                <Switch label="Enterprise SSO" desc="Available on the Business plan." disabled />
              </div>
            </aside>
          </div>
        </Section>

        {/* --------------------------------------------------- Status + team */}
        <Section eyebrow="Rollout" title="Where the migration stands">
          <div className="pg-grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", alignItems: "start" }}>
            <div className="pg-card" style={{ padding: "var(--space-4, 20px)" }}>
              <ProgressDemo />
            </div>

            <article className="pg-card" style={{ padding: "var(--space-4, 20px)" }}>
              <div className="pg-row" style={{ gap: 12, alignItems: "center" }}>
                <span className="pg-avatar pg-avatar--lg" aria-hidden="true">
                  MO
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 className="pg-h3" style={{ fontSize: "var(--text-base, 16px)" }}>
                    Mariam Okonjo
                  </h3>
                  <p className="pg-caption">Principal designer · Lagos</p>
                </div>
                <FollowButton />
              </div>
              <p className="pg-body" style={{ fontSize: "var(--text-sm, 14px)", marginTop: 14 }}>
                &ldquo;We stopped arguing about hex codes in review. The system answers it, and the answer is the same
                one that ends up in the build.&rdquo;
              </p>
              <div className="pg-row" style={{ marginTop: 14, justifyContent: "space-between" }}>
                <span className="pg-caption">Online now · 24 shared systems</span>
                <LikeButton />
              </div>
            </article>
          </div>
        </Section>

        {/* --------------------------------------------------- Danger + modal */}
        <Section eyebrow="Workspace settings" title="Irreversible things live here">
          <div className="pg-card" style={{ padding: "var(--space-4, 20px)", gap: 12 }}>
            <p className="pg-body" style={{ fontSize: "var(--text-sm, 14px)" }}>
              Deleting a design system removes every token, export and linked project. This is the one action the
              system will ask you to confirm.
            </p>
            <div className="pg-row">
              <ModalDemo inline />
              <button type="button" className="pg-btn pg-btn--ghost" disabled>
                Archive instead
              </button>
            </div>
          </div>
        </Section>

        {/* --------------------------------------------------------- Footer */}
        <footer
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-4, 20px)",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "1px solid var(--pg-border)",
            paddingTop: "var(--space-4, 20px)",
          }}
        >
          <div>
            <p className="pg-caption" style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Brand colours
            </p>
            <div className="pg-row" style={{ marginTop: 10, gap: 8 }}>
              {SWATCH_ROLES.map((role) => (
                <span key={role.property} title={role.label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span
                    style={{
                      display: "block",
                      width: 46,
                      height: 30,
                      borderRadius: "calc(var(--pg-radius, 10px) * 0.6)",
                      background: `var(${role.property})`,
                      border: "1px solid var(--pg-border)",
                    }}
                  />
                  <span className="pg-caption" style={{ fontSize: 10 }}>
                    {role.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <p className="pg-caption">
            {systemName} · every element on this page is a live component reading your tokens
          </p>
        </footer>
      </div>
    </div>
  );
}
