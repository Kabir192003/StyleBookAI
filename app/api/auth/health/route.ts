// Read-only check for whether this deployment can actually create/sign in
// accounts. Exists because sign-up/sign-in failures were hard to reproduce
// remotely without creating a real account — this exercises the same config
// (env vars set? users table reachable?) without touching real data. Reports
// presence only (booleans + a row count), never values.
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { isSessionSigningConfigured } from "@/lib/auth/session";
import { classifyAuthFailure, logAuthFailure } from "@/lib/auth/authFailure";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    AUTH_SECRET: isSessionSigningConfigured(),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  let usersTable: { ok: boolean; detail: string };
  try {
    // HEAD-style count proves schema.sql was applied to this database
    // without reading anybody's actual row.
    const admin = getSupabaseAdmin();
    const { count, error } = await admin.from("users").select("id", { count: "exact", head: true });
    if (error) throw error;
    usersTable = { ok: true, detail: `users table reachable (${count ?? 0} accounts)` };
  } catch (cause) {
    const failure = classifyAuthFailure(cause);
    logAuthFailure("health", failure, cause);
    usersTable = { ok: false, detail: `${failure.code}: ${failure.message}` };
  }

  const missingEnv = Object.entries(env)
    .filter(([, present]) => !present)
    .map(([name]) => name);

  const canSignUp = missingEnv.length === 0 && usersTable.ok;

  return NextResponse.json(
    {
      canSignUp,
      env,
      missingEnv,
      usersTable,
      remedy: canSignUp
        ? null
        : missingEnv.length > 0
          ? `Set ${missingEnv.join(", ")} in this deployment's environment variables and redeploy.`
          : "Apply lib/db/schema.sql to the database this deployment points at.",
    },
    { status: canSignUp ? 200 : 503 }
  );
}
