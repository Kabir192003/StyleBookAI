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

// AUTH_SECRET is only touched on the success path of signup/login — a wrong
// password never reaches it — so a missing value is invisible to any
// read-only check of the deployed site. Throws ConfigError so the route
// handler can name it to the user instead of an anonymous 500 (lib/auth/authFailure.ts).
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
    // An expired or tampered token is routine and stays quiet. A missing
    // AUTH_SECRET is not — it fails every session and presents as "I signed
    // in and it didn't stick" — so it's logged instead of swallowed silently.
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
    // `secure` tracks env rather than being hardcoded — a secure cookie is
    // dropped over plain http://localhost. sameSite "lax" (not "strict")
    // keeps the session attached when arriving via an external link. No
    // `domain` set — a host-only cookie is correct for both localhost and
    // *.vercel.app, where naming a domain would break preview deployments.
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
