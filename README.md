# StyleBook AI

A design system generator. Browse a curated library of colours, fonts and
complete themes, build a system by hand in Studio, or describe a brand in
plain language and let the AI generate a full, accessibility checked design
system for you. Every result is editable live, verified for real contrast
before you ever see it, and exportable to nine code formats or straight into
Figma as genuinely editable components.

## What it does

**Browse** a library of 1,922 colours, 1,933 fonts and 90 curated themes
across 12 categories. Every colour and font carries real, hand written
editorial notes, not filler text.

**Studio** is the manual builder. Assemble a design system by hand: pick a
five colour palette, a heading and body font pairing, a type scale, spacing
and corner radius, then click any of 10 editable components (buttons,
inputs, cards, navigation, tables, modals, alerts, badges and more) to tune
it directly on a realistic live preview, not a sheet of isolated component
swatches. Every component supports hover, active, focus and disabled
states, and a dark variant is derived automatically from the light one.

**AI Generate** turns a plain language brand description into a complete
design system: palette, font pairing, type scale, and a realistic mock page
built from the result, all in seconds. The AI only ever picks from the real
colour and font library, it can never invent a hex code or a font that
doesn't exist. Every colour pair the AI proposes is independently measured
against WCAG contrast thresholds by deterministic code, not asserted by the
model, and automatically repaired if it fails before you ever see it.

**Preview Lab** is a drag and drop canvas for testing colour and font
pairings side by side before committing to them in Studio, with a live
WCAG contrast readout per pairing.

**Export** any project as CSS custom properties, a Tailwind config, W3C
design tokens, SwiftUI, Flutter, React, JSON, a Tokens Studio file for
Figma, or a full PDF style guide, nine formats total, all generated from
one shared, normalised token representation so they can never disagree
with each other. A published Figma plugin (approved on the Figma
Community) also imports a project straight into Figma as real, editable
components and variables, not a static file you have to rebuild by hand.

**Accounts** are real username and password, self hosted, not a third
party identity provider. No email address is required, no analytics run,
and account deletion is immediate and self service. Saved projects and
favourites are scoped to your own account.

**Accessibility** is not a bolt on. Contrast checking runs on every AI
generated colour pair automatically, and a set of opt in accessibility
preferences (high contrast, larger text, always underlined links, reduced
transparency, reduced motion) sit alongside the baseline accessibility
(labels, keyboard navigation, focus order, screen reader support) that
ships on for everyone regardless of preference.

## Tech stack

- **Framework:** Next.js 14 (App Router), TypeScript throughout
- **Styling:** Tailwind CSS for the app's own interface; generated design
  systems are plain CSS custom properties, framework neutral
- **Database:** Supabase (hosted PostgreSQL), four tables covering users,
  projects, favourites and short lived Figma export codes
- **AI:** Google Gemini for design system generation
- **State:** Zustand for client state
- **Validation:** Zod at every data boundary
- **Auth:** Self hosted username and password (bcryptjs for hashing, jose
  for signed JWT session cookies), no third party identity provider
- **Colour maths:** chroma-js and colord
- **Animation:** Framer Motion, with GSAP and Lenis on the landing page
- **Drag and drop:** dnd-kit (Preview Lab)
- **PDF export:** html-to-image plus jsPDF, loaded only when actually used
- **Testing:** Vitest
- **Deployment:** Vercel

## Project structure

```
app/          Next.js routes (pages and API endpoints)
components/   UI, grouped one feature per folder
lib/          Pure logic, no React, unit testable on its own
types/        Shared TypeScript types imported across the app
data/         Static colour, font and theme catalogues
figma-plugin/ Separate codebase for the published Figma plugin
docs/         Technical architecture and product/UX specs
```

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in real keys
npm run dev
```

Open http://localhost:3000.

Run the colour transform script once after install to populate the full
Tailwind colour set:

```bash
npm run transform:colors
```

## Docs

- `docs/TECHNICAL_ARCHITECTURE.md`, stack, data model, folder structure,
  the token architecture, API contracts, database schema, env vars,
  deployment
- `docs/PRODUCT_AND_UX.md`, feature list, the Preview Lab interaction
  spec, UI/UX design principles, and the landing page spec

## Status

Everything ships free right now. No billing, no plan gating, that is
deferred until there is real usage data to justify which features to
lock.

## Scripts

```bash
npm run dev               # local dev server
npm test                  # run the test suite (Vitest)
npm run build              # production build
npm run transform:colors   # regenerate data/colors/tailwind.ts
```

## Figma plugin

`figma-plugin/` is a separate codebase with its own `package.json`,
published and approved on the Figma Community. Run `npm run build` inside
that folder to regenerate `figma-plugin/dist/`, which is what actually
gets published, then re-publish from the Figma desktop app after
rebuilding.

## Deployment

Deploys to Vercel automatically on push to main. Live at
[stylebook.site](https://stylebook.site), with
`style-book-ai.vercel.app` as a fallback.
