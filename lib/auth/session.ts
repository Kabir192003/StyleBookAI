/**
 * Session tokens — a signed JWT (jose, Edge-compatible) carrying just the
 * user id, stored in an httpOnly cookie. No session table: the JWT's
 * signature is the source of truth, so "log out everywhere" isn't
 * possible yet (would need a revocation list) — acceptable for a v1
 * username/password system with no sensitive data at stake.
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ConfigError } from "./authFailure";

const COOKIE_NAME = "stylebook_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * AUTH_SECRET is the one env var that is *only* touched on the success path
 * of signing up or signing in — a login with a wrong password never reaches
 * it. That made it invisible to every read-only check of the deployed site
 * and a leading suspect for "sign-up works locally, 500s in production".
 * It now throws a ConfigError so the route handler can name it to the user
 * instead of returning an anonymous 500. See lib/auth/authFailure.ts.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new ConfigError(
      "AUTH_SECRET",
      "AUTH_SECRET is not set, so session cookies can't be signed. Generate one with " +
        "`openssl rand -base64 32` and set it in .env.local locally / in Vercel's environment " +
        "variables for the deployed site — see .env.local.example."
    );
  }
  return new TextEncoder().encode(secret);
}

/** True when AUTH_SECRET is present. Used by the auth health check. */
export function isSessionSigningConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch (cause) {
    // An expired or tampered token is routine — stay quiet about those. A
    // missing AUTH_SECRET is not: it makes *every* session fail to verify,
    // which presents to the user as "I signed in and it didn't stick." That
    // symptom was previously indistinguishable from a bad cookie because
    // this catch swallowed the config error whole.
    if (cause instanceof ConfigError) {
      console.error(`[auth] session verification impossible: ${cause.message}`);
    }
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    // `secure` must track the environment rather than being hardcoded: a
    // `secure` cookie is dropped by the browser over plain http://localhost,
    // and a non-secure one is what you want in dev. Vercel serves over HTTPS
    // with NODE_ENV=production, so this evaluates to true there. sameSite
    // "lax" (not "strict") keeps the session attached when the user arrives
    // via an external link, and no `domain` is set on purpose — a host-only
    // cookie is correct for both localhost and *.vercel.app, whereas naming
    // a domain would break on preview deployments' generated hostnames.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
