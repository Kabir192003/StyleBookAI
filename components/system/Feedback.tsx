// Alerts/badges/toast read --pg-success/warning/error through the --pgc-*
// alias layer with a WCAG-safe literal at the end of the chain, so this still
// renders sensibly against a manual system that has no semantic roles at all.
"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Undo2, XCircle, X } from "lucide-react";

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
            // role="alert" only on the failure — assertive on all four would
            // have a screen reader interrupt itself three times on mount.
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

// Positioned absolute inside .pg-stage, not fixed — see the .pg-stage
// comment in styles.ts for why (fixed would float over Studio's own chrome).
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
