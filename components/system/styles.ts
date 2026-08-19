// The single stylesheet behind every StyleBook component.
//
// Real stylesheet, not inline styles: components need real
// :hover/:focus-visible/:active/:disabled states, which inline style can't
// express, and an inline style would beat any stylesheet hover rule on
// specificity anyway. Every color/font/radius/spacing value is a var() chain
// resolved against whatever token scope the markup sits in, so the manual
// showcase and the AI-generated UI are styled by the exact same mechanism.
//
// --pgc-* up top is a private alias layer that collapses the long
// var(--ds-x, var(--color-y, literal)) fallback chains into one place instead
// of repeating them ~200 times. It's deliberately not --pg-* (the derived
// semantic-role namespace from lib/studio/roleProperties.ts) - colliding
// would make the component layer overwrite values it's supposed to consume.
//
// Normal fallback order: --pg-* -> --ds-* -> --color-*/--font-*/--radius ->
// literal. But the ten editable component rules below invert that, resolving
// --ds-<component>-<slot> first, e.g. `background: var(--ds-button-bg,
// var(--pgc-primary))`. That's intentional: --pg-* is always defined (derived
// from the 5-color palette), so alias-first would mean an inspector edit to a
// button's background changes stored state, re-renders, and visibly does
// nothing - --ds-* is the more specific intent and has to win for the
// component that owns it. Everything else (rings, progress fills, avatars,
// badge's soft variant) still resolves through --pgc-* so editing a button
// doesn't drag unrelated components along.
//
// Trailing literals let the library render standalone (empty scope, a manual
// system, a Storybook harness) instead of collapsing to initial/transparent,
// which is what an unterminated var() chain does.

// Stable id so the injector can tell "already in the document" from "not yet".
export const SYSTEM_STYLE_ELEMENT_ID = "pg-components-stylesheet";

