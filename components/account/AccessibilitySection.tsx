// The opt-in half of the app's accessibility story (/account). Only prefs
// that visibly change the UI live here — the always-on half (labels, alt
// text, landmarks, skip link, focus order, keyboard nav) has no switches
// by design; see lib/a11y/preferences.ts for why.
"use client";

import { useEffect, useState } from "react";
import {
  A11Y_DEFAULTS,
  A11Y_OPTIONS,
  type A11yPreferences,
  applyA11yPreferences,
  readA11yPreferences,
  saveA11yPreferences,
} from "@/lib/a11y/preferences";

const CATEGORIES = ["Vision", "Motion"] as const;

export function AccessibilitySection() {
  const [prefs, setPrefs] = useState<A11yPreferences>(A11Y_DEFAULTS);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  // Read in an effect, not in the useState initializer: the initializer also
  // runs during the server render, where localStorage doesn't exist, and
  // reading it there would hydrate ahead of the server and mismatch.
  useEffect(() => {
    const stored = readA11yPreferences();
    setPrefs(stored);
    applyA11yPreferences(stored);
    setSystemReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  function toggle(key: keyof A11yPreferences) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    saveA11yPreferences(next);
  }

  function reset() {
    setPrefs(A11Y_DEFAULTS);
    saveA11yPreferences(A11Y_DEFAULTS);
  }

  const anyOn = Object.values(prefs).some(Boolean);

  return (
    <section aria-labelledby="a11y-heading" className="rounded-2xl border border-black/[0.14] bg-[#F2EBE0] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="a11y-heading" className="font-editorial-serif text-[24px] font-normal tracking-[-0.01em] text-[#211E18]">
            Accessibility
          </h2>
          <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-[#6E675C]">
            StyleBook already meets WCAG&nbsp;AA out of the box — text contrast, labels, keyboard support and screen-reader
            names are on for everyone. These are extra adjustments you can turn on if they suit you better.
          </p>
        </div>
        {anyOn && (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-full border border-[#211E18]/[0.24] px-4 py-2 text-[12px] text-[#211E18] hover:bg-black/[0.04]"
          >
            Reset to defaults
          </button>
        )}
      </div>

      {CATEGORIES.map((category) => (
        <div key={category} className="mt-6">
          <h3 className="font-mono-plex text-[10px] uppercase tracking-[0.18em] text-[#6E675C]">{category}</h3>
          <ul className="mt-3 space-y-2">
            {A11Y_OPTIONS.filter((o) => o.category === category).map((option) => {
              const checked = prefs[option.key];
              const describedBy = `a11y-desc-${option.key}`;
              return (
                <li key={option.key}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/[0.10] bg-white/50 p-3.5 hover:bg-white/80">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(option.key)}
                      aria-describedby={describedBy}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#222D52]"
                    />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-[#211E18]">{option.label}</span>
                      <span id={describedBy} className="mt-0.5 block text-[12.5px] leading-relaxed text-[#6E675C]">
                        {option.description}
                        {option.key === "reduceMotion" && systemReducedMotion && (
                          <>
                            {" "}
                            <strong className="font-medium text-[#211E18]">
                              Your system already requests reduced motion, so this is active regardless.
                            </strong>
                          </>
                        )}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
