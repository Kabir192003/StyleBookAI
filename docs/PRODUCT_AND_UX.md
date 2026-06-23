# StyleBook AI — Product, Features & UX

## 1. Positioning

A single home for colors, fonts, and complete design themes — browse a
curated library, or describe a brand in plain language and let AI generate
a matching palette, font pairing, and type scale. Everything below ships
free in v1; there is no paywall and no plan logic anywhere in the app.

## 2. Feature list (v1 — all free)

**Browse libraries** — three browsable collections:
- *Colors*: grid of swatches, filter by family/mood/style/collection,
  search by name or hex, detail view per color with RGB/HSL values and a
  contrast/accessibility note against white and black.
- *Fonts*: grid of font cards rendered in their own typeface, filter by
  category (serif/sans/display/mono/handwriting)/mood/use-case, adjustable
  live preview text, suggested pairings.
- *Themes*: curated gallery combining colors + fonts + type scale into a
  cohesive look, filterable by category (minimal/bold/luxury/playful/
  earthy/tech/elegant/retro/neon/coastal/editorial/brutalist), each with a
  detail page showing a small live mockup (card, button, heading, body
  text) so the theme is judged in context, not as a swatch list.

**Palette & Font Preview Lab** (`/studio/compare`) — the centerpiece
interaction. Full spec in §3.

**Studio (manual builder)** — assemble a project by hand: pick colors and
assign roles (primary/secondary/accent/background/surface/text/text-muted),
pick a heading font and body font, adjust the type scale (base size + ratio,
with named ratios like "Golden Ratio," "Perfect Fourth," etc.), see it all
rendered live. The Preview Lab is embedded inside this flow.

