// The error/success states are earned, not hard-coded — the email field
// validates what you type and moves between neutral/invalid/valid live.
// `aria-invalid` is what the CSS hooks the red border off
// (.pg-input[aria-invalid="true"]), and `aria-describedby` makes the
// helper/error line get read out — dropping either silently breaks the other.
"use client";

import { useId, useState } from "react";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";

// Deliberately loose: validates for the demo, not for a real signup form.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ValidatedEmailField() {
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
        // Only the failure is assertive — announcing every keystroke of a passing field would talk over the user.
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

export function SearchField() {
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
