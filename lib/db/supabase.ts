/**
 * Supabase client factory.
 *
 * Two clients on purpose: `supabase` uses the anon key and is safe to
 * import in client components — RLS on the DB enforces access control.
 * `getSupabaseAdmin()` uses the service-role key and bypasses RLS entirely;
 * it must only ever be called from Server Components or API routes, never
 * from anything that ships to the browser.
 */
import { createClient } from "@supabase/supabase-js";

// Browser-safe client — uses the anon key, respects Row Level Security.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-only client — uses the service role key, bypasses RLS.
// Never import this into a client component.
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
