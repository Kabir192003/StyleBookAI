# StyleBook AI

## Getting started

This folder was scaffolded by hand (the build sandbox has no internet access,
so `npm install` couldn't be run here). Everything is in place — config,
types, folder structure, a starter colour dataset, and the transform script.
You just need to install dependencies on your own machine.

```bash
cd stylebook
npm install
cp .env.local.example .env.local   # then fill in real keys
npm run dev
```

Open http://localhost:3000 — you should see the placeholder landing page.

## Docs

Start with **`docs/TECHNICAL_ARCHITECTURE.md`** and **`docs/PRODUCT_AND_UX.md`**
for full context on status, stack, and build order:

- **`docs/TECHNICAL_ARCHITECTURE.md`** — stack, data model, folder structure,
  data pipeline, API contracts, database schema, env vars, deployment.
- **`docs/PRODUCT_AND_UX.md`** — finalized feature list, the Palette & Font
  Preview Lab interaction spec, UI/UX design principles, and the full
  scroll-driven landing page section-by-section spec.

**Status as of now: everything ships free.** No billing, no plan gating —
that's deferred until there's real usage data. Don't add Stripe back in
without it being asked for explicitly.

## Next steps, in order

1. **Run the colour transform script** once dependencies are installed:
   ```bash
   npm run transform:colors
   ```
   This overwrites `data/colors/tailwind.ts` with the full ~100-colour
   Tailwind palette pulled from the `tailwindcss` package. A small real
   sample is already in that file so the app isn't empty in the meantime.

2. **Create the Supabase project** and run `lib/db/schema.sql` in its SQL
   Editor, then fill in the Supabase keys in `.env.local`.

3. **Set up Clerk** for auth and fill in the Clerk keys.

4. **Build `/browse/colors`, `/browse/fonts`, `/browse/themes`** from the
   `data/` folder — no AI or DB needed yet.

5. **Build the Preview Lab** (`/studio/compare`) — see
   `docs/PRODUCT_AND_UX.md` §3 for the exact interaction spec.

6. **Build the Studio, then AI Generate, then Export** — see
   `docs/TECHNICAL_ARCHITECTURE.md` for the full ordered list.

7. **Build the scroll-driven landing page last** — full spec in
   `docs/PRODUCT_AND_UX.md` §5.

8. Push this to a GitHub repo and connect it to Vercel for deploys.