**AI Generate** (`/studio/ai`) — text box: describe your brand, audience,
mood. Claude returns a full palette + font pairing + type scale, plus a
written reasoning panel explaining *why* each choice was made (this
reasoning is a key trust-building UI element — show it prominently, not
collapsed). User can regenerate with feedback ("more muted," "less
corporate") rather than starting over.

**Projects & accounts** — sign in, save unlimited projects, dashboard lists
them with thumbnails, click in to keep editing.

**Export** — from any project: copy CSS variables, copy a Tailwind config
snippet, download SCSS, download JSON, or generate a branded PDF style
guide (logo-less, just the palette/type system laid out cleanly).

## 3. Palette & Font Preview Lab — interaction spec

This is the feature that makes the app feel alive rather than like a static
swatch book. Three connected views, switchable via tabs within the same
canvas:

1. **Side-by-side swatches** — drag colors into a row (use `@dnd-kit` for
   reordering). Each pair of adjacent swatches shows a small contrast badge
   (WCAG AA/AAA pass/fail) so the user immediately sees which combinations
   are readable.
2. **Mood mockup** — the same selected colors get applied to a small fixed
   layout (a card with a heading, a paragraph, a button, an input field) so
   colors are judged the way they'll actually be used — as backgrounds,
   text, and accents — not as isolated chips.
3. **Font-on-color** — pick a heading font and a body font, and they render
   directly on top of the mockup from step 2, in real type sizes, on the
   real background color. This is where "do this color and this font
   actually go together" gets answered visually, which no swatch grid can
   do on its own.

State for the Lab lives in a dedicated Zustand store (`previewLabStore`) so
selections persist as the user flips between the three views, and a "Send
to Studio" action carries the current selection into a new or existing
project.

## 4. Design principles for the app's own UI

The app is a design tool, so its own interface is the first proof point of
whether its recommendations are any good — dogfood the type scale and
color system on the app itself rather than defaulting to generic Tailwind
grays. Specifically:

- Generous whitespace, a restrained neutral palette for UI chrome (so
  product colors — the swatches themselves — are what pops), and one
  accent color used sparingly for primary actions.
- Type hierarchy should visibly follow a named scale (see `lib/typeScale`),
  not ad hoc Tailwind text sizes.
- Light and dark mode both need to work well, since colors read differently
  against each — this directly exercises the contrast-checking logic the
  product itself is built around.
- Micro-interactions (hover states on swatches, smooth transitions when
  filters change, drag feedback in the Lab) via Framer Motion — subtle
  everywhere except the landing page, where it's intentionally the opposite.

## 5. Scroll-driven landing page (`/`)

Decided direction: **horizontal-scroll sections** stitched into an
otherwise normal vertical scroll — sections "pin" in place while their
content slides sideways as the user scrolls down, then release into the
next normal section. This is the standard "scroll-jacking" pattern (Apple
product pages, Stripe's older marketing pages) implemented with Framer
Motion's `useScroll` + `useTransform`, not a separate scroll library.

### Section-by-section spec

1. **Hero (normal vertical scroll)** — large headline ("Color, type, and
   theme — in one place" or similar), subhead, two CTAs ("Browse the
   library" → `/browse/colors`, "Try AI generation" → `/studio/ai`).
   Background: a slow, continuous color/gradient drift (animate a CSS
   custom property driving a gradient, looping, independent of scroll) to
   establish the "this is a color tool" feeling immediately.

2. **Horizontal section — "Browse anything"** — a tall pinned container
   (`position: sticky` inside a tall wrapper, or a Framer Motion scroll-
   linked transform) where a row of theme/color/font cards translates
   horizontally as the user scrolls down through this section's vertical
   range. Demonstrates the breadth of the library without needing real
   navigation.

3. **Horizontal section — "See it together"** — same pinned mechanic, this
   time showing Preview Lab snapshots sliding by: a color pair with a
   contrast badge, then a font rendered on a background, then a small
   mockup card — visually teaching what the Preview Lab does before the
   user ever clicks into it.

4. **Horizontal section — "Describe it, get a system"** — sliding cards
   showing example prompts ("a calm wellness app," "a bold streetwear
   brand") each paired with the palette/font/type-scale result Claude
   would generate, plus a one-line excerpt of the reasoning text.

5. **Closing (normal vertical scroll)** — a final CTA repeating the two
   hero actions, and a simple footer.

### Implementation notes for whoever builds this

- Build each horizontal section as its own component in
  `components/landing/` (`HorizontalScrollSection.tsx` reused with
  different content props, plus `HeroSection.tsx`).
- Use `useScroll({ target: sectionRef })` scoped to each section's own ref,
  not the whole page, so progress calculations stay simple — map vertical
  scroll progress (0→1) within that section to an `x` transform on the
  inner row.
- Respect `prefers-reduced-motion`: fall back to a normal vertical layout
  (cards stacked, no pinning) for users who've set that preference —
  accessibility matters even on a marketing page.
- Keep total scroll-jacked sections to three. More than that and the page
  stops feeling intentional and starts feeling gimmicky — three is the
  "crazy in a good way" ceiling, not a minimum to hit.
- This page is pure presentation — it should pull real `Color`/`Theme`
  sample data from `data/` rather than hardcoding hex values, so it stays
  accurate as the library grows.

Build this after the core browse/Lab/Studio pages exist (see the build
order in the project README), since its content references real product
surfaces.

## 6. The "why" behind every color and font — the core differentiator

This is the single feature that separates the app from a plain swatch
book, and it exists in two distinct forms. Don't conflate them — they're
different fields, written at different times, by different people.

**Evergreen per-item notes (manual/browse mode).** Every `Color` and every
`Font` now has a required `note: string` field (added to both types). It's
a short — one or two sentences — editorial line about that specific color
or font: what it evokes, where it tends to get used well, what to be
careful of. It ships with the item itself, written once during data entry,
and shows up identically everywhere that color or font appears (browse
grid, Preview Lab, Studio), behind a small **"i" info button** on the card.
Clicking or hovering it opens a popover with the note — don't make it a
full modal, it should feel lightweight, like a tooltip with a bit more
room to breathe. Visually, this note should read as polished copy, not a
dry spec sheet line — it's doing brand work for the whole app every time
someone sees it.

**Writing these notes is part of the categorization/segregation pass.**
Whoever tags a color's family/mood/style or a font's category/use-case
should write its `note` in the same sitting — they're already looking
closely at the item and deciding what it *is*; the note is deciding what it
*feels like*. No color or font ships without one; treat a missing `note` as
a blocking issue in PR review, the same as a missing `hex` value.

**AI-generated reasoning (AI Generate mode).** Separate from the above —
this is the `AIReasoning` object already defined on `Project`
(`palette`, `fonts`, `typeScale`, `overall`), produced fresh by Claude for
each generation, explaining *why these specific items were chosen together
for this specific prompt*. It's contextual and combinatorial, not
per-item — it can reference how colors relate to each other, not just what
one color is. Surface it prominently in the AI Generate result screen (not
collapsed behind an "i" button — this is the payoff moment of the AI
feature and should be visible by default), separately from the static
per-item notes that those same generated colors/fonts also carry if they're
pulled from the existing library.
