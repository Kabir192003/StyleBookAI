// Shared sign-in/sign-up form — same fields either way (username +
// password, no email, no verification), so one component drives both
// pages instead of duplicating the request/error/redirect logic.
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store";

/** `code` values from lib/auth/authFailure.ts that mean "our fault, not yours". */
const SERVER_FAULT_CODES = new Set(["config_missing", "db_unreachable", "db_schema", "db_error", "unknown"]);

const REASON_MESSAGES: Record<string, string> = {
  favorites: "Sign in to save favorites and sync your library.",
  "save-project": "Sign in to save your project and pick up where you left off.",
  "session-expired": "Your session expired. Sign in again to keep going.",
};

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const reason = searchParams.get("reason");
  const reasonMessage = reason ? REASON_MESSAGES[reason] : null;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Server-side faults (missing env var, unreachable database) are shown
  // differently from "wrong password": repeated "unable to register"
  // reports came from a deployment fault that the form presented as if the
  // person had typed something wrong, so they kept retyping. When the API
  // says the failure is its own, say so plainly. See lib/auth/authFailure.ts.
  const [isServerFault, setIsServerFault] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "sign-up";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsServerFault(false);

    const trimmedUsername = username.trim();

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${isSignUp ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });
      // A gateway timeout or a crashed function returns HTML, not JSON —
      // parsing it used to throw and be reported as the useless
      // "Something went wrong", hiding the status code entirely.
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setIsServerFault(SERVER_FAULT_CODES.has(data?.code) || res.status >= 500);
        throw new Error(data?.error ?? `The server returned an error (${res.status}). Please try again.`);
      }
      setUser(data.user);
      router.push(searchParams.get("from") ?? "/dashboard");
    } catch (err) {
      // A thrown TypeError here means the request never completed at all
      // (offline, DNS, blocked) — distinct from the server answering badly.
      if (err instanceof TypeError) {
        setIsServerFault(true);
        setError("Couldn't reach the server. Check your connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main" className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#EDE6DA] px-6 py-16">
      <div className="w-full max-w-[400px]">
        {reasonMessage && (
          <div className="mb-5 rounded-xl border border-black/[0.12] bg-[#F2EBE0] px-4 py-3 text-center text-sm text-[#6E675C]">
            {reasonMessage}
          </div>
        )}
        <div className="text-center">
          <div className="font-mono-plex text-[11px] uppercase tracking-[0.22em] text-[#6E675C]">
            {isSignUp ? "Create account" : "Sign in"}
          </div>
          <h1 className="mt-2 font-editorial-serif text-[32px] font-normal leading-[1.05] tracking-[-0.02em] text-[#211E18]">
            {isSignUp ? "Start your library." : "Welcome back."}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="rounded-lg border border-black/20 bg-white px-[13px] py-[11px] text-sm text-[#211E18] outline-none focus:border-[#222D52]"
              placeholder="e.g. northwind"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              className="rounded-lg border border-black/20 bg-white px-[13px] py-[11px] text-sm text-[#211E18] outline-none focus:border-[#222D52]"
              placeholder={isSignUp ? "Choose a password" : "••••••••"}
            />
          </label>

          {error && (
            <div
              role="alert"
              className={
                isServerFault
                  ? "rounded-lg border border-[#B3261E]/30 bg-[#B3261E]/[0.06] px-3 py-2.5"
                  : undefined
              }
            >
              <p className="text-xs text-[#B3261E]">{error}</p>
              {isServerFault && (
                <p className="mt-1 text-[11px] leading-relaxed text-[#6E675C]">
                  This one is on us, not on you — retyping won&apos;t help. If it keeps happening, whoever runs
                  this site can check <span className="font-mono-plex">/api/auth/health</span> for the exact
                  cause.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-full bg-[#222D52] py-3 text-sm font-semibold text-[#F2EBE0] transition-opacity disabled:opacity-50"
          >
            {loading ? "One sec…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6E675C]">
          {isSignUp ? "Already have an account? " : "New here? "}
          <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-semibold text-[#222D52] hover:underline">
            {isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>

        {isSignUp && (
          <p className="mt-4 text-center text-[11px] leading-relaxed text-[#6E675C]">
            By creating an account, you agree to StyleBook&rsquo;s{" "}
            <Link href="/terms" className="underline decoration-[#6E675C]/40 underline-offset-2 hover:decoration-[#6E675C]">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline decoration-[#6E675C]/40 underline-offset-2 hover:decoration-[#6E675C]">
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
