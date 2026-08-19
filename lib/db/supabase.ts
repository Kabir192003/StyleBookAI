// Supabase client factory. Two clients on purpose: getSupabaseBrowserClient()
// uses the anon key and is safe in client components (RLS enforces access);
// getSupabaseAdmin() uses the service-role key and bypasses RLS entirely, so
// it must only ever be called from Server Components or API routes.
// Both go through requireEnv() instead of a `!` assertion — a missing env var
// used to throw a generic "supabaseUrl is required" with no fix, surfacing to
// users as a plain 500. ConfigError carries the variable name so
// classifyAuthFailure() can tell the user which setting is actually absent.
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
// `global.fetch` is forced to `cache: "no-store"` because supabase-js calls
// the plain global `fetch()`, which Next.js patches into its own Data Cache —
// so a GET through this client could come back from Next's cache instead of
// hitting Postgres, even on a route marked `force-dynamic`. Caught concretely
// by /api/figma-export/[code]: a one-shot redemption endpoint served an
// already-deleted row's payload on a second identical request, even though
// the delete itself had run. An admin client reading live state should never
// be cache-eligible, so it's fixed here at the factory rather than per-route.
export function getSupabaseAdmin(): SupabaseClient {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
