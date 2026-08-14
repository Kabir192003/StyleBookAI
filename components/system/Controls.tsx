/**
 * Controls — checkbox, radio, toggle, select, tooltip, avatar, progress,
 * skeleton and modal.
 *
 * Every form control here is a *native* element with `appearance: none`
 * rather than a div wearing a role. That is a deliberate trade: styling a
 * native checkbox is fiddlier (the tick has to be a `::before`, because an
 * `<input>` cannot have children — see styles.ts), but it comes with the
 * label association, the space-bar toggle, the focus ring, the `:checked`
 * state and the form value already working. A `role="checkbox"` div would
 * have to reimplement all five, and would get at least one of them wrong.
 *
 * The two exceptions are the toggle, which is a real `<button role="switch">`
 * because a checkbox cannot express on/off wording to a screen reader, and
 * the tooltip, which is CSS-only — `:hover, :focus-within` means it is
 * reachable by keyboard, which a JS `onMouseEnter` implementation would not
 * be without extra work.
 */
"use client";

import { cloneElement, useCallback, useEffect, useId, useRef, useState, type ReactElement } from "react";
import { ChevronDown, HelpCircle, Minus, Plus } from "lucide-react";
import { GroupShell, Specimen } from "./primitives";

function CheckboxSet() {
  const id = useId();
  const [checked, setChecked] = useState({ weekly: true, product: false, research: false });
  const allRef = useRef<HTMLInputElement | null>(null);
  const values = Object.values(checked);
  const all = values.every(Boolean);
  const some = values.some(Boolean) && !all;

  // `indeterminate` is a DOM property with no HTML attribute and no React
  // prop, so it can only be set imperatively. Without this the parent
  // checkbox would read as simply unchecked when only some children are on.
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = some;
  }, [some]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="pg-choice" htmlFor={`${id}-all`}>
        <input
          ref={allRef}
          id={`${id}-all`}
          type="checkbox"
          className="pg-checkbox"
          checked={all}
          onChange={(e) => {
            const v = e.target.checked;
            setChecked({ weekly: v, product: v, research: v });
          }}
        />
        <span className="pg-choice__text">
          <span style={{ fontWeight: 600 }}>All email from Northwind</span>
          <span className="pg-choice__desc">Toggle every list at once.</span>
        </span>
      </label>
      {(
        [
          ["weekly", "Weekly digest", "A summary of what changed in your systems."],
          ["product", "Product updates", "New generators, exports and integrations."],
          ["research", "Research invitations", "Occasional 30-minute sessions. Paid."],
        ] as const
      ).map(([key, title, desc]) => (
        <label key={key} className="pg-choice" htmlFor={`${id}-${key}`}>
          <input
            id={`${id}-${key}`}
            type="checkbox"
            className="pg-checkbox"
            checked={checked[key]}
            onChange={(e) => setChecked((c) => ({ ...c, [key]: e.target.checked }))}
          />
          <span className="pg-choice__text">
            <span>{title}</span>
            <span className="pg-choice__desc">{desc}</span>
          </span>
        </label>
      ))}
      <label className="pg-choice pg-choice--disabled" htmlFor={`${id}-legal`}>
        <input id={`${id}-legal`} type="checkbox" className="pg-checkbox" checked readOnly disabled />
        <span className="pg-choice__text">
          <span>Security and billing notices</span>
          <span className="pg-choice__desc">Required — cannot be turned off.</span>
        </span>
      </label>
    </div>
  );
}

