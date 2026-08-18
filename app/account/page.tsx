/**
 * /account — the signed-in user's home base: profile, saved projects,
 * favorited colors/fonts/themes, and preferences. Everything here is
 * real — no Clerk, no placeholders — backed by the simple username/
 * password system in lib/auth/ and the favorites/projects tables in
 * lib/db/schema.sql.
 *
 * Signed-out visitors get a plain sign-in prompt instead of an empty
 * shell — there's nothing useful to show without an account.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, LogOut } from "lucide-react";
import { applyTheme, getStoredTheme, type ThemePreference } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { FavoritesSection } from "@/components/account/FavoritesSection";
import { AccessibilitySection } from "@/components/account/AccessibilitySection";
import { useAuthStore, useFavoritesStore } from "@/store";

const PREFS_KEY = "stylebook-prefs";

type Prefs = {
  typeScaleUnit: "px" | "rem";
  exportFormat: "css" | "tailwind" | "scss" | "json";
};

const DEFAULT_PREFS: Prefs = {
  typeScaleUnit: "px",
  exportFormat: "css",
};

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-black/[0.14] bg-[#EDE6DA] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-white text-[#211E18] shadow-[0_1px_3px_rgba(24,28,45,0.12)]"
              : "text-[#6E675C] hover:text-[#6E675C]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <div className="text-sm font-medium text-[#211E18]">{title}</div>
        {description && <div className="mt-0.5 text-xs text-[#6E675C]">{description}</div>}
      </div>
      {children}
    </div>
  );
}

function SignedOutPrompt() {
  return (
    <main id="main" className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
        <div className="w-full max-w-[380px] rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-8 text-center">
          <div className="font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#6E675C]">Account</div>
          <h1 className="mt-2 font-editorial-serif text-2xl font-normal text-[#211E18]">Sign in to see your account.</h1>
          <p className="mt-3 text-sm text-[#6E675C]">
            Save projects, favorite colors, fonts and themes, and set your
            defaults — all tied to a simple username and password, no email
            required.
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

        {/* Deliberately outside the sign-in gate. These preferences live in
            localStorage and need no account, and requiring someone to create
            one before they can turn on larger text or reduce motion would put
            the barrier in front of exactly the people the settings exist
            for. */}
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

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [themePref, setThemePref] = useState<ThemePreference>("system");
  const [savedPing, setSavedPing] = useState(false);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PREFS_KEY);
      if (stored) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
    } catch {
      // Corrupt/blocked storage — fall back to defaults silently.
    }
    setThemePref(getStoredTheme());
  }, []);

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

  function updatePrefs(next: Partial<Prefs>) {
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
      } catch {
        // Storage can fail (private mode, quota) — UI still updates.
      }
      return merged;
    });
    pingSaved();
  }

  function updateTheme(next: ThemePreference) {
    setThemePref(next);
    applyTheme(next);
    pingSaved();
  }

  function pingSaved() {
    setSavedPing(true);
    setTimeout(() => setSavedPing(false), 1400);
  }

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
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#6E675C]">Account · Vol. 01</div>
            <h1 className="mt-2 font-editorial-serif text-[34px] font-normal leading-[1.02] tracking-[-0.02em] text-[#211E18]">
              {user.username}
            </h1>
          </div>
          <AnimatePresence>
            {savedPing && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium text-[#22733F]"
              >
                Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-6">
          <section className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
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

          <section className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
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

          <section className="relative overflow-hidden rounded-2xl border border-black/[0.12] bg-[#F2EBE0] px-6">
            <h2 className="border-b border-black/[0.1] py-4 font-mono-plex text-xs font-semibold uppercase tracking-wider text-[#6E675C]">
              Preferences
            </h2>

            <div className="divide-y divide-black/[0.1]">
              <PreferenceRow
                title="Default type-scale unit"
                description="Used when Studio displays or exports a project's type scale."
              >
                <SegmentedControl
                  value={prefs.typeScaleUnit}
                  options={[
                    { label: "px", value: "px" },
                    { label: "rem", value: "rem" },
                  ]}
                  onChange={(v) => updatePrefs({ typeScaleUnit: v })}
                />
              </PreferenceRow>

              <PreferenceRow title="Default export format" description="Preselected on a project's Export menu.">
                <SegmentedControl
                  value={prefs.exportFormat}
                  options={[
                    { label: "CSS", value: "css" },
                    { label: "Tailwind", value: "tailwind" },
                    { label: "SCSS", value: "scss" },
                    { label: "JSON", value: "json" },
                  ]}
                  onChange={(v) => updatePrefs({ exportFormat: v })}
                />
              </PreferenceRow>

              <PreferenceRow title="Theme" description="Saved as a preference — no page in the app reacts to it yet.">
                <SegmentedControl
                  value={themePref}
                  options={[
                    { label: "Light", value: "light" },
                    { label: "Dark", value: "dark" },
                    { label: "System", value: "system" },
                  ]}
                  onChange={updateTheme}
                />
              </PreferenceRow>
            </div>
          </section>

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
