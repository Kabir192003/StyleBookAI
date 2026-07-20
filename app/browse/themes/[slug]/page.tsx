/**
 * /browse/themes/[slug] — Theme Detail
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 — full mockup view: palette + fonts +
 * type scale together, plus a live component preview styled with the
 * theme's actual values.
 *
 * Ported from Dhanshri's Lovable design ("Design Browse Hub") into real
 * data and this repo's conventions — see docs/CONTEXT.md.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ShieldCheck, Sparkles } from "lucide-react";
import { allThemes } from "@/data/themes";
import { Card } from "@/components/browse/Card";
import { ThemeCard } from "@/components/themes/ThemeCard";
import { getContrastRatio, getWcagLevel } from "@/lib/colors/colorUtils";

export default function ThemeDetailPage({ params }: { params: { slug: string } }) {
  const theme = allThemes.find((t) => t.slug === params.slug);
  if (!theme) notFound();

  const p = theme.colorRoles;
  const heading = theme.primaryFont;
  const body = theme.secondaryFont;
  const contrastRatio = getContrastRatio(p.text, p.background);
  const wcag = getWcagLevel(contrastRatio);
  const related = allThemes.filter((t) => t.slug !== theme.slug && t.category === theme.category).slice(0, 3);

  return (
    <div className="space-y-12">
      <Link href="/browse/themes" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-3.5 w-3.5" /> All themes
      </Link>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="space-y-5">
          <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium capitalize text-neutral-600">
            {theme.category}
          </span>
          <h1
            className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl"
            style={{ fontFamily: `'${heading.family}'` }}
          >
            {theme.name}
          </h1>
          <p className="max-w-lg text-base text-neutral-500">{theme.description}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
              <Sparkles className="h-4 w-4" /> Use in Studio
            </span>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              WCAG {wcag} · {contrastRatio.toFixed(1)}:1 contrast
            </div>
          </div>
        </div>
        <ThemePreviewLarge theme={theme} />
      </section>

      <Section title="Color palette" description="Semantic tokens that power the theme.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {(
            [
              ["Primary", p.primary],
              ["Secondary", p.secondary],
              ["Accent", p.accent],
              ["Background", p.background],
              ["Surface", p.surface],
              ["Text", p.text],
              ["Text muted", p.textMuted],
            ] as const
          ).map(([label, value]) => (
            <PaletteSwatch key={label} label={label} value={value} />
          ))}
        </div>
      </Section>

      <Section title="Typography" description="Heading and body pairing with this theme's type scale.">
        <Card className="p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Heading</p>
              <p className="mt-1 text-sm text-neutral-500">{heading.family}</p>
              <div className="mt-4 space-y-3">
                <div
                  style={{ fontFamily: `'${heading.family}'`, fontWeight: 700, fontSize: theme.typeScale.sizes["4xl"] }}
                  className="leading-tight text-neutral-900"
                >
                  Design with intent.
                </div>
                <div style={{ fontFamily: `'${heading.family}'`, fontWeight: 600, fontSize: theme.typeScale.sizes["2xl"] }} className="text-neutral-900">
                  Section heading
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Body</p>
              <p className="mt-1 text-sm text-neutral-500">{body.family}</p>
              <p
                style={{ fontFamily: `'${body.family}'`, fontSize: theme.typeScale.sizes.base }}
                className="mt-4 leading-relaxed text-neutral-900"
              >
                Great typography sets the pace of a product — this pairing balances a distinctive heading voice
                with a highly readable body face.
              </p>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-neutral-500">
                {(["xs", "sm", "base", "lg"] as const).map((key) => (
                  <div key={key} className="rounded-md border border-neutral-200 py-2">
                    <div style={{ fontFamily: `'${body.family}'`, fontSize: theme.typeScale.sizes[key] }} className="text-neutral-900">
                      Aa
                    </div>
                    <div className="mt-1">{Math.round(theme.typeScale.sizes[key])}px</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Components preview" description="How the theme feels applied to real UI.">
        <ComponentsPreview theme={theme} />
      </Section>

      <Section title="Accessibility" description="Real, computed contrast for this theme's text-on-background pairing.">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Contrast" value={`${contrastRatio.toFixed(1)}:1`} hint="Text on background" />
          <StatCard label="Standard" value={`WCAG ${wcag}`} hint={wcag === "AAA" ? "Enhanced" : wcag === "AA" ? "Minimum" : "Below minimum"} />
          <StatCard label="Colors" value={String(theme.colors.length)} hint="In this theme's palette" />
        </div>
      </Section>

      {related.length > 0 && (
        <Section title="Related themes" description={`Other ${theme.category} themes.`}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <ThemeCard key={t.id} theme={t} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function PaletteSwatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white text-left">
      <div className="h-20 w-full" style={{ backgroundColor: value }} />
      <div className="p-3">
        <div className="text-xs font-medium text-neutral-900">{label}</div>
        <div className="mt-0.5 font-mono text-[11px] uppercase text-neutral-500">{value}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </Card>
  );
}

function ThemePreviewLarge({ theme }: { theme: (typeof allThemes)[number] }) {
  const p = theme.colorRoles;
  const heading = theme.primaryFont;
  const body = theme.secondaryFont;
  return (
    <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5" style={{ backgroundColor: p.background }}>
      <div className="p-6" style={{ color: p.text }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md" style={{ backgroundColor: p.primary }} />
            <span className="text-sm font-semibold" style={{ fontFamily: `'${heading.family}'` }}>
              {theme.name}
            </span>
          </div>
          <div className="flex gap-1">
            {[p.primary, p.secondary, p.accent].map((c, i) => (
              <span key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="mt-5 rounded-xl p-5" style={{ backgroundColor: p.surface }}>
          <div className="text-lg font-semibold" style={{ fontFamily: `'${heading.family}'` }}>
            Ship your design system faster
          </div>
          <p className="mt-1 text-sm" style={{ fontFamily: `'${body.family}'`, color: p.textMuted }}>
            Preview real components with the {theme.name} theme applied end to end.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: p.primary, color: p.surface }}>
              Get started
            </span>
            <span
              className="rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: "transparent", color: p.text, border: `1px solid ${p.textMuted}` }}
            >
              Learn more
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentsPreview({ theme }: { theme: (typeof allThemes)[number] }) {
  const p = theme.colorRoles;
  const heading = theme.primaryFont;
  const body = theme.secondaryFont;
  return (
    <div
      className="rounded-2xl p-6 sm:p-8"
      style={{ backgroundColor: p.background, color: p.text, fontFamily: `'${body.family}'`, border: `1px solid ${p.textMuted}33` }}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <PreviewLabel>Buttons</PreviewLabel>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg px-4 py-2 text-sm font-medium shadow-sm" style={{ backgroundColor: p.primary, color: p.surface }}>
              Primary
            </button>
            <button className="rounded-lg px-4 py-2 text-sm font-medium" style={{ backgroundColor: p.surface, color: p.text, border: `1px solid ${p.textMuted}33` }}>
              Secondary
            </button>
            <button className="rounded-lg px-4 py-2 text-sm font-medium" style={{ backgroundColor: p.accent, color: p.surface }}>
              Accent
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <PreviewLabel>Card</PreviewLabel>
          <div className="rounded-xl p-4" style={{ backgroundColor: p.surface, border: `1px solid ${p.textMuted}33` }}>
            <div className="text-sm font-semibold" style={{ fontFamily: `'${heading.family}'` }}>
              Weekly digest
            </div>
            <p className="mt-1 text-xs" style={{ color: p.textMuted }}>
              12 new items across your subscriptions.
            </p>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <PreviewLabel>Alert</PreviewLabel>
          <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: p.surface, border: `1px solid ${p.textMuted}33` }}>
            <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full" style={{ backgroundColor: p.accent, color: p.surface }}>
              <Check className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-sm font-medium">Saved successfully</div>
              <div className="text-xs" style={{ color: p.textMuted }}>
                Your changes have been applied.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-widest opacity-70">{children}</p>;
}
