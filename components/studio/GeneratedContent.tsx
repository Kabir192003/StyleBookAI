// The model chooses what interface the product needs (sections, order,
// content) and nothing about how it looks — everything here paints itself
// from the same .pg-* classes and canvas token scope as the default showcase,
// so a generated page can never invent a color/typeface/radius, editing a
// token moves it exactly like the showcase, and click-to-edit works with no
// extra wiring. Unknown section types render nothing rather than throwing,
// since the vocabulary can grow ahead of this file (older deployment reading
// a newer saved result) and a page quietly missing one band beats a stack trace.
"use client";

import { ArrowRight, Play, Search } from "lucide-react";
import type { AISection, AIUiStructure } from "@/lib/ai/schema";
import { useSystemStyles } from "@/components/system/primitives";

function SectionHeading({ title, lead }: { title?: string; lead?: string }) {
  if (!title && !lead) return null;
  return (
    <div>
      {title && <h2 className="pg-h2">{title}</h2>}
      {lead && (
        <p className="pg-body pg-body--muted pg-prose" style={{ marginTop: 8 }}>
          {lead}
        </p>
      )}
    </div>
  );
}

function Hero({ section }: { section: Extract<AISection, { type: "hero" }> }) {
  return (
    <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 14px)", maxWidth: "44rem" }}>
      {section.eyebrow && (
        <span className="pg-badge pg-badge--soft" style={{ alignSelf: "flex-start" }}>
          {section.eyebrow}
        </span>
      )}
      <h1 className="pg-display">{section.headline}</h1>
      <p className="pg-body pg-prose">{section.subheadline}</p>
      <div className="pg-row" style={{ marginTop: 4 }}>
        <button type="button" className="pg-btn pg-btn--primary pg-btn--lg">
          {section.primaryCta}
        </button>
        {section.secondaryCta && (
          <button type="button" className="pg-btn pg-btn--outline pg-btn--lg">
            {section.secondaryCta}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}

function SearchBar({ section }: { section: Extract<AISection, { type: "searchBar" }> }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 14px)" }}>
      <SectionHeading title={section.title} />
      <div className="pg-card" style={{ padding: "var(--space-4, 18px)", gap: 12 }}>
        <div className="pg-row" style={{ flexWrap: "nowrap", gap: 10 }}>
          <div className="pg-input-wrap" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", position: "relative" }}>
            <Search
              size={15}
              aria-hidden="true"
              style={{ position: "absolute", left: 12, color: "var(--pg-muted)", pointerEvents: "none" }}
            />
            <input className="pg-input" style={{ paddingLeft: 34 }} placeholder={section.placeholder} aria-label={section.placeholder} />
          </div>
          <button type="button" className="pg-btn pg-btn--primary">
            {section.submitLabel}
          </button>
        </div>
        {section.filters && section.filters.length > 0 && (
          <div className="pg-row" style={{ gap: 8 }}>
            {section.filters.map((filter) => (
              <button key={filter} type="button" className="pg-btn pg-btn--outline pg-btn--sm">
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatRow({ section }: { section: Extract<AISection, { type: "statRow" }> }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 14px)" }}>
      <SectionHeading title={section.title} />
      <div className="pg-grid">
        {section.items.map((item) => (
          <div key={item.label} className="pg-card" style={{ padding: "var(--space-4, 20px)" }}>
            <span className="pg-h2">{item.value}</span>
            <span className="pg-caption" style={{ marginTop: 6 }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ItemGrid({ section }: { section: Extract<AISection, { type: "itemGrid" }> }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 14px)" }}>
      <SectionHeading title={section.title} lead={section.lead} />
      <div className="pg-grid">
        {section.items.map((item) => (
          <article key={item.title} className="pg-card" style={{ padding: "var(--space-4, 18px)" }}>
            {item.badge && (
              <span className="pg-badge pg-badge--soft" style={{ alignSelf: "flex-start", marginBottom: 10 }}>
                {item.badge}
              </span>
            )}
            <h3 className="pg-h3" style={{ fontSize: "var(--text-base, 16px)" }}>
              {item.title}
            </h3>
            {item.subtitle && (
              <p className="pg-body" style={{ fontSize: "var(--text-sm, 14px)", marginTop: 6 }}>
                {item.subtitle}
              </p>
            )}
            <div className="pg-row" style={{ justifyContent: "space-between", marginTop: 14 }}>
              {item.meta && <span style={{ fontWeight: 600 }}>{item.meta}</span>}
              {item.cta && (
                <button type="button" className="pg-btn pg-btn--secondary pg-btn--sm">
                  {item.cta}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecordTable({ section }: { section: Extract<AISection, { type: "recordTable" }> }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 14px)" }}>
      <SectionHeading title={section.title} />
      <div className="pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              {section.columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
              {section.rowAction && (
                <th scope="col" className="pg-table__num">
                  <span className="pg-sr-only">Action</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* Clipped to the header width — a longer row would render cells with no heading, invalid for a screen reader. */}
                {row.slice(0, section.columns.length).map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
                {section.rowAction && (
                  <td className="pg-table__num">
                    <button type="button" className="pg-btn pg-btn--secondary pg-btn--sm">
                      {section.rowAction}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DetailPanel({ section }: { section: Extract<AISection, { type: "detailPanel" }> }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 14px)" }}>
      <div className="pg-card" style={{ padding: "var(--space-4, 20px)" }}>
        <h3 className="pg-h3">{section.title}</h3>
        {section.subtitle && (
          <p className="pg-body pg-body--muted" style={{ fontSize: "var(--text-sm, 14px)", marginTop: 4 }}>
            {section.subtitle}
          </p>
        )}
        <dl className="pg-deflist" style={{ marginTop: 14 }}>
          {section.fields.map((field) => (
            <div key={field.key} className="pg-deflist__row">
              <dt className="pg-deflist__key">{field.key}</dt>
              <dd className="pg-deflist__val">{field.value}</dd>
            </div>
          ))}
        </dl>
        {section.primaryCta && (
          <button type="button" className="pg-btn pg-btn--primary" style={{ alignSelf: "flex-start", marginTop: 16 }}>
            {section.primaryCta}
          </button>
        )}
      </div>
    </section>
  );
}

function FormPanel({ section }: { section: Extract<AISection, { type: "formPanel" }> }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 14px)" }}>
      <SectionHeading title={section.title} lead={section.lead} />
      <form className="pg-card" style={{ padding: "var(--space-4, 20px)", gap: "var(--space-3, 14px)" }} onSubmit={(e) => e.preventDefault()}>
        {section.fields.map((field, index) => {
          const id = `sb-gen-${index}`;
          if (field.kind === "checkbox" || field.kind === "toggle") {
            return (
              <label key={id} className="pg-choice" htmlFor={id}>
                <input id={id} type="checkbox" className={field.kind === "toggle" ? "pg-switch" : "pg-checkbox"} />
                <span className="pg-label" style={{ textTransform: "none", letterSpacing: 0 }}>
                  {field.label}
                </span>
              </label>
            );
          }
          if (field.kind === "radio") {
            return (
              <fieldset key={id} style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="pg-label">{field.label}</legend>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  {(field.options ?? ["Yes", "No"]).map((option) => (
                    <label key={option} className="pg-choice">
                      <input type="radio" name={id} className="pg-radio" />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          }
          return (
            <div key={id} className="pg-field">
              <label className="pg-label" htmlFor={id}>
                {field.label}
              </label>
              {field.kind === "textarea" ? (
                <textarea id={id} className="pg-textarea" placeholder={field.placeholder} />
              ) : field.kind === "select" ? (
                <div className="pg-select-wrap">
                  <select id={id} className="pg-select">
                    {(field.options ?? []).map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  id={id}
                  className="pg-input"
                  type={field.kind === "email" ? "email" : "text"}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          );
        })}
        <button type="submit" className="pg-btn pg-btn--primary" style={{ alignSelf: "flex-start" }}>
          {section.submitLabel}
        </button>
      </form>
    </section>
  );
}

function Schedule({ section }: { section: Extract<AISection, { type: "schedule" }> }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 14px)" }}>
      <SectionHeading title={section.title} />
      <div className="pg-card" style={{ padding: "var(--space-4, 18px)", gap: 0 }}>
        {section.slots.map((slot, index) => (
          <div
            key={`${slot.time}-${slot.title}`}
            className="pg-row"
            style={{
              justifyContent: "space-between",
              flexWrap: "nowrap",
              gap: 14,
              padding: "12px 0",
              borderTop: index === 0 ? "none" : "1px solid var(--pg-border)",
            }}
          >
            <span className="pg-caption" style={{ minWidth: 76, fontVariantNumeric: "tabular-nums" }}>
              {slot.time}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontWeight: 500 }}>{slot.title}</span>
            {slot.meta && <span className="pg-caption">{slot.meta}</span>}
            {slot.status && <span className="pg-badge pg-badge--soft">{slot.status}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function MediaBar({ section }: { section: Extract<AISection, { type: "mediaBar" }> }) {
  return (
    <div className="pg-card" style={{ padding: "var(--space-3, 14px) var(--space-4, 18px)" }}>
      <div className="pg-row" style={{ flexWrap: "nowrap", gap: 14, alignItems: "center" }}>
        <button type="button" className="pg-btn pg-btn--primary pg-btn--icon" aria-label={section.primaryAction ?? "Play"}>
          <Play size={15} aria-hidden="true" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, margin: 0 }}>{section.title}</p>
          {section.subtitle && <p className="pg-caption">{section.subtitle}</p>}
        </div>
        {section.meta && <span className="pg-caption">{section.meta}</span>}
      </div>
      <div className="pg-progress" style={{ marginTop: 12 }}>
        <div className="pg-progress__bar" style={{ width: "38%" }} />
      </div>
    </div>
  );
}

function ProgressList({ section }: { section: Extract<AISection, { type: "progressList" }> }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 14px)" }}>
      <SectionHeading title={section.title} />
      <div className="pg-card" style={{ padding: "var(--space-4, 20px)", gap: 16 }}>
        {section.items.map((item) => (
          <div key={item.label}>
            <div className="pg-row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
              <span style={{ fontSize: "var(--text-sm, 14px)", fontWeight: 500 }}>{item.label}</span>
              <span className="pg-caption">{item.caption ?? `${item.percent}%`}</span>
            </div>
            <div
              className="pg-progress"
              style={{ marginTop: 8 }}
              role="progressbar"
              aria-valuenow={item.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={item.label}
            >
              <div className="pg-progress__bar" style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Feed({ section }: { section: Extract<AISection, { type: "feed" }> }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 14px)" }}>
      <SectionHeading title={section.title} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {section.items.map((item) => (
          <div key={item.title} className={`pg-alert pg-alert--${item.tone ?? "info"}`} role="status">
            <div className="pg-alert__body">
              <span className="pg-alert__title">{item.title}</span>
              {item.body && <span className="pg-alert__text">{item.body}</span>}
              {item.meta && <span className="pg-caption">{item.meta}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer({ section }: { section: Extract<AISection, { type: "footer" }> }) {
  return (
    <footer
      className="pg-row"
      style={{
        justifyContent: "space-between",
        borderTop: "1px solid var(--pg-border)",
        paddingTop: "var(--space-4, 18px)",
      }}
    >
      {section.note && <span className="pg-caption">{section.note}</span>}
      {section.links && section.links.length > 0 && (
        <div className="pg-row" style={{ gap: 14 }}>
          {section.links.map((link) => (
            <button key={link} type="button" className="pg-btn pg-btn--ghost pg-btn--sm">
              {link}
            </button>
          ))}
        </div>
      )}
    </footer>
  );
}

function Section({ section }: { section: AISection }) {
  switch (section.type) {
    case "hero":
      return <Hero section={section} />;
    case "searchBar":
      return <SearchBar section={section} />;
    case "statRow":
      return <StatRow section={section} />;
    case "itemGrid":
      return <ItemGrid section={section} />;
    case "recordTable":
      return <RecordTable section={section} />;
    case "detailPanel":
      return <DetailPanel section={section} />;
    case "formPanel":
      return <FormPanel section={section} />;
    case "schedule":
      return <Schedule section={section} />;
    case "mediaBar":
      return <MediaBar section={section} />;
    case "progressList":
      return <ProgressList section={section} />;
    case "feed":
      return <Feed section={section} />;
    case "footer":
      return <Footer section={section} />;
    default:
      return null;
  }
}

export function GeneratedContent({ structure }: { structure: AIUiStructure }) {
  useSystemStyles();

  return (
    <div className="pg-scope">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6, 40px)", padding: "22px 26px 34px" }}>
        {/* Chrome is ours, not the model's — it only supplies the name and nav labels, so a page can't come back with no navigation. */}
        <nav className="pg-navbar">
          <span className="pg-navbar__brand">{structure.appName}</span>
          <div className="pg-row" style={{ gap: 4 }}>
            {structure.navItems.map((item, index) => (
              <button key={item} type="button" className="pg-navlink" aria-current={index === 0 ? "page" : undefined}>
                {item}
              </button>
            ))}
          </div>
        </nav>

        {structure.tagline && <p className="pg-caption">{structure.tagline}</p>}

        {structure.sections.map((section, index) => (
          <Section key={`${section.type}-${index}`} section={section} />
        ))}
      </div>
    </div>
  );
}
