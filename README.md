# StyleBook AI

A design-system generator: browse a curated library of colours, fonts and
themes, build a system by hand in Studio, or describe a brand in plain
language and get a complete, accessibility-checked design system back,
editable live and exportable to nine code formats or straight into Figma.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in real keys
npm run dev
```

Open http://localhost:3000.

## Docs

- **`docs/TECHNICAL_ARCHITECTURE.md`** — stack, data model, folder structure,
  the token architecture, API contracts, database schema, env vars, deployment.
- **`docs/PRODUCT_AND_UX.md`** — feature list, the Preview Lab interaction
  spec, UI/UX design principles, and the landing page spec.

## Stack

Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Postgres),
Google Gemini for AI generation, Zustand for client state, Zod for
validation. Auth is self-hosted username/password (bcryptjs + jose), not a
third-party provider. See `CLAUDE.md` for the fuller project-context summary
this file used to duplicate.

## Status

Everything ships free right now, no billing, no plan gating. That's
deferred until there's real usage data to justify it.

## Scripts

```bash
npm run dev              # local dev server
npm test                 # vitest
npm run transform:colors # regenerate data/colors/tailwind.ts from the tailwindcss package
```

## Figma plugin

`figma-plugin/` is a separate codebase (its own `package.json`), published
and approved on the Figma Community. `npm run build` inside that folder
regenerates `figma-plugin/dist/`, which is what actually gets published,
re-publish from the Figma desktop app after rebuilding it.

## Deployment

Deploys to Vercel on push. Live at `style-book-ai.vercel.app` and
`stylebook.site`.
