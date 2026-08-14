/**
 * Inputs — real `<input>`/`<textarea>` elements, so the focus ring, the
 * caret, the placeholder colour and the disabled cursor are the browser's
 * own behaviour rather than an imitation of it.
 *
 * The error and success specimens are *earned*, not hard-coded: the email
 * field validates what you type and moves between neutral, invalid and
 * valid on its own. A reviewer can therefore break it and fix it live,
 * which is the difference between "here is what an error looks like" and
 * "here is the error state working".
 *
 * Wiring worth keeping if you edit this: `aria-invalid` is what the CSS
 * hooks the red border off (`.pg-input[aria-invalid="true"]`), and
 * `aria-describedby` is what makes the helper/error line get read out. They
 * are the same attribute doing double duty — dropping one silently breaks
 * the other's counterpart.
 */
"use client";

import { useId, useState } from "react";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";
import { GroupShell, Specimen } from "./primitives";

/** Deliberately loose: this validates for the demo, not for a signup form. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function ValidatedEmailField() {
  const id = useId();
  const [value, setValue] = useState("dana@");
  const status = value.length === 0 ? "empty" : EMAIL_RE.test(value) ? "valid" : "invalid";

  return (
    <div className="pg-field">
      <label className="pg-label" htmlFor={`${id}-email`}>
        Work email
      </label>
      <input
        id={`${id}-email`}
        type="email"
        className="pg-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="you@company.com"
        aria-invalid={status === "invalid"}
        aria-describedby={`${id}-email-hint`}
        data-state={status === "valid" ? "success" : undefined}
      />
      <p
        id={`${id}-email-hint`}
        className={
          status === "invalid" ? "pg-hint pg-hint--error" : status === "valid" ? "pg-hint pg-hint--success" : "pg-hint"
        }
        // Only the failure is assertive; announcing every keystroke of a
        // passing field would talk over the user as they type.
        role={status === "invalid" ? "alert" : undefined}
      >
        {status === "invalid" && (
          <span className="pg-hint__icon">
            <AlertCircle size={13} aria-hidden="true" />
          </span>
        )}
        {status === "valid" && (
          <span className="pg-hint__icon">
            <CheckCircle2 size={13} aria-hidden="true" />
          </span>
        )}
        {status === "invalid"
          ? "That doesn’t look like a complete email address."
          : status === "valid"
            ? "Looks good — we’ll send the invite here."
            : "We only use this for billing receipts."}
      </p>
    </div>
  );
}

function SearchField() {
  const id = useId();
  const [query, setQuery] = useState("");
  return (
    <div className="pg-field">
      <label className="pg-label" htmlFor={`${id}-search`}>
        Search the library
      </label>
      <div className="pg-input-wrap">
        <span className="pg-input-wrap__icon">
          <Search size={15} aria-hidden="true" />
        </span>
        <input
          id={`${id}-search`}
          type="search"
          className="pg-input"
          placeholder="Try “muted terracotta”"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <p className="pg-hint">{query ? `Searching for “${query}”` : "Colours, fonts and saved themes."}</p>
    </div>
  );
}

export function InputsGroup() {
  const id = useId();
  return (
    <GroupShell>
      <Specimen label="Default & filled">
        <div className="pg-grid">
          <div className="pg-field">
            <label className="pg-label" htmlFor={`${id}-name`}>
              Project name
            </label>
            <input id={`${id}-name`} className="pg-input" placeholder="Untitled project" />
            <p className="pg-hint">Shown on the dashboard and in exports.</p>
          </div>
          <div className="pg-field">
            <label className="pg-label" htmlFor={`${id}-filled`}>
              Subdomain
            </label>
            {/* defaultValue, not value — this specimen is meant to be edited,
                so it owns its own state rather than being locked by React. */}
            <input id={`${id}-filled`} className="pg-input" data-state="filled" defaultValue="northwind-studio" />
            <p className="pg-hint">northwind-studio.stylebook.app</p>
          </div>
        </div>
      </Specimen>

      <Specimen label="Validation">
        <div className="pg-grid">
          <ValidatedEmailField />
          <SearchField />
        </div>
      </Specimen>

      <Specimen label="Disabled & read-only">
        <div className="pg-grid">
          <div className="pg-field">
            <label className="pg-label" htmlFor={`${id}-plan`}>
              Plan
            </label>
            <input id={`${id}-plan`} className="pg-input" defaultValue="Team — 12 seats" disabled />
            <p className="pg-hint">Contact your workspace owner to change this.</p>
          </div>
          <div className="pg-field">
            <label className="pg-label" htmlFor={`${id}-key`}>
              API key
            </label>
            <input id={`${id}-key`} className="pg-input" defaultValue="sk_live_8f21…c904" readOnly />
            <p className="pg-hint">Read-only. Rotate it from Settings → Security.</p>
          </div>
        </div>
      </Specimen>

      <Specimen label="Multi-line">
        <div className="pg-field">
          <label className="pg-label" htmlFor={`${id}-brief`}>
            Brand brief
          </label>
          <textarea
            id={`${id}-brief`}
            className="pg-textarea"
            defaultValue="An independent coffee roaster in Lisbon. Warm, unfussy, a little editorial — closer to a good magazine than a café chain."
          />
          <p className="pg-hint">The generator reads this to pick a palette and a type pairing.</p>
        </div>
      </Specimen>
    </GroupShell>
  );
}