export const SYSTEM_COMPONENT_CSS = `
.pg-scope {
  /* --pg-background/--ds-color-bg is the page behind a card; --pg-surface/
     --ds-color-surface is the card itself. A manual system collapses both
     onto --color-surface, so components separate themselves with borders and
     tints instead of two distinct greys. */
  --pgc-bg: var(--pg-background, var(--ds-color-bg, var(--color-surface, #ffffff)));
  --pgc-surface: var(--pg-surface, var(--ds-color-surface, var(--color-surface, #ffffff)));
  --pgc-ink: var(--pg-text, var(--ds-color-text, var(--color-ink, #191919)));
  --pgc-muted: var(--pg-muted, var(--ds-color-text-muted, var(--color-muted, #6f6a61)));
  --pgc-border: var(--pg-border, var(--ds-color-border, var(--color-muted, #d9d4cb)));

  /* "primary" is what a filled button uses; "accent" is the highlight role
     (focus rings, active tabs, links). Separate roles in roleProperties.ts,
     and a system can point them at different hues, so don't conflate them. */
  --pgc-primary: var(--pg-primary, var(--ds-button-bg, var(--color-accent, #2f4bd8)));
  --pgc-on-primary: var(--pg-on-primary, var(--ds-button-text, var(--color-surface, #ffffff)));
  --pgc-secondary: var(--pg-secondary, var(--color-support, var(--color-accent, #2f4bd8)));
  --pgc-on-secondary: var(--pg-on-secondary, var(--color-surface, #ffffff));
  --pgc-accent: var(--pg-accent, var(--color-accent, #2f4bd8));
  --pgc-on-accent: var(--pg-on-accent, var(--ds-button-text, var(--color-surface, #ffffff)));

  /* --pg-on-success etc are P1's pre-computed readable foregrounds - using
     those instead of a hardcoded white is what keeps a light-warning fill
     legible. */
  --pgc-success: var(--pg-success, #2f6b4f);
  --pgc-warning: var(--pg-warning, #b4791f);
  --pgc-error: var(--pg-error, #b23b3b);
  --pgc-info: var(--pgc-secondary);
  --pgc-on-success: var(--pg-on-success, #ffffff);
  --pgc-on-warning: var(--pg-on-warning, #ffffff);
  --pgc-on-error: var(--pg-on-error, #ffffff);

  --pgc-radius: var(--pg-radius, var(--radius, 10px));
  --pgc-radius-sm: calc(var(--pg-radius, var(--radius, 10px)) * 0.6);
  /* --pg-font-* are already complete family stacks (quoted family + generic),
     so they're assigned straight through with no extra fallback family. */
  --pgc-font-body: var(--pg-font-body, var(--font-body, ui-sans-serif, system-ui, sans-serif));
  --pgc-font-display: var(--pg-font-display, var(--font-display, Georgia, serif));
  --pgc-font-heading: var(--pg-font-heading, var(--pgc-font-display));
  --pgc-font-button: var(--pg-font-button, var(--pgc-font-body));
  --pgc-font-label: var(--pg-font-label, var(--pgc-font-body));
  --pgc-font-caption: var(--pg-font-caption, var(--pgc-font-body));
  --pgc-ring: var(--pgc-accent);
  /* --shadow is the "recommended" level's own alias (StudioBuilder's Shadow
     selector writes state.shadows.recommended) - reading it here is what
     makes that selector do anything; it used to be exported but never
     consumed, so none/subtle/dramatic all looked identical on canvas.
     --shadow-lift stays pinned to the dramatic level regardless of the
     recommended choice, since a hover/press lift should read as more present
     than the resting state even in a "none" system. */
  --pgc-shadow: var(--shadow, var(--shadow-subtle, 0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.05)));
  --pgc-shadow-lift: var(--shadow-dramatic, 0 8px 28px rgba(0, 0, 0, 0.14));

  font-family: var(--pgc-font-body);
  color: var(--pgc-ink);
  font-size: var(--text-base, 15px);
  line-height: 1.55;
}
.pg-scope *,
.pg-scope *::before,
.pg-scope *::after { box-sizing: border-box; }

/* Every state transition funnels through this one duration so a reviewer
   hovering across a card doesn't see six different easings. */
.pg-scope * { --pgc-t: 150ms cubic-bezier(0.4, 0, 0.2, 1); }

@media (prefers-reduced-motion: reduce) {
  .pg-scope *,
  .pg-scope *::before,
  .pg-scope *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}

.pg-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2, 10px); }
.pg-grid { display: grid; gap: var(--space-3, 16px); grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
/* Modal and toast are position:absolute against this, never fixed - a fixed
   overlay would escape the canvas and cover the Studio chrome (sidebar,
   inspector), making the app unusable until dismissed. */
.pg-stage { position: relative; overflow: hidden; border-radius: var(--pgc-radius); }

.pg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--pgc-font-button);
  font-size: var(--text-sm, 14px);
  font-weight: 600;
  line-height: 1;
  padding: 11px 18px;
  border: 1px solid transparent;
  border-radius: var(--pgc-radius);
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
  transition: background-color var(--pgc-t), color var(--pgc-t), border-color var(--pgc-t),
    box-shadow var(--pgc-t), transform 70ms ease-out, opacity var(--pgc-t);
}
/* Mouse users get no ring; keyboard users always do. */
.pg-btn:focus { outline: none; }
.pg-btn:focus-visible { outline: 2px solid var(--ds-button-border-focus, var(--pgc-ring)); outline-offset: 2px; }
/* Paired with the darker :active fill below - the press should be felt, not implied. */
.pg-btn:active:not(:disabled) { transform: translateY(1px); }
.pg-btn:disabled { cursor: not-allowed; opacity: 0.45; box-shadow: none; }
.pg-btn--sm { padding: 7px 12px; font-size: var(--text-xs, 12px); gap: 6px; }
.pg-btn--lg { padding: 14px 24px; font-size: var(--text-base, 15px); }
.pg-btn--block { width: 100%; }

.pg-btn--primary {
  background: var(--ds-button-bg, var(--pgc-primary));
  color: var(--ds-button-text, var(--pgc-on-primary));
  border-color: var(--ds-button-border, transparent);
  box-shadow: var(--pgc-shadow);
}
/* color-mix toward --pgc-ink, not black, so on a dark experiment (light ink)
   this brightens instead of darkening and hover stays visible either way.
   [data-sb-preview="hover"] is Studio's Preview toggle (StudioCanvas.tsx) -
   there's no DOM API to force real :hover, so it sets this attribute on the
   selected element instead. It's on the same rule as the real :hover, not a
   hand-picked duplicate, so preview shows the exact real hover state. */
.pg-btn--primary:hover:not(:disabled),
.pg-btn--primary[data-sb-preview="hover"] {
  background: var(--ds-button-bg-hover, color-mix(in srgb, var(--pgc-primary) 85%, var(--pgc-ink)));
  box-shadow: var(--pgc-shadow-lift);
}
.pg-btn--primary:active:not(:disabled),
.pg-btn--primary[data-sb-preview="active"] {
  background: var(--ds-button-bg-active, color-mix(in srgb, var(--pgc-primary) 72%, var(--pgc-ink)));
  box-shadow: none;
}
/* Only kicks in if a disabled-state color was actually set in the inspector;
   otherwise it resolves to the button's normal color and opacity carries the signal. */
.pg-btn--primary:disabled {
  background: var(--ds-button-bg-disabled, var(--ds-button-bg, var(--pgc-primary)));
  color: var(--ds-button-text-disabled, var(--ds-button-text, var(--pgc-on-primary)));
  border-color: var(--ds-button-border-disabled, var(--ds-button-border, transparent));
}

.pg-btn--secondary {
  background: var(--ds-buttonSecondary-bg, color-mix(in srgb, var(--pgc-secondary) 16%, var(--pgc-surface)));
  color: var(--ds-buttonSecondary-text, var(--pgc-ink));
  border-color: var(--ds-buttonSecondary-border, transparent);
}
.pg-btn--secondary:hover:not(:disabled),
.pg-btn--secondary[data-sb-preview="hover"] {
  background: var(--ds-buttonSecondary-bg-hover, color-mix(in srgb, var(--pgc-secondary) 26%, var(--pgc-surface)));
}
.pg-btn--secondary:active:not(:disabled),
.pg-btn--secondary[data-sb-preview="active"] {
  background: var(--ds-buttonSecondary-bg-active, color-mix(in srgb, var(--pgc-secondary) 36%, var(--pgc-surface)));
}
.pg-btn--secondary:disabled {
  background: var(--ds-buttonSecondary-bg-disabled, var(--ds-buttonSecondary-bg, color-mix(in srgb, var(--pgc-secondary) 16%, var(--pgc-surface))));
  color: var(--ds-buttonSecondary-text-disabled, var(--ds-buttonSecondary-text, var(--pgc-ink)));
  border-color: var(--ds-buttonSecondary-border-disabled, var(--ds-buttonSecondary-border, transparent));
}
.pg-btn--secondary:focus-visible { outline-color: var(--ds-buttonSecondary-border-focus, var(--pgc-ring)); }

/* Outline and ghost both map to the same "button" ComponentName as primary in
   componentSelection.ts (only secondary gets its own slot), so they read
   --ds-button-* here too, precedence-inverted like primary - otherwise
   editing "the button" changes primary and does nothing to these. */
.pg-btn--outline {
  background: transparent;
  color: var(--ds-button-text, var(--pgc-ink));
  border-color: var(--ds-button-border, var(--pgc-border));
}
.pg-btn--outline:hover:not(:disabled),
.pg-btn--outline[data-sb-preview="hover"] {
  border-color: var(--ds-button-bg-hover, var(--ds-button-bg, var(--pgc-accent)));
  color: var(--ds-button-bg-hover, var(--ds-button-bg, var(--pgc-accent)));
  background: color-mix(in srgb, var(--ds-button-bg-hover, var(--ds-button-bg, var(--pgc-accent))) 8%, transparent);
}
.pg-btn--outline:active:not(:disabled),
.pg-btn--outline[data-sb-preview="active"] {
  background: color-mix(in srgb, var(--ds-button-bg-active, var(--ds-button-bg, var(--pgc-accent))) 16%, transparent);
}
.pg-btn--outline:disabled {
  color: var(--ds-button-text-disabled, var(--ds-button-text, var(--pgc-ink)));
  border-color: var(--ds-button-border-disabled, var(--ds-button-border, var(--pgc-border)));
}

.pg-btn--ghost { background: transparent; color: var(--ds-button-text, var(--pgc-ink)); }
.pg-btn--ghost:hover:not(:disabled),
.pg-btn--ghost[data-sb-preview="hover"] {
  background: color-mix(in srgb, var(--ds-button-bg-hover, var(--ds-button-bg, var(--pgc-ink))) 8%, transparent);
}
.pg-btn--ghost:active:not(:disabled),
.pg-btn--ghost[data-sb-preview="active"] {
  background: color-mix(in srgb, var(--ds-button-bg-active, var(--ds-button-bg, var(--pgc-ink))) 15%, transparent);
}

.pg-btn--danger {
  background: var(--pgc-error);
  color: var(--pgc-on-error);
  box-shadow: var(--pgc-shadow);
}
.pg-btn--danger:hover:not(:disabled),
.pg-btn--danger[data-sb-preview="hover"] { background: color-mix(in srgb, var(--pgc-error) 84%, #000); }
.pg-btn--danger:active:not(:disabled),
.pg-btn--danger[data-sb-preview="active"] { background: color-mix(in srgb, var(--pgc-error) 70%, #000); box-shadow: none; }
.pg-btn--danger:focus-visible { outline-color: var(--pgc-error); }

.pg-btn--icon { padding: 0; width: 38px; height: 38px; }
.pg-btn--icon.pg-btn--sm { width: 30px; height: 30px; }

/* Label hidden with visibility, not removed, so a loading button doesn't resize mid-click. */
.pg-btn[data-loading="true"] { cursor: progress; }
.pg-spinner {
  width: 14px;
  height: 14px;
  flex: none;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, currentColor 28%, transparent);
  border-top-color: currentColor;
  animation: pg-spin 700ms linear infinite;
}
@keyframes pg-spin { to { transform: rotate(360deg); } }

.pg-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.pg-label {
  font-family: var(--pgc-font-label);
  font-size: var(--text-xs, 12px);
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--pgc-ink);
}
.pg-hint { font-family: var(--pgc-font-caption); font-size: var(--text-xs, 12px); line-height: 1.45; color: var(--pgc-muted); }
.pg-hint--error { color: var(--pgc-error); font-weight: 500; }
.pg-hint--success { color: var(--pgc-success); font-weight: 500; }
.pg-hint__icon { display: inline-flex; vertical-align: -2px; margin-right: 4px; }

.pg-input,
.pg-select,
.pg-textarea {
  width: 100%;
  font-family: var(--pgc-font-body);
  font-size: var(--text-sm, 14px);
  line-height: 1.4;
  padding: 10px 12px;
  border-radius: var(--pgc-radius);
  background: var(--ds-input-bg, var(--pgc-surface));
  color: var(--ds-input-text, var(--pgc-ink));
  border: 1px solid var(--ds-input-border, var(--pgc-border));
  transition: border-color var(--pgc-t), box-shadow var(--pgc-t), background-color var(--pgc-t);
  -webkit-appearance: none;
  appearance: none;
}
.pg-textarea { resize: vertical; min-height: 84px; }
.pg-input::placeholder,
.pg-textarea::placeholder { color: var(--pgc-muted); opacity: 0.8; }
.pg-input:hover:not(:disabled),
.pg-select:hover:not(:disabled),
.pg-textarea:hover:not(:disabled) { border-color: color-mix(in srgb, var(--pgc-ink) 28%, var(--pgc-border)); }
/* :focus not :focus-visible - a text field needs to show it's focused even on
   click, unlike a button. The :not(:disabled) here is carrying specificity,
   not logic (a disabled field can't be focused anyway): the hover rule above
   is .pg-input:hover:not(...) at 0-3-0, so a bare .pg-input:focus at 0-2-0
   would lose to it and a focused field would show the hover border while the
   pointer sat on it. Every state rule below pads the same way for the same
   reason.
   Also: no backticks anywhere in this string - it's a template literal, and
   one in a comment ends the CSS mid-file with a build error on the wrong line. */
.pg-input:focus:not(:disabled),
.pg-textarea:focus:not(:disabled) {
  outline: none;
  border-color: var(--ds-input-border-focus, var(--pgc-accent));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-input-border-focus, var(--pgc-accent)) 26%, transparent);
}
/* dropdown is its own ComponentName, split from input's rule above, so
   editing dropdown's focus/disabled state doesn't also change a plain text field. */
.pg-select:focus:not(:disabled) {
  outline: none;
  border-color: var(--ds-dropdown-border-focus, var(--ds-input-border-focus, var(--pgc-accent)));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-dropdown-border-focus, var(--ds-input-border-focus, var(--pgc-accent))) 26%, transparent);
}
.pg-input:disabled,
.pg-textarea:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--ds-input-bg-disabled, color-mix(in srgb, var(--pgc-ink) 6%, var(--pgc-surface)));
}
.pg-select:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--ds-dropdown-bg-disabled, var(--ds-input-bg-disabled, color-mix(in srgb, var(--pgc-ink) 6%, var(--pgc-surface))));
}
.pg-input[aria-invalid="true"]:not(:disabled) { border-color: var(--pgc-error); }
.pg-input[aria-invalid="true"]:focus:not(:disabled) {
  border-color: var(--pgc-error);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pgc-error) 26%, transparent);
}
.pg-input[data-state="success"]:not(:disabled) { border-color: var(--pgc-success); }
.pg-input[data-state="success"]:focus:not(:disabled) {
  border-color: var(--pgc-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pgc-success) 26%, transparent);
}
.pg-input[data-state="filled"] { background: color-mix(in srgb, var(--pgc-ink) 5%, var(--pgc-surface)); }

/* The wrapper carries the focus ring so the icon sits inside the highlighted
   box instead of next to it. */
.pg-input-wrap { position: relative; display: flex; align-items: center; }
.pg-input-wrap .pg-input { padding-left: 36px; }
.pg-input-wrap__icon {
  position: absolute;
  left: 12px;
  display: inline-flex;
  color: var(--pgc-muted);
  pointer-events: none;
}

.pg-card {
  display: flex;
  flex-direction: column;
  background: var(--ds-card-bg, var(--pgc-surface));
  color: var(--ds-card-text, var(--pgc-ink));
  border: 1px solid var(--ds-card-border, var(--pgc-border));
  border-radius: var(--pgc-radius);
  overflow: hidden;
  transition: border-color var(--pgc-t), box-shadow var(--pgc-t), transform var(--pgc-t);
}
.pg-card__body { display: flex; flex-direction: column; gap: var(--space-2, 10px); padding: var(--space-4, 18px); }
.pg-card__title {
  font-family: var(--pgc-font-heading);
  font-size: var(--text-lg, 18px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  margin: 0;
}
.pg-card__text { font-size: var(--text-sm, 14px); line-height: 1.6; color: var(--pgc-muted); margin: 0; }
.pg-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2, 10px);
  padding: var(--space-3, 14px) var(--space-4, 18px);
  border-top: 1px solid var(--pgc-border);
}
/* Interactive cards are real <a>/<button> elements, so they get the same
   keyboard ring buttons do rather than a hover-only affordance. */
.pg-card--interactive { cursor: pointer; text-align: left; text-decoration: none; }
.pg-card--interactive:hover {
  border-color: var(--ds-card-border-hover, var(--pgc-accent));
  box-shadow: var(--pgc-shadow-lift);
  transform: translateY(-3px);
}
.pg-card--interactive:focus { outline: none; }
.pg-card--interactive:focus-visible { outline: 2px solid var(--ds-card-border-focus, var(--pgc-ring)); outline-offset: 3px; }
.pg-card--interactive:active { transform: translateY(-1px); }

/* A tint of the card's own text color, not a grey literal, so it re-tones
   with the experiment instead of staying the same grey slab in every card. */
.pg-card__media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  background: linear-gradient(
    140deg,
    color-mix(in srgb, var(--pgc-accent) 22%, var(--pgc-surface)),
    color-mix(in srgb, var(--pgc-secondary) 30%, var(--pgc-surface))
  );
  color: color-mix(in srgb, var(--pgc-ink) 45%, transparent);
  overflow: hidden;
}
.pg-card--interactive:hover .pg-card__media > svg { transform: scale(1.06); }
.pg-card__media > svg { transition: transform 400ms cubic-bezier(0.2, 0.7, 0.3, 1); }
.pg-card__price { font-family: var(--pgc-font-display); font-size: var(--text-xl, 21px); font-weight: 700; }
.pg-card__strike { font-size: var(--text-sm, 14px); color: var(--pgc-muted); text-decoration: line-through; }
.pg-card__eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--pgc-accent);
}
.pg-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-xs, 12px);
  color: var(--pgc-muted);
}
.pg-card__dot { width: 3px; height: 3px; border-radius: 50%; background: currentColor; flex: none; }
.pg-rating { display: inline-flex; align-items: center; gap: 3px; color: var(--pgc-warning); }

.pg-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3, 16px);
  padding: var(--space-3, 12px) var(--space-4, 18px);
  border-radius: var(--pgc-radius);
  background: var(--ds-navigation-bg, var(--pgc-surface));
  color: var(--ds-navigation-text, var(--pgc-ink));
  border: 1px solid var(--ds-navigation-border, var(--pgc-border));
}
.pg-navbar__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--pgc-font-heading);
  font-size: var(--text-base, 16px);
  font-weight: 700;
  letter-spacing: -0.015em;
}
.pg-navbar__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--pgc-radius-sm);
  background: var(--pgc-accent);
  color: var(--pgc-on-accent);
  flex: none;
}
.pg-navbar__links { display: flex; align-items: center; gap: 2px; }
/* "navigation" as a ComponentName covers three structurally different widgets
   (navbar, tablist, breadcrumbs - see componentSelection.ts). Resting/hover
   text and hover background read --ds-navigation-*; the active/selected
   highlight stays on --pgc-accent as a distinct "this is current" cue rather
   than literally the component's text color. */
.pg-navlink {
  position: relative;
  padding: 7px 11px;
  border-radius: var(--pgc-radius-sm);
  font-size: var(--text-sm, 14px);
  font-weight: 500;
  color: var(--ds-navigation-text, color-mix(in srgb, var(--pgc-ink) 72%, transparent));
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color var(--pgc-t), background-color var(--pgc-t);
}
.pg-navlink:hover,
.pg-navlink[data-sb-preview="hover"] {
  color: var(--ds-navigation-text, var(--pgc-ink));
  background: var(--ds-navigation-bg-hover, color-mix(in srgb, var(--pgc-ink) 7%, transparent));
}
.pg-navlink:focus { outline: none; }
.pg-navlink:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: 1px; }
.pg-navlink[aria-current="page"] { color: var(--pgc-accent); background: color-mix(in srgb, var(--pgc-accent) 12%, transparent); }
/* Same specificity as .pg-navlink:hover above but declared later - without
   this the active item loses hover feedback that every other link has. */
.pg-navlink[aria-current="page"]:hover { background: color-mix(in srgb, var(--pgc-accent) 20%, transparent); }

/* The tab underline is a pseudo-element on the button so it tracks the
   button's own box and needs no measuring JS. */
.pg-tablist {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--pgc-border);
  overflow-x: auto;
  scrollbar-width: none;
}
.pg-tablist::-webkit-scrollbar { display: none; }
.pg-tab {
  position: relative;
  padding: 10px 14px;
  font-family: var(--pgc-font-label);
  font-size: var(--text-sm, 14px);
  font-weight: 600;
  white-space: nowrap;
  color: var(--ds-navigation-text, var(--pgc-muted));
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color var(--pgc-t), background-color var(--pgc-t);
}
.pg-tab::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--pgc-accent);
  transform: scaleX(0);
  transition: transform 180ms cubic-bezier(0.4, 0, 0.2, 1);
}
.pg-tab:hover,
.pg-tab[data-sb-preview="hover"] {
  color: var(--ds-navigation-text, var(--pgc-ink));
  background: var(--ds-navigation-bg-hover, color-mix(in srgb, var(--pgc-ink) 5%, transparent));
}
.pg-tab:focus { outline: none; }
.pg-tab:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: -2px; border-radius: var(--pgc-radius-sm); }
.pg-tab[aria-selected="true"] { color: var(--pgc-accent); }
.pg-tab[aria-selected="true"]::after { transform: scaleX(1); }
.pg-tabpanel { padding: var(--space-3, 16px) 2px 0; font-size: var(--text-sm, 14px); line-height: 1.6; color: var(--pgc-muted); }
.pg-tabpanel:focus { outline: none; }
.pg-tabpanel:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: 4px; border-radius: var(--pgc-radius-sm); }

.pg-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: var(--text-sm, 14px); }
.pg-crumbs__sep { display: inline-flex; color: var(--pgc-muted); opacity: 0.6; }
.pg-crumb {
  padding: 3px 6px;
  border-radius: var(--pgc-radius-sm);
  color: var(--ds-navigation-text, var(--pgc-muted));
  text-decoration: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
  transition: color var(--pgc-t), background-color var(--pgc-t);
}
.pg-crumb:hover,
.pg-crumb[data-sb-preview="hover"] {
  color: var(--pgc-accent);
  background: var(--ds-navigation-bg-hover, color-mix(in srgb, var(--pgc-accent) 10%, transparent));
}
.pg-crumb:focus { outline: none; }
.pg-crumb:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: 1px; }
.pg-crumb[aria-current="page"] { color: var(--pgc-ink); font-weight: 600; cursor: default; }
.pg-crumb[aria-current="page"]:hover { background: transparent; color: var(--pgc-ink); }

.pg-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2, 10px);
  padding: var(--space-3, 13px) var(--space-3, 14px);
  border-radius: var(--pgc-radius);
  /* The tone variants below are semantic (info/success/warning/error) and
     derive their own fills, so --ds-alert-* only applies to the neutral base -
     an edited alert token that recolored the error alert green would be
     actively misleading. */
  border: 1px solid var(--ds-alert-border, var(--pgc-tone-border));
  background: var(--ds-alert-bg, var(--pgc-tone-bg));
  color: var(--ds-alert-text, var(--pgc-ink));
  font-size: var(--text-sm, 14px);
  line-height: 1.55;
}
/* One rule, four tones: each modifier only rebinds --pgc-tone and the
   surface/border/icon colors derive from it, so a fifth tone is a three-line
   block, not a copy of the whole alert. info is the neutral/default tone, so
   it takes --ds-alert-bg first, same reasoning as badge's --soft variant below. */
.pg-alert--info { --pgc-tone: var(--ds-alert-bg, var(--pgc-info)); }
.pg-alert--success { --pgc-tone: var(--pgc-success); }
.pg-alert--warning { --pgc-tone: var(--pgc-warning); }
.pg-alert--error { --pgc-tone: var(--pgc-error); }
.pg-alert {
  --pgc-tone-bg: color-mix(in srgb, var(--pgc-tone) 12%, var(--pgc-surface));
  --pgc-tone-border: color-mix(in srgb, var(--pgc-tone) 42%, var(--pgc-surface));
}
/* Re-asserted after the base rule so the tone wins over --ds-alert-* - without
   this a system carrying an alert token would paint error and success the
   same color, since the modifiers above only rebind --pgc-tone. */
.pg-alert--info,
.pg-alert--success,
.pg-alert--warning,
.pg-alert--error {
  background: var(--pgc-tone-bg);
  border-color: var(--pgc-tone-border);
}
.pg-alert__icon { display: inline-flex; flex: none; margin-top: 1px; color: var(--pgc-tone); }
.pg-alert__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pg-alert__title { font-weight: 700; font-size: var(--text-sm, 14px); color: var(--pgc-ink); }
.pg-alert__text { color: var(--pgc-muted); }
.pg-alert__close {
  display: inline-flex;
  flex: none;
  padding: 3px;
  margin: -2px -2px 0 0;
  border: 0;
  border-radius: var(--pgc-radius-sm);
  background: transparent;
  color: var(--pgc-muted);
  cursor: pointer;
  transition: background-color var(--pgc-t), color var(--pgc-t);
}
.pg-alert__close:hover { background: color-mix(in srgb, var(--pgc-tone) 22%, transparent); color: var(--pgc-ink); }
.pg-alert__close:focus { outline: none; }
.pg-alert__close:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: 1px; }

.pg-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  background: var(--ds-badge-bg, var(--pgc-accent));
  color: var(--ds-badge-text, var(--pgc-on-accent));
  border: 1px solid var(--ds-badge-border, transparent);
}
/* success/warning/error stay pinned to their semantic tone, same principle as
   .pg-btn--danger staying pinned to --pgc-error - a status color losing its
   meaning because someone edited "badge" would be misleading. --soft is the
   neutral/default variant (every badge in the app is one of these five) and
   --outline has no tone concept, so both take --ds-badge-* first - otherwise
   editing "badge" in the inspector visibly did nothing, since no real badge
   on canvas uses the bare solid .pg-badge these tokens originally targeted. */
.pg-badge--soft { --pgc-tone: var(--ds-badge-bg, var(--pgc-accent)); }
.pg-badge--success { --pgc-tone: var(--pgc-success); }
.pg-badge--warning { --pgc-tone: var(--pgc-warning); }
.pg-badge--error { --pgc-tone: var(--pgc-error); }
.pg-badge--soft,
.pg-badge--success,
.pg-badge--warning,
.pg-badge--error {
  background: color-mix(in srgb, var(--pgc-tone) 15%, var(--pgc-surface));
  color: color-mix(in srgb, var(--pgc-tone) 82%, var(--pgc-ink));
  border-color: color-mix(in srgb, var(--pgc-tone) 32%, transparent);
}
.pg-badge--outline {
  background: transparent;
  color: var(--ds-badge-text, var(--pgc-muted));
  border-color: var(--ds-badge-border, var(--pgc-border));
}
.pg-badge__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; }

.pg-toast {
  position: absolute;
  left: var(--space-3, 14px);
  right: var(--space-3, 14px);
  bottom: var(--space-3, 14px);
  display: flex;
  align-items: center;
  gap: var(--space-2, 10px);
  padding: 12px 14px;
  border-radius: var(--pgc-radius);
  background: var(--pgc-ink);
  color: var(--pgc-surface);
  box-shadow: var(--pgc-shadow-lift);
  font-size: var(--text-sm, 14px);
  animation: pg-toast-in 260ms cubic-bezier(0.2, 0.8, 0.3, 1);
}
@keyframes pg-toast-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.pg-toast__icon { display: inline-flex; flex: none; color: var(--pgc-success); }
.pg-toast__close {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  display: inline-flex;
  padding: 2px;
  border-radius: var(--pgc-radius-sm);
}
.pg-toast__close:hover { opacity: 1; background: color-mix(in srgb, currentColor 18%, transparent); }
.pg-toast__close:focus { outline: none; }
.pg-toast__close:focus-visible { outline: 2px solid currentColor; outline-offset: 1px; }

/* Checkbox/radio use the real <input> with appearance:none instead of a
   hidden input plus a styled span - the native element keeps label
   association, space-bar toggle, focus ring and :checked for free, which a
   div with role="checkbox" would have to reimplement. */
.pg-choice { display: flex; align-items: flex-start; gap: 9px; cursor: pointer; font-size: var(--text-sm, 14px); }
.pg-choice--disabled { cursor: not-allowed; opacity: 0.5; }
.pg-choice__text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.pg-choice__desc { font-size: var(--text-xs, 12px); color: var(--pgc-muted); line-height: 1.45; }

.pg-checkbox,
.pg-radio {
  -webkit-appearance: none;
  appearance: none;
  flex: none;
  width: 18px;
  height: 18px;
  margin: 1px 0 0;
  display: grid;
  place-content: center;
  background: var(--pgc-surface);
  border: 1.5px solid var(--pgc-border);
  cursor: inherit;
  transition: background-color var(--pgc-t), border-color var(--pgc-t), box-shadow var(--pgc-t);
}
.pg-checkbox { border-radius: var(--pgc-radius-sm); }
.pg-radio { border-radius: 50%; }
.pg-checkbox:hover:not(:disabled),
.pg-radio:hover:not(:disabled) { border-color: var(--pgc-accent); }
.pg-checkbox:focus-visible,
.pg-radio:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: 2px; }
.pg-checkbox:checked,
.pg-radio:checked { background: var(--pgc-accent); border-color: var(--pgc-accent); }
.pg-checkbox:disabled,
.pg-radio:disabled { cursor: not-allowed; background: color-mix(in srgb, var(--pgc-ink) 8%, var(--pgc-surface)); }
/* Tick is a rotated border, not an SVG child, because the input element can't have children. */
.pg-checkbox::before {
  content: "";
  width: 9px;
  height: 5px;
  border: 2px solid var(--pgc-on-accent);
  border-top: 0;
  border-right: 0;
  transform: rotate(-45deg) translate(1px, -1px) scale(0.4);
  opacity: 0;
  transition: opacity 120ms, transform 160ms cubic-bezier(0.2, 0.9, 0.3, 1.3);
}
.pg-checkbox:checked::before { opacity: 1; transform: rotate(-45deg) translate(1px, -1px) scale(1); }
.pg-checkbox:indeterminate { background: var(--pgc-accent); border-color: var(--pgc-accent); }
.pg-checkbox:indeterminate::before {
  opacity: 1;
  width: 9px;
  height: 0;
  border-bottom: 2px solid var(--pgc-on-accent);
  border-left: 0;
  transform: none;
}
.pg-radio::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pgc-on-accent);
  transform: scale(0);
  transition: transform 160ms cubic-bezier(0.2, 0.9, 0.3, 1.3);
}
.pg-radio:checked::before { transform: scale(1); }

/* role="switch" on a real <button>, so Enter and Space both fire it and
   screen readers announce on/off without an aria-live hack. */
.pg-switch {
  position: relative;
  flex: none;
  width: 40px;
  height: 23px;
  padding: 0;
  border-radius: 999px;
  border: 1.5px solid var(--pgc-border);
  background: color-mix(in srgb, var(--pgc-ink) 12%, var(--pgc-surface));
  cursor: pointer;
  transition: background-color var(--pgc-t), border-color var(--pgc-t);
}
.pg-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--pgc-surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
  transition: transform 190ms cubic-bezier(0.3, 0.8, 0.3, 1.1), background-color var(--pgc-t);
}
.pg-switch:hover:not(:disabled) { border-color: var(--pgc-accent); }
.pg-switch:focus { outline: none; }
.pg-switch:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: 2px; }
.pg-switch[aria-checked="true"] { background: var(--pgc-accent); border-color: var(--pgc-accent); }
.pg-switch[aria-checked="true"]::after { transform: translateX(17px); }
.pg-switch:disabled { cursor: not-allowed; opacity: 0.5; }

.pg-select-wrap { position: relative; display: flex; align-items: center; }
/* dropdown is a distinct ComponentName with its own tokens, so it overrides
   the shared input rule above rather than inheriting it. */
.pg-select {
  padding-right: 34px;
  cursor: pointer;
  background: var(--ds-dropdown-bg, var(--ds-input-bg, var(--pgc-surface)));
  color: var(--ds-dropdown-text, var(--ds-input-text, var(--pgc-ink)));
  border-color: var(--ds-dropdown-border, var(--ds-input-border, var(--pgc-border)));
}
.pg-select-wrap__chevron { position: absolute; right: 12px; display: inline-flex; color: var(--pgc-muted); pointer-events: none; }

/* Hover *and* focus-within, so the tooltip is reachable by keyboard - hover-only is an a11y failure. */
.pg-tooltip { position: relative; display: inline-flex; }
.pg-tooltip__bubble {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 4;
  transform: translate(-50%, 4px);
  padding: 6px 10px;
  border-radius: var(--pgc-radius-sm);
  background: var(--pgc-ink);
  color: var(--pgc-surface);
  font-size: var(--text-xs, 12px);
  font-weight: 500;
  line-height: 1.35;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 130ms, transform 130ms;
  box-shadow: var(--pgc-shadow-lift);
}
.pg-tooltip__bubble::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border: 4px solid transparent;
  border-top-color: var(--pgc-ink);
}
.pg-tooltip:hover .pg-tooltip__bubble,
.pg-tooltip:focus-within .pg-tooltip__bubble { opacity: 1; transform: translate(-50%, 0); }

.pg-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-family: var(--pgc-font-display);
  font-size: var(--text-sm, 14px);
  font-weight: 700;
  letter-spacing: 0.02em;
  background: color-mix(in srgb, var(--pgc-accent) 20%, var(--pgc-surface));
  color: color-mix(in srgb, var(--pgc-accent) 80%, var(--pgc-ink));
  border: 1px solid color-mix(in srgb, var(--pgc-accent) 30%, transparent);
  overflow: hidden;
  user-select: none;
}
.pg-avatar--sm { width: 28px; height: 28px; font-size: 11px; }
.pg-avatar--lg { width: 56px; height: 56px; font-size: var(--text-lg, 18px); }
.pg-avatar--accent { background: var(--pgc-accent); color: var(--pgc-on-accent); border-color: transparent; }
.pg-avatar-group { display: flex; align-items: center; }
.pg-avatar-group .pg-avatar { margin-left: -10px; box-shadow: 0 0 0 2px var(--pgc-surface); }
.pg-avatar-group .pg-avatar:first-child { margin-left: 0; }
.pg-avatar__status {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--pgc-success);
  box-shadow: 0 0 0 2px var(--pgc-surface);
}
.pg-avatar-wrap { position: relative; display: inline-flex; }

.pg-progress {
  position: relative;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in srgb, var(--pgc-ink) 12%, var(--pgc-surface));
}
.pg-progress__bar {
  height: 100%;
  border-radius: inherit;
  background: var(--pgc-accent);
  transition: width 320ms cubic-bezier(0.3, 0.8, 0.3, 1);
}
.pg-progress--success .pg-progress__bar { background: var(--pgc-success); }

/* Shimmer sweep is a gradient on a pseudo-element so the block keeps its own
   background and no extra DOM is needed per shimmer line. */
.pg-skeleton {
  position: relative;
  overflow: hidden;
  border-radius: var(--pgc-radius-sm);
  background: color-mix(in srgb, var(--pgc-ink) 10%, var(--pgc-surface));
}
.pg-skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--pgc-surface) 70%, transparent), transparent);
  animation: pg-shimmer 1.35s infinite;
}
@keyframes pg-shimmer { to { transform: translateX(100%); } }
.pg-skeleton--circle { border-radius: 50%; }

/* Modal is absolute inside .pg-stage, see the .pg-stage comment above. */
.pg-modal-backdrop {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3, 16px);
  background: color-mix(in srgb, var(--pgc-ink) 55%, transparent);
  animation: pg-fade-in 160ms ease-out;
}
@keyframes pg-fade-in { from { opacity: 0; } to { opacity: 1; } }
.pg-modal {
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 10px);
  padding: var(--space-4, 20px);
  border-radius: var(--pgc-radius);
  background: var(--ds-modal-bg, var(--pgc-surface));
  color: var(--ds-modal-text, var(--pgc-ink));
  border: 1px solid var(--ds-modal-border, var(--pgc-border));
  box-shadow: var(--pgc-shadow-lift);
  animation: pg-modal-in 200ms cubic-bezier(0.2, 0.8, 0.3, 1);
}
@keyframes pg-modal-in { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
.pg-modal:focus { outline: none; }
.pg-modal__title { font-family: var(--pgc-font-heading); font-size: var(--text-lg, 18px); font-weight: 700; margin: 0; }
.pg-modal__text { font-size: var(--text-sm, 14px); line-height: 1.6; color: var(--pgc-muted); margin: 0; }
.pg-modal__actions { display: flex; justify-content: flex-end; gap: var(--space-2, 10px); margin-top: var(--space-2, 8px); }

/* Size/weight/face here mirror SEMANTIC_TYPE_ROLES in lib/export/designTokens.ts
   one-for-one on purpose - the showcase must never render an h2 that differs
   from the h2 every export format emits. Sizes come through as --text-*
   custom properties (generateExportCode emits the display/h1/h2/h3/body/caption
   aliases onto the raw scale steps), so a type-scale change in the sidebar
   moves them without touching this file. */
.pg-display,
.pg-h1,
.pg-h2,
.pg-h3 {
  font-family: var(--pgc-font-heading);
  color: var(--pgc-ink);
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.1;
  text-wrap: balance;
}
.pg-display { font-size: var(--text-display, 60px); font-weight: 700; line-height: 1.02; letter-spacing: -0.03em; }
.pg-h1 { font-size: var(--text-h1, 39px); font-weight: 700; }
.pg-h2 { font-size: var(--text-h2, 25px); font-weight: 700; }
.pg-h3 { font-size: var(--text-h3, 20px); font-weight: 600; letter-spacing: -0.01em; }
.pg-body {
  font-family: var(--pgc-font-body);
  font-size: var(--text-body, 16px);
  font-weight: 400;
  line-height: 1.6;
  color: var(--pgc-ink);
  margin: 0;
  text-wrap: pretty;
}
.pg-body--muted { color: var(--pgc-muted); }
.pg-caption {
  font-family: var(--pgc-font-caption);
  font-size: var(--text-caption, 12px);
  font-weight: 400;
  line-height: 1.5;
  color: var(--pgc-muted);
  margin: 0;
}
/* The measure a paragraph is actually read at - without it a body specimen
   spans the full canvas and says nothing about the font's real rhythm. */
.pg-prose { max-width: 62ch; }

.pg-swatches { display: grid; gap: var(--space-2, 10px); grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); }
.pg-swatch {
  display: flex;
  flex-direction: column;
  border-radius: var(--pgc-radius);
  border: 1px solid var(--pgc-border);
  overflow: hidden;
  background: var(--pgc-surface);
}
/* Height, not aspect-ratio: these sit in a grid whose column count changes
   with canvas width, and an aspect-ratio chip would jump height every reflow. */
.pg-swatch__chip { height: 56px; }
.pg-swatch__meta { padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 2px; }
.pg-swatch__name { font-family: var(--pgc-font-label); font-size: 11px; font-weight: 600; color: var(--pgc-ink); }
.pg-swatch__hex { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--pgc-muted); }

.pg-table-wrap {
  border: 1px solid var(--pgc-border);
  border-radius: var(--pgc-radius);
  overflow: hidden;
  background: var(--pgc-surface);
}
.pg-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm, 14px); }
.pg-table th {
  text-align: left;
  font-family: var(--pgc-font-label);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-table-text, var(--pgc-muted));
  background: var(--ds-table-bg, color-mix(in srgb, var(--pgc-ink) 4%, var(--pgc-surface)));
  padding: 10px 14px;
  border-bottom: 1px solid var(--ds-table-border, var(--pgc-border));
}
.pg-table td {
  padding: 12px 14px;
  color: var(--ds-table-text, var(--pgc-ink));
  border-bottom: 1px solid color-mix(in srgb, var(--pgc-border) 60%, transparent);
}
.pg-table tbody tr:last-child td { border-bottom: 0; }
.pg-table tbody tr { transition: background-color var(--pgc-t); }
.pg-table tbody tr:hover,
.pg-table tbody tr[data-sb-preview="hover"] { background: var(--ds-table-bg-hover, color-mix(in srgb, var(--pgc-ink) 3%, transparent)); }
.pg-table__num { text-align: right; font-variant-numeric: tabular-nums; }

/* A definition list rendered as rows - the "detail panel" shape (spec sheet,
   patient record, transaction detail) that a table is wrong for when there's
   exactly one record. */
.pg-deflist { display: grid; gap: 0; }
.pg-deflist__row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3, 16px);
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--pgc-border) 60%, transparent);
  font-size: var(--text-sm, 14px);
}
.pg-deflist__row:last-child { border-bottom: 0; }
.pg-deflist__key { color: var(--pgc-muted); }
.pg-deflist__val { color: var(--pgc-ink); font-weight: 500; text-align: right; }

/* Screen-reader-only, used by the live regions announcing toggle/toast/progress
   changes. Visually-hidden, never display:none, or assistive tech drops it too. */
.pg-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
`;
