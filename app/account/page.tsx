/**
 * /account — account settings
 *
 * Owner: Amna
 *
 * v1 has no billing (see docs/PRODUCT_AND_UX.md — Stripe is explicitly
 * deferred). Auth (Clerk) was also removed (see CLAUDE.md), so the
 * profile section is a placeholder pending real sign-in — everything
 * below it (preferences) is real and functional, no auth required.
 *
 * Preferences (type-scale unit, export format, AI-generation email,
 * theme) have no dedicated API endpoint yet, so they persist to
 * localStorage for now. Theme itself is backed by lib/theme.ts, which is
 * real (toggling actually flips `.dark` on <html>) — though no other
 * page in the app has `dark:` variants yet, so it's currently a saved
 * preference more than a visible effect; the other three are UI-only
 * until a preferences endpoint exists.
 *
 * Styling adapted to the site's cream/ink/navy editorial system instead
 * of the separate glass/dark design system this was originally built
 * against, to stay visually consistent with Studio/browse/SiteHeader.
 */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { applyTheme, getStoredTheme, type ThemePreference } from "@/lib/theme";
import { Button } from "@/components/ui/Button";

const PREFS_KEY = "stylebook-prefs";

type Prefs = {
  typeScaleUnit: "px" | "rem";
  exportFormat: "css" | "tailwind" | "scss" | "json";
  notifyOnGenerate: boolean;
};

const DEFAULT_PREFS: Prefs = {
  typeScaleUnit: "px",
  exportFormat: "css",
  notifyOnGenerate: true,
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
              : "text-[#8A8477] hover:text-[#6E675C]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-[#22733F]" : "bg-black/[0.18]"}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        style={{ left: on ? "22px" : "2px" }}
      />
    </button>
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
        {description && <div className="mt-0.5 text-xs text-[#8A8477]">{description}</div>}
      </div>
      {children}
    </div>
  );
}

export default function AccountPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [themePref, setThemePref] = useState<ThemePreference>("system");
  const [savedPing, setSavedPing] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PREFS_KEY);
      if (stored) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
    } catch {
      // Corrupt/blocked storage — fall back to defaults silently.
    }
    setThemePref(getStoredTheme());
  }, []);

  function updatePrefs(next: Partial<Prefs>) {
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
      } catch {
        // TODO: once a preferences API exists, this is where the PATCH
        // call goes; localStorage failing shouldn't block the UI update.
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

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] px-6 py-10 sm:px-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#8A8477]">Account · Vol. 01</div>
            <h1 className="mt-2 font-editorial-serif text-[34px] font-normal leading-[1.02] tracking-[-0.02em] text-[#211E18]">
              Your account.
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

        <section className="mb-6 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
          <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Profile</div>
          <p className="mt-3 text-sm text-[#6E675C]">
            No sign-in yet — profile details will live here once the
            username/password login ships. Everything below (preferences)
            already works without an account.
          </p>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-black/[0.12] bg-[#F2EBE0] px-6">
          <h2 className="border-b border-black/[0.1] py-4 font-mono-plex text-xs font-semibold uppercase tracking-wider text-[#8A8477]">
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

            <PreferenceRow
              title="Default export format"
              description="Preselected on a project's Export menu."
            >
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

            <PreferenceRow
              title="Email me when AI generation finishes"
              description="Useful for longer, more detailed prompts."
            >
              <Toggle
                on={prefs.notifyOnGenerate}
                onToggle={() => updatePrefs({ notifyOnGenerate: !prefs.notifyOnGenerate })}
                label="Email me when AI generation finishes"
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

        <section className="mt-6 flex items-center justify-between gap-6 rounded-2xl border border-[#B3261E]/30 bg-[#B3261E]/10 px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold text-[#B3261E]">Delete account</h2>
            <p className="mt-0.5 text-xs text-[#B3261E]/80">
              No account to delete yet — comes with the username/password login.
            </p>
          </div>
          <Button variant="destructive" size="sm" disabled>
            Delete
          </Button>
        </section>
      </div>
    </main>
  );
}
