/**
 * Light/dark theme preference — backs the toggle on /account (see
 * docs/PRODUCT_AND_UX.md §4: "Light and dark mode both need to work well,
 * since colors read differently against each").
 *
 * v1 has no user-preferences API endpoint yet, so this persists to
 * localStorage rather than the database. TODO: once a
 * PATCH /api/users/preferences (or similar) route exists, mirror the value
 * there too so it follows the user across devices.
 *
 * Owner: Amna
 */
export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "stylebook-theme";

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function resolveTheme(pref: ThemePreference): "light" | "dark" {
  if (pref === "system") {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return pref;
}

export function applyTheme(pref: ThemePreference) {
  const resolved = resolveTheme(pref);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  window.localStorage.setItem(STORAGE_KEY, pref);
}

/**
 * Inlined into <head> (see app/layout.tsx) and run before hydration so the
 * page never flashes the wrong theme on load — the classic
 * localStorage-plus-blocking-script pattern, kept dependency-free since
 * this app doesn't use next-themes.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = window.localStorage.getItem('${STORAGE_KEY}');
    var pref = stored === 'light' || stored === 'dark' ? stored : 'system';
    var resolved = pref === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : pref;
    if (resolved === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
