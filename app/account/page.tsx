// Signed-in home base: profile, saved projects, favorites, accessibility.
// All real (no Clerk), backed by lib/auth/ and lib/db/schema.sql.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FavoritesSection } from "@/components/account/FavoritesSection";
import { AccessibilitySection } from "@/components/account/AccessibilitySection";
import { useAuthStore, useFavoritesStore } from "@/store";

function SignedOutPrompt() {
  return (
    <main id="main" className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
        <div className="w-full max-w-[380px] rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-8 text-center">
          <div className="font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#6E675C]">Account</div>
          <h1 className="mt-2 font-editorial-serif text-2xl font-normal text-[#211E18]">Sign in to see your account.</h1>
          <p className="mt-3 text-sm text-[#6E675C]">
            Save projects, favorite colors, fonts and themes — all tied to a
            simple username and password, no email required.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link href="/sign-in" className="rounded-full bg-[#222D52] py-2.5 text-sm font-semibold text-[#F2EBE0]">
              Sign in
            </Link>
            <Link href="/sign-up" className="rounded-full border border-black/20 py-2.5 text-sm font-medium text-[#211E18] hover:bg-black/[0.04]">
              Create account
            </Link>
          </div>
        </div>

        {/* Outside the sign-in gate on purpose: these prefs live in localStorage
            and need no account, and gating them would block the people who
            need larger text / reduced motion most. */}
        <div className="w-full">
          <AccessibilitySection />
        </div>
      </div>
    </main>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);
  const favoritesLoaded = useFavoritesStore((s) => s.loaded);
  const loadFavorites = useFavoritesStore((s) => s.load);

  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !favoritesLoaded) loadFavorites();
  }, [user, favoritesLoaded, loadFavorites]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : { projects: [] }))
      .then((data) => setProjectCount((data.projects ?? []).length))
      .catch(() => setProjectCount(null));
  }, [user]);

  async function handleSignOut() {
    await logout();
    router.push("/");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/auth/me", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't delete account");
      }
      await logout();
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete account");
      setDeleting(false);
    }
  }

  if (authStatus === "loading") {
    return <main id="main" className="min-h-[calc(100vh-56px)] bg-[#EDE6DA]" />;
  }

  if (!user) {
    return <SignedOutPrompt />;
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <main id="main" className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] px-6 py-10 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#6E675C]">Account · Vol. 01</div>
            <h1 className="mt-2 font-editorial-serif text-[34px] font-normal leading-[1.02] tracking-[-0.02em] text-[#211E18]">
              {user.username}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*:not(.sb-span-1)]:lg:col-span-2">
          <section className="sb-span-1 flex items-center justify-between gap-4 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
            <div>
              <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Profile</div>
              <p className="mt-1.5 text-sm text-[#6E675C]">Member since {memberSince}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-medium text-[#211E18] hover:bg-black/[0.04]"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sign out
            </button>
          </section>

          <section className="sb-span-1 flex items-center justify-between gap-4 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
            <div>
              <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Saved projects</div>
              <p className="mt-1.5 text-sm text-[#6E675C]">
                {projectCount === null ? "Loading…" : `${projectCount} project${projectCount === 1 ? "" : "s"} saved`}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#222D52] px-4 py-2 text-sm font-medium text-[#F2EBE0]"
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              Open dashboard
            </Link>
          </section>

          <FavoritesSection />

          <AccessibilitySection />

          <section className="rounded-2xl border border-[#B3261E]/30 bg-[#B3261E]/10 px-6 py-5">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h2 className="text-sm font-semibold text-[#B3261E]">Delete account</h2>
                <p className="mt-0.5 text-xs text-[#B3261E]/80">
                  Permanently deletes your account, saved projects, and favorites.
                </p>
              </div>
              {!confirmingDelete ? (
                <Button variant="destructive" size="sm" onClick={() => setConfirmingDelete(true)}>
                  Delete
                </Button>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="rounded-full bg-[#B3261E] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {deleting ? "Deleting…" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="text-xs font-medium text-[#B3261E]/70 hover:text-[#B3261E]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {deleteError && <p className="mt-3 text-xs text-[#B3261E]">{deleteError}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
