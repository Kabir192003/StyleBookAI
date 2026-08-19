// Turns a thrown error or a Supabase error into (a) a server log that names
// the real cause and (b) a user-facing message that's actually actionable.
// Exists because a config fault (missing env var, bad service-role key, no
// users table) previously surfaced as "Incorrect username or password" —
// looking exactly like something the user typed wrong. Messages name the
// *class* of fault ("the account database", "server auth configuration")
// without leaking connection strings or keys.

/** Machine-readable cause, echoed to the client so QA can quote it. */
export type AuthFailureCode =
  | "config_missing" // an env var the server needs is absent (AUTH_SECRET, service-role key…)
  | "db_unreachable" // network/DNS/timeout talking to Supabase
  | "db_schema" // reached the DB, but the users table/columns aren't what we expect
  | "db_error" // reached the DB, it said no for some other reason
  | "unknown";

export type AuthFailure = {
  code: AuthFailureCode;
  message: string;
  status: number;
};

/** Marker for "this server is misconfigured", thrown by config accessors. */
export class ConfigError extends Error {
  readonly envVar: string;
  constructor(envVar: string, message: string) {
    super(message);
    this.name = "ConfigError";
    this.envVar = envVar;
  }
}

/** Shape of the error object Supabase's PostgREST client hands back. */
type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

function isSupabaseError(value: unknown): value is SupabaseLikeError {
  return typeof value === "object" && value !== null && "message" in value;
}

// PostgREST codes for "you queried something that doesn't exist" — every one
// means the migration in lib/db/schema.sql was never applied to this database.
const SCHEMA_ERROR_CODES = new Set(["42P01", "42703", "PGRST205", "PGRST204"]);

export function classifyAuthFailure(cause: unknown): AuthFailure {
  if (cause instanceof ConfigError) {
    return {
      code: "config_missing",
      message:
        `The server is missing its ${cause.envVar} setting, so accounts can't be created or signed into. ` +
        `This is a deployment configuration problem, not something you typed wrong.`,
      status: 503,
    };
  }

  if (isSupabaseError(cause)) {
    const code = cause.code ?? "";
    if (SCHEMA_ERROR_CODES.has(code)) {
      return {
        code: "db_schema",
        message:
          "The account database hasn't been set up on this deployment yet (the users table is missing). " +
          "This is a server-side setup problem — nothing you typed is wrong.",
        status: 503,
      };
    }
    // supabase-js surfaces fetch failures as a TypeError wrapped into an
    // error whose message is a bare "fetch failed" / "network" string.
    if (/fetch failed|network|ENOTFOUND|ECONNREFUSED|timeout/i.test(cause.message ?? "")) {
      return {
        code: "db_unreachable",
        message:
          "The server couldn't reach the account database. It may be paused or unreachable — try again in a moment.",
        status: 503,
      };
    }
    return {
      code: "db_error",
      message: "The account database rejected the request. This is a server-side problem, not your details.",
      status: 500,
    };
  }

  if (cause instanceof Error && /fetch failed|ENOTFOUND|ECONNREFUSED|timeout/i.test(cause.message)) {
    return {
      code: "db_unreachable",
      message:
        "The server couldn't reach the account database. It may be paused or unreachable — try again in a moment.",
      status: 503,
    };
  }

  return {
    code: "unknown",
    message: "Something broke on the server while handling your account. This isn't a problem with what you typed.",
    status: 500,
  };
}

// One greppable log line — fixed `[auth]` prefix so it's findable among
// Next.js's own console noise in Vercel's runtime logs.
export function logAuthFailure(operation: string, failure: AuthFailure, cause: unknown) {
  const detail = isSupabaseError(cause)
    ? { supabaseCode: cause.code, message: cause.message, details: cause.details, hint: cause.hint }
    : cause instanceof Error
      ? { name: cause.name, message: cause.message }
      : { value: String(cause) };

  console.error(`[auth] ${operation} failed (${failure.code}):`, JSON.stringify(detail));
}
