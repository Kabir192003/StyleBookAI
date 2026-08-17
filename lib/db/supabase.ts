/**
 * Supabase client factory.
 *
 * Two clients on purpose: `getSupabaseBrowserClient()` uses the anon key and
 * is safe to call in client components — RLS on the DB enforces access
 * control. `getSupabaseAdmin()` uses the service-role key and bypasses RLS
 * entirely; it must only ever be called from Server Components or API
 * routes, never from anything that ships to the browser.
 *
 * Both go through `requireEnv()` rather than the `!` non-null assertion this
 * file used to carry. `createClient(undefined!, …)` throws "supabaseUrl is
 * required" — a message that names no environment variable, no deployment,
 * and no fix, and which surfaced to users as a generic 500. Since sign-up
 * failing on the deployed site was reported three times while working
 * locally, a missing env var was a prime suspect and had to stop being
 * indistinguishable from every other fault. ConfigError carries the variable
 * name so `classifyAuthFailure()` can tell the user (and the logs) exactly
 * which setting is absent.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ConfigError } from "@/lib/auth/authFailure";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ConfigError(
      name,
      `${name} is not set in this environment. Add it to .env.local locally, or to the project's ` +
        `environment variables in Vercel and redeploy — see .env.local.example.`
    );
  }
  return value;
}

// Browser-safe client — uses the anon key, respects Row Level Security.
// Built lazily rather than at module scope: this module is imported by every
// auth/projects/favorites API route, and a module-scope createClient() call
// throws during *import* if the URL is unset, taking down routes that never
// wanted the browser client in the first place.
let browserClient: SupabaseClient | null = null;
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    );
  }
  return browserClient;
}

// Server-only client — uses the service role key, bypasses RLS.
// Never import this into a client component.
//
// `global.fetch` is overridden with `cache: "no-store"` because supabase-js
// calls the plain global `fetch()` under the hood, which Next.js patches to
// participate in its own Data Cache — a GET request issued through this
// client can otherwise come back from Next's cache instead of hitting
// Postgres, even in a route marked `dynamic = "force-dynamic"`. Confirmed
// concretely by /api/figma-export/[code]: a one-shot redemption endpoint
// (select row, delete it, return it) served the same deleted row's payload
// on a second identical request — the delete itself demonstrably ran
// (verified directly against Supabase, outside Next entirely), so the only
// explanation left was the *read* being answered from cache. An admin
// client reading live application state should never be cache-eligible
// regardless of which route calls it, so this is fixed at the client
// factory rather than per-route.
export function getSupabaseAdmin(): SupabaseClient {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
