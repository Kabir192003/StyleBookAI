/**
 * /account — basic account settings
 *
 * Owner: Amna
 *
 * v1 has no billing (see docs/PRODUCT_AND_UX.md — Stripe is explicitly
 * deferred), so this page is just profile info via Clerk's <UserProfile />
 * plus an account-level preferences section.
 *
 * Preferences below (type-scale unit, export format, AI-generation email,
 * theme) have no dedicated API endpoint yet, so they persist to
 * localStorage for now — see the TODO inline. Theme itself is backed by
 * lib/theme.ts, which is real (toggling actually flips the app to dark
 * mode); the other three are UI-only until a preferences endpoint exists.
 */
"use client";

import { useEffect, useState } from "react";
import { UserProfile } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { clerkAppearance } from "@/lib/clerkAppearance";
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
    <div className="inline-flex rounded-full border border-app-border bg-app-bg p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-app-surface text-app-text shadow-app-sm"
              : "text-app-text-muted hover:text-app-text-secondary"
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
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? "bg-app-success" : "bg-app-border-strong"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-pearl shadow"
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
        <div className="text-sm font-medium text-app-text">{title}</div>
        {description && <div className="mt-0.5 text-xs text-app-text-muted">{description}</div>}
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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-geometric-sans text-3xl font-bold tracking-tight text-app-heading">
          Account
        </h1>
        <AnimatePresence>
          {savedPing && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-medium text-app-success"
            >
              Saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <section className="relative mb-10">
        <div
          className="absolute -top-3 right-0 z-10 flex h-14 w-14 -rotate-6 items-center justify-center rounded-full border-2 border-app-success text-center font-mono text-[8px] font-bold uppercase leading-tight text-app-success"
          aria-hidden="true"
        >
          Member
          <br />
          since &apos;26
        </div>
        <UserProfile appearance={clerkAppearance} routing="hash" />
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-glass-panel bg-app-glass-panel px-6 shadow-app-md backdrop-blur-xl">
        <h2 className="border-b border-app-border py-4 text-xs font-semibold uppercase tracking-wider text-app-text-muted">
          Preferences
        </h2>

        <div className="divide-y divide-app-border">
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

          <PreferenceRow title="Theme" description="Applies immediately, everywhere in the app.">
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

      <section className="mt-6 flex items-center justify-between gap-6 rounded-2xl border border-app-danger/30 bg-app-danger-soft px-6 py-5">
        <div>
          <h2 className="text-sm font-semibold text-app-danger">Delete account</h2>
          <p className="mt-0.5 text-xs text-app-danger/80">
            Permanently removes your account and all saved projects.
          </p>
        </div>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </section>
    </main>
  );
}
