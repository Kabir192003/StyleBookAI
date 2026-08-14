/**
 * Feedback — alerts, badges, toast.
 *
 * This is the group that consumes P1's semantic role properties
 * (`--pg-success` / `--pg-warning` / `--pg-error`), because success, warning
 * and error are exactly the meanings the base five-token palette has no slot
 * for. Every one of them is read through the `--pgc-*` alias layer in
 * styles.ts with a WCAG-safe literal at the end of the chain, so this still
 * renders correctly against a manual system that has no semantic roles at
 * all — it just borrows sensible defaults instead of collapsing.
 *
 * The alerts are dismissible for real and the "restore" button brings them
 * back, so the interaction is repeatable during a demo rather than a
 * one-shot that leaves the specimen empty.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Undo2, XCircle, X } from "lucide-react";
import { GroupShell, Specimen } from "./primitives";

type Tone = "success" | "warning" | "error" | "info";

const TONE_ICON: Record<Tone, typeof Info> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const ALERTS: Array<{ tone: Tone; title: string; text: string }> = [
  {
    tone: "success",
    title: "System applied",
    text: "Northwind v3 is now the active design system. Every export reflects it.",
  },
  {
    tone: "info",
    title: "Dark variant derived automatically",
    text: "You can override any of the five roles before you commit the change.",
  },
  {
    tone: "warning",
    title: "Contrast is borderline",
    text: "Muted text on surface measures 4.3:1 — it passes AA for body copy but fails for small captions.",
  },
  {
    tone: "error",
    title: "Export failed",
    text: "The Tailwind config could not be written because two colour roles resolved to the same name.",
  },
];

function Alerts() {
  const [dismissed, setDismissed] = useState<Tone[]>([]);
  const visible = ALERTS.filter((a) => !dismissed.includes(a.tone));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2, 10px)" }}>
      {visible.map(({ tone, title, text }) => {
        const Icon = TONE_ICON[tone];
        return (
          <div
            key={tone}
            className={`pg-alert pg-alert--${tone}`}
            // role="alert" only on the failure: an assertive live region for
            // all four would have a screen reader interrupt itself three
            // times the moment this group mounts.
            role={tone === "error" ? "alert" : "status"}
          >
            <span className="pg-alert__icon" aria-hidden="true">
              <Icon size={16} />
            </span>
            <div className="pg-alert__body">
              <span className="pg-alert__title">{title}</span>
              <span className="pg-alert__text">{text}</span>
            </div>
            <button
              type="button"
              className="pg-alert__close"
              aria-label={`Dismiss: ${title}`}
              onClick={() => setDismissed((d) => [...d, tone])}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
      {dismissed.length > 0 && (
        <button type="button" className="pg-btn pg-btn--ghost pg-btn--sm" onClick={() => setDismissed([])}>
          <Undo2 size={13} aria-hidden="true" />
          Restore {dismissed.length} dismissed
        </button>
      )}
    </div>
  );
}

/**
 * A real toast: triggered by a real click, auto-dismisses on a real timer,
 * and is positioned `absolute` inside `.pg-stage` rather than `fixed`. The
 * fixed version would escape its experiment card and float over the whole
 * playground grid, which makes two experiments impossible to compare — see
 * the `.pg-stage` comment in styles.ts.
 */
export function ToastDemo() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function show() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
    timer.current = setTimeout(() => setOpen(false), 3200);
  }

  return (
    <div
      className="pg-stage"
      style={{
        minHeight: 132,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px dashed var(--pgc-border)",
      }}
    >
      <button type="button" className="pg-btn pg-btn--secondary" onClick={show}>
        Publish system
      </button>
      {open && (
        <div className="pg-toast" role="status">
          <span className="pg-toast__icon" aria-hidden="true">
            <CheckCircle2 size={16} />
          </span>
          <span>Published to 3 workspaces</span>
          <button type="button" className="pg-toast__close" aria-label="Dismiss notification" onClick={() => setOpen(false)}>
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export function FeedbackGroup() {
  return (
    <GroupShell>
      <Specimen label="Alerts — dismissible">
        <Alerts />
      </Specimen>

      <Specimen label="Badges">
        <div className="pg-row">
          <span className="pg-badge">Pro</span>
          <span className="pg-badge pg-badge--soft">Draft</span>
          <span className="pg-badge pg-badge--success">
            <span className="pg-badge__dot" aria-hidden="true" />
            Live
          </span>
          <span className="pg-badge pg-badge--warning">Review</span>
          <span className="pg-badge pg-badge--error">Failing</span>
          <span className="pg-badge pg-badge--outline">v3.1.0</span>
        </div>
      </Specimen>

      <Specimen label="Toast — click to trigger, auto-dismisses">
        <ToastDemo />
      </Specimen>
    </GroupShell>
  );
}
