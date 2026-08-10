/**
 * Shared sign-in/sign-up form — same fields either way (just username +
 * password, no email, no verification), so one component drives both
 * pages rather than duplicating the request/error/redirect logic.
 */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store";

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
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "sign-up";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${isSignUp ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }
      setUser(data.user);
      router.push(searchParams.get("from") ?? "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#EDE6DA] px-6 py-16">
      <div className="w-full max-w-[400px]">
        {reasonMessage && (
          <div className="mb-5 rounded-xl border border-black/[0.12] bg-[#F2EBE0] px-4 py-3 text-center text-sm text-[#6E675C]">
            {reasonMessage}
          </div>
        )}
        <div className="text-center">
          <div className="font-mono-plex text-[11px] uppercase tracking-[0.22em] text-[#8A8477]">
            {isSignUp ? "Create account" : "Sign in"}
          </div>
          <h1 className="mt-2 font-editorial-serif text-[32px] font-normal leading-[1.05] tracking-[-0.02em] text-[#211E18]">
            {isSignUp ? "Start your library." : "Welcome back."}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#8A8477]">Username</span>
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
            <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#8A8477]">Password</span>
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

          {error && <p className="text-xs text-[#B3261E]">{error}</p>}

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
      </div>
    </main>
  );
}
