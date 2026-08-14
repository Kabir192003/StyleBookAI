/**
 * Buttons — the group a reviewer reaches for first, so every state here is
 * the real thing rather than a static swatch labelled "hover":
 *
 *   :hover / :active / :focus-visible / :disabled  -> real CSS in styles.ts
 *   disabled                                        -> real `disabled` attr
 *   loading                                         -> real async state,
 *                                                      real CSS spinner
 *
 * That is P2's non-negotiable in docs/DESIGN_PLAYGROUND.md ("real …CSS, not
 * screenshots of states"). The consequence worth knowing: the *only* way to
 * see the hover colour is to hover, so the specimen list shows one button
 * per variant rather than a five-across state matrix. A state matrix would
 * have needed forced-state classes, which would then have to be maintained
 * in parallel with the real pseudo-classes and would inevitably drift.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Download, Heart, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { GroupShell, Specimen } from "./primitives";

/**
 * A genuinely asynchronous button: click -> disabled + spinner -> confirmed
 * state -> back to idle. This is the group's proof that the components are
 * live React and not markup — a reviewer clicks it and watches three
 * distinct renders.
 */
function SaveButton() {
  const [phase, setPhase] = useState<"idle" | "saving" | "saved">("idle");
  // Timers are torn down on unmount because the playground canvas mounts and
  // unmounts these freely as experiments are added, reordered and deleted;
  // a pending setState on an unmounted tree is a warning at best.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function run() {
    if (phase !== "idle") return;
    setPhase("saving");
    timers.current.push(setTimeout(() => setPhase("saved"), 1100));
    timers.current.push(setTimeout(() => setPhase("idle"), 2600));
  }

  return (
    <button
      type="button"
      className="pg-btn pg-btn--primary"
      onClick={run}
      data-loading={phase === "saving" ? "true" : undefined}
      // The button removes itself from the tab order while working, and the
      // live label change is announced because the accessible name is the
      // text content, which actually changes.
      disabled={phase === "saving"}
      aria-live="polite"
    >
      {phase === "saving" && <span className="pg-spinner" aria-hidden="true" />}
      {phase === "saved" && <Check size={15} aria-hidden="true" />}
      {phase === "idle" ? "Save changes" : phase === "saving" ? "Saving…" : "Saved"}
    </button>
  );
}

/** A real toggle button — `aria-pressed` flips, so it is not a fake state. */
function LikeButton() {
  const [liked, setLiked] = useState(false);
  return (
    <button
      type="button"
      className={liked ? "pg-btn pg-btn--secondary" : "pg-btn pg-btn--outline"}
      aria-pressed={liked}
      onClick={() => setLiked((v) => !v)}
    >
      <Heart size={15} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
      {liked ? "Saved to list" : "Save to list"}
      <span className="pg-sr-only">{liked ? " (currently saved)" : ""}</span>
    </button>
  );
}

export function ButtonsGroup() {
  return (
    <GroupShell>
      <Specimen label="Primary · Secondary · Outline">
        <div className="pg-row">
          <button type="button" className="pg-btn pg-btn--primary">
            Start free trial
          </button>
          <button type="button" className="pg-btn pg-btn--secondary">
            View pricing
          </button>
          <button type="button" className="pg-btn pg-btn--outline">
            <Download size={15} aria-hidden="true" />
            Export CSS
          </button>
        </div>
      </Specimen>

      <Specimen label="Ghost · Destructive · Link-style">
        <div className="pg-row">
          <button type="button" className="pg-btn pg-btn--ghost">
            Cancel
          </button>
          <button type="button" className="pg-btn pg-btn--danger">
            <Trash2 size={15} aria-hidden="true" />
            Delete project
          </button>
          <button type="button" className="pg-btn pg-btn--ghost">
            Read the docs
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </Specimen>

      <Specimen label="Icon only">
        <div className="pg-row">
          {/* Icon-only buttons carry aria-label — the icon is aria-hidden, so
              without one the accessible name would be the empty string. */}
          <button type="button" className="pg-btn pg-btn--primary pg-btn--icon" aria-label="Add item">
            <Plus size={16} aria-hidden="true" />
          </button>
          <button type="button" className="pg-btn pg-btn--outline pg-btn--icon" aria-label="More options">
            <MoreHorizontal size={16} aria-hidden="true" />
          </button>
          <button type="button" className="pg-btn pg-btn--ghost pg-btn--icon" aria-label="Download">
            <Download size={16} aria-hidden="true" />
          </button>
          <button type="button" className="pg-btn pg-btn--danger pg-btn--icon pg-btn--sm" aria-label="Remove">
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      </Specimen>

      <Specimen label="Async & toggle">
        <div className="pg-row">
          <SaveButton />
          <LikeButton />
        </div>
      </Specimen>

      <Specimen label="Disabled">
        <div className="pg-row">
          <button type="button" className="pg-btn pg-btn--primary" disabled>
            Publish
          </button>
          <button type="button" className="pg-btn pg-btn--outline" disabled>
            Duplicate
          </button>
          <button type="button" className="pg-btn pg-btn--danger" disabled>
            Delete
          </button>
        </div>
      </Specimen>

      <Specimen label="Sizes">
        <div className="pg-row">
          <button type="button" className="pg-btn pg-btn--primary pg-btn--sm">
            Small
          </button>
          <button type="button" className="pg-btn pg-btn--primary">
            Medium
          </button>
          <button type="button" className="pg-btn pg-btn--primary pg-btn--lg">
            Large
          </button>
        </div>
      </Specimen>
    </GroupShell>
  );
}