function RadioSet() {
  const id = useId();
  const [plan, setPlan] = useState("team");
  return (
    // A radio group needs a group label; `role="radiogroup"` + aria-labelledby
    // is the equivalent of a <fieldset>/<legend> without the legend's layout
    // quirks inside a flex container.
    <div role="radiogroup" aria-labelledby={`${id}-legend`} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span id={`${id}-legend`} className="pg-label">
        Billing cadence
      </span>
      {(
        [
          ["monthly", "Monthly", "£18 per seat, cancel any time."],
          ["team", "Annual", "£15 per seat, billed once a year."],
          ["invoice", "Invoice", "Net-30, minimum 20 seats."],
        ] as const
      ).map(([value, title, desc]) => (
        <label key={value} className="pg-choice" htmlFor={`${id}-${value}`}>
          <input
            id={`${id}-${value}`}
            type="radio"
            className="pg-radio"
            name={`${id}-plan`}
            value={value}
            checked={plan === value}
            onChange={() => setPlan(value)}
          />
          <span className="pg-choice__text">
            <span>{title}</span>
            <span className="pg-choice__desc">{desc}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function Switch({ label, desc, defaultOn = false, disabled = false }: { label: string; desc: string; defaultOn?: boolean; disabled?: boolean }) {
  const id = useId();
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        type="button"
        role="switch"
        className="pg-switch"
        aria-checked={on}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        onClick={() => setOn((v) => !v)}
      />
      <span className="pg-choice__text">
        <span id={`${id}-label`}>{label}</span>
        <span id={`${id}-desc`} className="pg-choice__desc">
          {desc}
        </span>
      </span>
    </div>
  );
}

function SelectField() {
  const id = useId();
  const [value, setValue] = useState("perfect-fourth");
  return (
    <div className="pg-field" style={{ maxWidth: 300 }}>
      <label className="pg-label" htmlFor={`${id}-scale`}>
        Type scale ratio
      </label>
      <div className="pg-select-wrap">
        {/* A real <select>. The native popup is the one part of a dropdown a
            custom listbox never gets right on touch devices, and it is not
            worth reimplementing for a specimen. */}
        <select id={`${id}-scale`} className="pg-select" value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="minor-third">Minor third — 1.200</option>
          <option value="major-third">Major third — 1.250</option>
          <option value="perfect-fourth">Perfect fourth — 1.333</option>
          <option value="golden">Golden ratio — 1.618</option>
        </select>
        <span className="pg-select-wrap__chevron">
          <ChevronDown size={15} aria-hidden="true" />
        </span>
      </div>
      <p className="pg-hint">Drives every `--text-*` step in the export.</p>
    </div>
  );
}

function ProgressDemo() {
  const id = useId();
  const [value, setValue] = useState(45);
  const step = (delta: number) => setValue((v) => Math.min(100, Math.max(0, v + delta)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 340 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="pg-label" id={`${id}-label`}>
          Migrating components
        </span>
        <span className="pg-hint">{value}%</span>
      </div>
      {/* role="progressbar" with the aria-value* trio — the visual bar is a
          styled div, so without these it is invisible to assistive tech. */}
      <div
        className={value === 100 ? "pg-progress pg-progress--success" : "pg-progress"}
        role="progressbar"
        aria-labelledby={`${id}-label`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="pg-progress__bar" style={{ width: `${value}%` }} />
      </div>
      <div className="pg-row" style={{ gap: 6 }}>
        <button type="button" className="pg-btn pg-btn--outline pg-btn--icon pg-btn--sm" aria-label="Decrease progress" onClick={() => step(-15)}>
          <Minus size={13} aria-hidden="true" />
        </button>
        <button type="button" className="pg-btn pg-btn--outline pg-btn--icon pg-btn--sm" aria-label="Increase progress" onClick={() => step(15)}>
          <Plus size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * Tooltip. The show/hide is pure CSS (`:hover, :focus-within` in styles.ts)
 * so it works for keyboard users without a single event handler; all this
 * wrapper does is generate a unique id and hang `aria-describedby` off the
 * trigger, which is the part CSS cannot do. The id has to be per-instance
 * because the canvas renders this group once per experiment and duplicate
 * ids would point every trigger at the first card's bubble.
 */
function Tooltip({ tip, children }: { tip: string; children: ReactElement }) {
  const id = useId();
  return (
    <span className="pg-tooltip">
      {cloneElement(children, { "aria-describedby": id })}
      <span className="pg-tooltip__bubble" role="tooltip" id={id}>
        {tip}
      </span>
    </span>
  );
}

/**
 * Modal with genuine open/close, Escape-to-close, focus moved in on open and
 * returned to the trigger on close. Rendered `absolute` inside `.pg-stage`
 * (not `fixed`, not a portal) so it stays inside its own experiment card —
 * a portalled modal would also leave the `[data-pg-exp]` scope and lose
 * every token it is supposed to be demonstrating.
 */
function ModalDemo() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  // Escape and the close buttons share one exit path (`close`), because the
  // focus restore below has to happen on *every* dismissal — an Escape that
  // skipped it would leave a keyboard user's focus on a node that no longer
  // exists, which drops them back at the top of the document.
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <div
      className="pg-stage"
      style={{
        minHeight: 210,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px dashed var(--pgc-border)",
      }}
    >
      <button ref={triggerRef} type="button" className="pg-btn pg-btn--danger" onClick={() => setOpen(true)}>
        Delete design system
      </button>
      {open && (
        <div className="pg-modal-backdrop" onClick={close}>
          <div
            ref={dialogRef}
            className="pg-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            // The backdrop closes on click; without this the same click would
            // bubble up from inside the dialog and close it immediately.
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="pg-modal__title" id={titleId}>
              Delete “Northwind v3”?
            </h3>
            <p className="pg-modal__text">
              This removes the system from all 3 workspaces that reference it. Exports already downloaded are not
              affected.
            </p>
            <div className="pg-modal__actions">
              <button type="button" className="pg-btn pg-btn--ghost" onClick={close}>
                Keep it
              </button>
              <button type="button" className="pg-btn pg-btn--danger" onClick={close}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ControlsGroup() {
  return (
    <GroupShell>
      <Specimen label="Checkbox">
        <CheckboxSet />
      </Specimen>

      <Specimen label="Radio">
        <RadioSet />
      </Specimen>

      <Specimen label="Toggle">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Switch label="Auto-derive dark mode" desc="Recompute the dark palette whenever light changes." defaultOn />
          <Switch label="Share with workspace" desc="Anyone with the link can read this system." />
          <Switch label="Enterprise SSO" desc="Available on the Business plan." disabled />
        </div>
      </Specimen>

      <Specimen label="Dropdown">
        <SelectField />
      </Specimen>

      <Specimen label="Tooltip — hover or Tab to the button">
        <div className="pg-row">
          <Tooltip tip="Measured against WCAG 2.2 AA">
            <button type="button" className="pg-btn pg-btn--outline pg-btn--icon" aria-label="About contrast scoring">
              <HelpCircle size={16} aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip tip="Overwrites the canonical tokens">
            <button type="button" className="pg-btn pg-btn--secondary">
              Apply to design system
            </button>
          </Tooltip>
        </div>
      </Specimen>

      <Specimen label="Avatar">
        <div className="pg-row" style={{ gap: 16 }}>
          <span className="pg-avatar-wrap">
            <span className="pg-avatar pg-avatar--lg pg-avatar--accent" aria-hidden="true">
              RK
            </span>
            <span className="pg-avatar__status" aria-hidden="true" />
          </span>
          <span className="pg-avatar" aria-hidden="true">
            TS
          </span>
          <span className="pg-avatar pg-avatar--sm" aria-hidden="true">
            AB
          </span>
          <span className="pg-avatar-group" role="img" aria-label="Ruth, Tomas, Aya and 4 others">
            <span className="pg-avatar pg-avatar--sm" aria-hidden="true">
              RK
            </span>
            <span className="pg-avatar pg-avatar--sm" aria-hidden="true">
              TS
            </span>
            <span className="pg-avatar pg-avatar--sm" aria-hidden="true">
              AY
            </span>
            <span className="pg-avatar pg-avatar--sm pg-avatar--accent" aria-hidden="true">
              +4
            </span>
          </span>
        </div>
      </Specimen>

      <Specimen label="Progress">
        <ProgressDemo />
      </Specimen>

      <Specimen label="Skeleton">
        {/* aria-hidden + aria-busy: a loading placeholder announced as content
            would read out as a run of empty boxes. */}
        <div
          className="pg-card"
          style={{ maxWidth: 340, padding: "var(--space-4, 18px)", gap: 12 }}
          aria-hidden="true"
          aria-busy="true"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="pg-skeleton pg-skeleton--circle" style={{ width: 40, height: 40, flex: "none" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
              <div className="pg-skeleton" style={{ height: 10, width: "58%" }} />
              <div className="pg-skeleton" style={{ height: 9, width: "34%" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
            <div className="pg-skeleton" style={{ height: 9, width: "100%" }} />
            <div className="pg-skeleton" style={{ height: 9, width: "92%" }} />
            <div className="pg-skeleton" style={{ height: 9, width: "64%" }} />
          </div>
        </div>
      </Specimen>

      <Specimen label="Modal — opens, closes, Escape works">
        <ModalDemo />
      </Specimen>
    </GroupShell>
  );
}
