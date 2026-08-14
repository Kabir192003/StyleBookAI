/**
 * The single stylesheet behind every Design Playground component.
 *
 * Why a stylesheet at all, when `lib/studio/livePreviewBlocks.ts` gets by
 * with inline `style` attributes: those blocks are static specimens, these
 * are real controls that must expose real `:hover` / `:focus-visible` /
 * `:active` / `:disabled` behaviour (docs/DESIGN_PLAYGROUND.md, P2). Pseudo-
 * classes cannot be expressed in an inline `style` attribute at all, and —
 * more importantly — an inline `style` wins on specificity over any rule a
 * stylesheet could write, so a hover rule would silently lose to the inline
 * base colour. Everything token-driven therefore lives here in classes; the
 * only inline styles left in the components are per-instance geometry
 * (a progress width, an avatar's initials tint) that no class can express.
 *
 * Why it is still 100% token-driven: this string is *static text*. Every
 * colour, font, radius and spacing value is a `var(...)` chain, resolved at
 * paint time against whichever `[data-pg-exp="…"]` scope the markup happens
 * to sit inside. One stylesheet, N experiments, N different renderings — the
 * requirement-18 guarantee in docs/DESIGN_PLAYGROUND.md holds structurally
 * rather than by convention. Adding a per-experiment `<style>` of component
 * CSS would break exactly that guarantee, so don't.
 *
 * The `--pgc-*` layer at the top is a private alias namespace: it collapses
 * the long `var(--ds-x, var(--color-y, literal))` fallback chains into one
 * place instead of repeating them in ~200 declarations. It is deliberately
 * NOT `--pg-*`, which is the playground *state* layer's namespace (P1 emits
 * `--pg-success`, `--pg-warning`, `--pg-error`, `--pg-border`, `--pg-accent`
 * for the semantic roles the five-colour base palette has no slot for) —
 * colliding with those would have the component layer overwrite the values
 * it is supposed to be consuming.
 *
 * Fallback order for every alias is:
 *
 *   --pg-*  ->  --ds-*  ->  --color-* / --font-* / --radius  ->  literal
 *
 * `--pg-*` comes **first**, and that ordering is load-bearing. Per P1's
 * handoff, the `--pg-*` block is emitted after the token block at equal
 * specificity and every one of those properties is always defined inside a
 * scope (an unassigned role resolves to the base system). It is the layer
 * the user's role assignments actually land in. Resolving `--ds-button-bg`
 * first — as an earlier draft did — would mean a user reassigning the
 * primary role in an experiment changed nothing, because the synthesised
 * `--ds-*` value would keep winning. The `--ds-*` rung survives for the
 * cases `--pg-*` has no name for (per-component `-hover` / `-active` /
 * `-disabled` state colours) and so the library still resolves sensibly if
 * it is ever rendered outside a playground scope.
 *
 * The trailing literal exists so the library renders standalone (an empty
 * scope, a manual non-AI system, a Storybook-style harness) rather than
 * collapsing to `initial`/transparent, which is what an unterminated var()
 * chain does.
 */

/** Stable id so the injector can tell "already in the document" from "not yet". */
export const PLAYGROUND_STYLE_ELEMENT_ID = "pg-components-stylesheet";

export const PLAYGROUND_COMPONENT_CSS = `
/* ------------------------------------------------------------------ *
 * Alias layer + shell
 * ------------------------------------------------------------------ */
.pg-scope {
  /* Surfaces. --pg-background / --ds-color-bg is the page behind a card;
     --pg-surface / --ds-color-surface is the card itself. A manual system
     collapses both onto --color-surface, so the components separate
     themselves with borders and tints rather than two distinct greys. */
  --pgc-bg: var(--pg-background, var(--ds-color-bg, var(--color-surface, #ffffff)));
  --pgc-surface: var(--pg-surface, var(--ds-color-surface, var(--color-surface, #ffffff)));
  --pgc-ink: var(--pg-text, var(--ds-color-text, var(--color-ink, #191919)));
  --pgc-muted: var(--pg-muted, var(--ds-color-text-muted, var(--color-muted, #6f6a61)));
  --pgc-border: var(--pg-border, var(--ds-color-border, var(--color-muted, #d9d4cb)));

  /* Brand roles. "primary" is what a filled button uses; "accent" is the
     highlight role (focus rings, active tabs, links). They are separate
     roles in lib/playground/types.ts and a user can point them at
     different hues, so the library must not conflate them. */
  --pgc-primary: var(--pg-primary, var(--ds-button-bg, var(--color-accent, #2f4bd8)));
  --pgc-on-primary: var(--pg-on-primary, var(--ds-button-text, var(--color-surface, #ffffff)));
  --pgc-secondary: var(--pg-secondary, var(--color-support, var(--color-accent, #2f4bd8)));
  --pgc-on-secondary: var(--pg-on-secondary, var(--color-surface, #ffffff));
  --pgc-accent: var(--pg-accent, var(--color-accent, #2f4bd8));
  --pgc-on-accent: var(--pg-on-accent, var(--ds-button-text, var(--color-surface, #ffffff)));

  /* Semantic roles, plus P1's pre-computed readable foregrounds — using
     --pg-on-success and friends instead of a hardcoded white is the whole
     reason they exist, and it is what keeps a light-warning fill legible. */
  --pgc-success: var(--pg-success, #2f6b4f);
  --pgc-warning: var(--pg-warning, #b4791f);
  --pgc-error: var(--pg-error, #b23b3b);
  --pgc-info: var(--pgc-secondary);
  --pgc-on-success: var(--pg-on-success, #ffffff);
  --pgc-on-warning: var(--pg-on-warning, #ffffff);
  --pgc-on-error: var(--pg-on-error, #ffffff);

  --pgc-radius: var(--pg-radius, var(--radius, 10px));
  --pgc-radius-sm: calc(var(--pg-radius, var(--radius, 10px)) * 0.6);
  /* --pg-font-* are complete family stacks (quoted family + generic), so
     they are assigned straight through with no added fallback family. */
  --pgc-font-body: var(--pg-font-body, var(--font-body, ui-sans-serif, system-ui, sans-serif));
  --pgc-font-display: var(--pg-font-display, var(--font-display, Georgia, serif));
  --pgc-font-heading: var(--pg-font-heading, var(--pgc-font-display));
  --pgc-font-button: var(--pg-font-button, var(--pgc-font-body));
  --pgc-font-label: var(--pg-font-label, var(--pgc-font-body));
  --pgc-font-caption: var(--pg-font-caption, var(--pgc-font-body));
  --pgc-ring: var(--pgc-accent);
  --pgc-shadow: var(--shadow-subtle, 0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.05));
  --pgc-shadow-lift: var(--shadow-dramatic, 0 8px 28px rgba(0, 0, 0, 0.14));

  font-family: var(--pgc-font-body);
  color: var(--pgc-ink);
  font-size: var(--text-base, 15px);
  line-height: 1.55;
}
.pg-scope *,
.pg-scope *::before,
.pg-scope *::after { box-sizing: border-box; }

/* Every state transition in the library funnels through this one duration so
   a reviewer hovering across a card doesn't see six different easings. */
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

/* ------------------------------------------------------------------ *
 * Specimen scaffolding — the neutral chrome each group is laid out in.
 * Kept token-driven too: a specimen caption printed in a colour the
 * experiment never chose would misrepresent the palette being judged.
 * ------------------------------------------------------------------ */
.pg-stack { display: flex; flex-direction: column; gap: var(--space-5, 26px); }
.pg-specimen { display: flex; flex-direction: column; gap: var(--space-2, 10px); }
.pg-specimen__label {
  font-family: var(--pgc-font-label);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pgc-muted);
}
.pg-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2, 10px); }
.pg-grid { display: grid; gap: var(--space-3, 16px); grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
/* Modal and toast are position:absolute against this, never position:fixed —
   a fixed overlay would escape its experiment card and cover the whole
   playground grid, which makes side-by-side comparison impossible. */
.pg-stage { position: relative; overflow: hidden; border-radius: var(--pgc-radius); }

/* ------------------------------------------------------------------ *
 * Buttons
 * ------------------------------------------------------------------ */
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
/* Mouse users get no ring; keyboard users always do. :focus-visible is the
   whole reason the ring can be this loud without looking broken on click. */
.pg-btn:focus { outline: none; }
.pg-btn:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: 2px; }
/* The press must be *felt*, not implied — a reviewer clicks the button and
   expects it to move. Paired with a darker :active fill below. */
.pg-btn:active:not(:disabled) { transform: translateY(1px); }
.pg-btn:disabled { cursor: not-allowed; opacity: 0.45; box-shadow: none; }
.pg-btn--sm { padding: 7px 12px; font-size: var(--text-xs, 12px); gap: 6px; }
.pg-btn--lg { padding: 14px 24px; font-size: var(--text-base, 15px); }
.pg-btn--block { width: 100%; }

.pg-btn--primary {
  background: var(--pgc-primary);
  color: var(--pgc-on-primary);
  border-color: var(--ds-button-border, transparent);
  box-shadow: var(--pgc-shadow);
}
/* color-mix toward --pgc-ink rather than toward black: on a dark experiment
   the ink is light, so the same rule brightens instead of darkening and the
   hover stays visible in both directions. The --ds-*-hover token, when the
   AI system supplies one, always wins over the computed fallback. */
.pg-btn--primary:hover:not(:disabled) {
  background: var(--ds-button-bg-hover, color-mix(in srgb, var(--pgc-primary) 85%, var(--pgc-ink)));
  box-shadow: var(--pgc-shadow-lift);
}
.pg-btn--primary:active:not(:disabled) {
  background: var(--ds-button-bg-active, color-mix(in srgb, var(--pgc-primary) 72%, var(--pgc-ink)));
  box-shadow: none;
}

.pg-btn--secondary {
  background: var(--ds-buttonSecondary-bg, color-mix(in srgb, var(--pgc-secondary) 16%, var(--pgc-surface)));
  color: var(--ds-buttonSecondary-text, var(--pgc-ink));
  border-color: var(--ds-buttonSecondary-border, transparent);
}
.pg-btn--secondary:hover:not(:disabled) {
  background: var(--ds-buttonSecondary-bg-hover, color-mix(in srgb, var(--pgc-secondary) 26%, var(--pgc-surface)));
}
.pg-btn--secondary:active:not(:disabled) {
  background: var(--ds-buttonSecondary-bg-active, color-mix(in srgb, var(--pgc-secondary) 36%, var(--pgc-surface)));
}

.pg-btn--outline {
  background: transparent;
  color: var(--pgc-ink);
  border-color: var(--pgc-border);
}
.pg-btn--outline:hover:not(:disabled) {
  border-color: var(--pgc-accent);
  color: var(--pgc-accent);
  background: color-mix(in srgb, var(--pgc-accent) 8%, transparent);
}
.pg-btn--outline:active:not(:disabled) { background: color-mix(in srgb, var(--pgc-accent) 16%, transparent); }

.pg-btn--ghost { background: transparent; color: var(--pgc-ink); }
.pg-btn--ghost:hover:not(:disabled) { background: color-mix(in srgb, var(--pgc-ink) 8%, transparent); }
.pg-btn--ghost:active:not(:disabled) { background: color-mix(in srgb, var(--pgc-ink) 15%, transparent); }

.pg-btn--danger {
  background: var(--pgc-error);
  color: var(--pgc-on-error);
  box-shadow: var(--pgc-shadow);
}
.pg-btn--danger:hover:not(:disabled) { background: color-mix(in srgb, var(--pgc-error) 84%, #000); }
.pg-btn--danger:active:not(:disabled) { background: color-mix(in srgb, var(--pgc-error) 70%, #000); box-shadow: none; }
.pg-btn--danger:focus-visible { outline-color: var(--pgc-error); }

.pg-btn--icon { padding: 0; width: 38px; height: 38px; }
.pg-btn--icon.pg-btn--sm { width: 30px; height: 30px; }

/* Loading buttons keep their box: the label is hidden with visibility, not
   removed, so the button does not resize mid-click and shove the layout. */
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

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */
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
  background: var(--pgc-surface);
  color: var(--pgc-ink);
  border: 1px solid var(--pgc-border);
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
/* :focus, not :focus-visible — a text field that gives no signal when you
   click into it reads as broken, and the ring is expected there.
   The :not(:disabled) is carrying specificity, not logic (a disabled field
   cannot be focused anyway): the hover rule above is .pg-input:hover:not(...)
   at 0-3-0, so a bare .pg-input:focus at 0-2-0 would lose to it and a focused
   field would show the *hover* border while the pointer sat on it. Every
   state rule below is padded the same way for the same reason.
   NB: no backticks anywhere inside this string — it is a template literal,
   and one in a comment ends the CSS mid-file with a build error that points
   at the wrong line. */
.pg-input:focus:not(:disabled),
.pg-select:focus:not(:disabled),
.pg-textarea:focus:not(:disabled) {
  outline: none;
  border-color: var(--pgc-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pgc-accent) 26%, transparent);
}
.pg-input:disabled,
.pg-select:disabled,
.pg-textarea:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: color-mix(in srgb, var(--pgc-ink) 6%, var(--pgc-surface));
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

/* Icon-prefixed field. The wrapper carries the focus ring so the icon sits
   inside the highlighted box instead of next to it. */
.pg-input-wrap { position: relative; display: flex; align-items: center; }
.pg-input-wrap .pg-input { padding-left: 36px; }
.pg-input-wrap__icon {
  position: absolute;
  left: 12px;
  display: inline-flex;
  color: var(--pgc-muted);
  pointer-events: none;
}

/* ------------------------------------------------------------------ *
 * Cards
 * ------------------------------------------------------------------ */
.pg-card {
  display: flex;
  flex-direction: column;
  background: var(--pgc-surface);
  color: var(--pgc-ink);
  border: 1px solid var(--pgc-border);
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
   keyboard ring the buttons do rather than a hover-only affordance. */
.pg-card--interactive { cursor: pointer; text-align: left; text-decoration: none; }
.pg-card--interactive:hover { border-color: var(--pgc-accent); box-shadow: var(--pgc-shadow-lift); transform: translateY(-3px); }
.pg-card--interactive:focus { outline: none; }
.pg-card--interactive:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: 3px; }
.pg-card--interactive:active { transform: translateY(-1px); }

/* Media placeholder. A tint of the card's own text colour rather than a
   grey literal, so it re-tones with the experiment instead of staying the
   same slab of grey in every card on the board. */
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

/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */
.pg-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3, 16px);
  padding: var(--space-3, 12px) var(--space-4, 18px);
  border-radius: var(--pgc-radius);
  background: var(--pgc-surface);
  color: var(--pgc-ink);
  border: 1px solid var(--pgc-border);
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
.pg-navlink {
  position: relative;
  padding: 7px 11px;
  border-radius: var(--pgc-radius-sm);
  font-size: var(--text-sm, 14px);
  font-weight: 500;
  color: color-mix(in srgb, var(--pgc-ink) 72%, transparent);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color var(--pgc-t), background-color var(--pgc-t);
}
.pg-navlink:hover { color: var(--pgc-ink); background: color-mix(in srgb, var(--pgc-ink) 7%, transparent); }
.pg-navlink:focus { outline: none; }
.pg-navlink:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: 1px; }
.pg-navlink[aria-current="page"] { color: var(--pgc-accent); background: color-mix(in srgb, var(--pgc-accent) 12%, transparent); }

/* Tabs. The underline is a pseudo-element on the button so it tracks the
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
  color: var(--pgc-muted);
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
.pg-tab:hover { color: var(--pgc-ink); background: color-mix(in srgb, var(--pgc-ink) 5%, transparent); }
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
  color: var(--pgc-muted);
  text-decoration: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
  transition: color var(--pgc-t), background-color var(--pgc-t);
}
.pg-crumb:hover { color: var(--pgc-accent); background: color-mix(in srgb, var(--pgc-accent) 10%, transparent); }
.pg-crumb:focus { outline: none; }
.pg-crumb:focus-visible { outline: 2px solid var(--pgc-ring); outline-offset: 1px; }
.pg-crumb[aria-current="page"] { color: var(--pgc-ink); font-weight: 600; cursor: default; }
.pg-crumb[aria-current="page"]:hover { background: transparent; color: var(--pgc-ink); }

/* ------------------------------------------------------------------ *
 * Feedback
 * ------------------------------------------------------------------ */
.pg-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2, 10px);
  padding: var(--space-3, 13px) var(--space-3, 14px);
  border-radius: var(--pgc-radius);
  border: 1px solid var(--pgc-tone-border);
  background: var(--pgc-tone-bg);
  color: var(--pgc-ink);
  font-size: var(--text-sm, 14px);
  line-height: 1.55;
}
/* One rule, four tones: each modifier only rebinds --pgc-tone, and the
   surface/border/icon colours are derived from it. Adding a fifth tone is
   one three-line block, not another copy of the alert. */
.pg-alert--info { --pgc-tone: var(--pgc-info); }
.pg-alert--success { --pgc-tone: var(--pgc-success); }
.pg-alert--warning { --pgc-tone: var(--pgc-warning); }
.pg-alert--error { --pgc-tone: var(--pgc-error); }
.pg-alert {
  --pgc-tone-bg: color-mix(in srgb, var(--pgc-tone) 12%, var(--pgc-surface));
  --pgc-tone-border: color-mix(in srgb, var(--pgc-tone) 42%, var(--pgc-surface));
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
  background: var(--pgc-accent);
  color: var(--pgc-on-accent);
  border: 1px solid var(--ds-badge-border, transparent);
}
/* The soft variants deliberately ignore --ds-badge-* : those tokens describe
   the *solid* badge, and reusing them here would make all five variants
   identical the moment an AI system is present. */
.pg-badge--soft { --pgc-tone: var(--pgc-accent); }
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
  color: var(--pgc-muted);
  border-color: var(--pgc-border);
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

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */
/* Checkbox and radio use the real <input> with appearance:none rather than
   a hidden input plus a styled span. The native element keeps the label
   association, the space-bar toggle, the focus ring and the :checked state
   for free — a div with role="checkbox" would have to reimplement all four. */
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
/* Tick drawn with a rotated border rather than an SVG child, because the
   input element cannot have children. */
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

/* Toggle. role="switch" on a real <button>, so Enter and Space both fire it
   and screen readers announce on/off without an aria-live hack. */
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
.pg-select { padding-right: 34px; cursor: pointer; }
.pg-select-wrap__chevron { position: absolute; right: 12px; display: inline-flex; color: var(--pgc-muted); pointer-events: none; }

/* Tooltip. Hover *and* focus-within, so it is reachable by keyboard — a
   hover-only tooltip is an accessibility failure, not a styling choice. */
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

/* Skeleton. The sweep is a gradient on a pseudo-element so the block keeps
   its own background and no extra DOM is needed per shimmer line. */
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

/* Modal — absolute inside .pg-stage, see the .pg-stage comment above. */
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
  background: var(--pgc-surface);
  color: var(--pgc-ink);
  border: 1px solid var(--pgc-border);
  box-shadow: var(--pgc-shadow-lift);
  animation: pg-modal-in 200ms cubic-bezier(0.2, 0.8, 0.3, 1);
}
@keyframes pg-modal-in { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
.pg-modal:focus { outline: none; }
.pg-modal__title { font-family: var(--pgc-font-heading); font-size: var(--text-lg, 18px); font-weight: 700; margin: 0; }
.pg-modal__text { font-size: var(--text-sm, 14px); line-height: 1.6; color: var(--pgc-muted); margin: 0; }
.pg-modal__actions { display: flex; justify-content: flex-end; gap: var(--space-2, 10px); margin-top: var(--space-2, 8px); }

/* Screen-reader-only. Needed for the live regions that announce the toggle,
   toast and progress changes; visually-hidden, never display:none, or
   assistive tech drops it. */
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
