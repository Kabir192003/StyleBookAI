/**
 * User-controlled accessibility preferences.
 *
 * The split here is deliberate and worth stating, because it decides what
 * belongs in this file at all:
 *
 * - Things that cost the design nothing — labels, alt text, landmarks, a
 *   skip link, focus order, name/role/value — are **not** settings. They
 *   ship on for everyone, always. A toggle for those would just be a way to
 *   ship a broken page by default.
 * - Things that visibly change the interface — heavier contrast than the AA
 *   baseline, larger text, permanently underlined links, flattened
 *   decoration — are opt-in, because they're preferences rather than
 *   correctness, and forcing them on everyone would make the product worse
 *   for the people who don't need them.
 *
 * Each preference is applied as a `data-a11y-*` attribute on <html>, and the
 * CSS that responds lives in app/globals.css. Storing on the document rather
 * than in React context means the styling works on server-rendered markup
 * with no hydration flash (see `a11yInitScript`).
 */

export type A11yPreferences = {
  /** Push text contrast beyond the AA baseline toward AAA. */
  highContrast: boolean;
  /** Scale up the interface's base type. */
  largeText: boolean;
  /** Underline every link in body copy, not just on hover — colour alone is
   *  not a sufficient distinguisher (WCAG 1.4.1 Use of Colour). */
  underlineLinks: boolean;
  /** Cut animation and transitions even when the OS hasn't asked for it. */
  reduceMotion: boolean;
  /** Drop blur/translucency, which can make text hard to read against busy
   *  backdrops. */
  reduceTransparency: boolean;
};

export const A11Y_DEFAULTS: A11yPreferences = {
  highContrast: false,
  largeText: false,
  underlineLinks: false,
  reduceMotion: false,
  reduceTransparency: false,
};

export const A11Y_STORAGE_KEY = "sb-a11y-preferences";

export type A11yOption = {
  key: keyof A11yPreferences;
  label: string;
  description: string;
  category: "Vision" | "Motion";
};

export const A11Y_OPTIONS: A11yOption[] = [
  {
    key: "highContrast",
    label: "Higher contrast text",
    description: "Darkens secondary text and borders further. Text already meets WCAG AA without this.",
    category: "Vision",
  },
  {
    key: "largeText",
    label: "Larger text",
    description: "Scales the interface type up by about 12.5%. Your browser's own zoom still works alongside it.",
    category: "Vision",
  },
  {
    key: "underlineLinks",
    label: "Always underline links",
    description: "Shows link underlines everywhere, not only on hover, so links aren't signalled by colour alone.",
    category: "Vision",
  },
  {
    key: "reduceTransparency",
    label: "Reduce transparency",
    description: "Removes background blur and translucent panels in favour of solid surfaces.",
    category: "Vision",
  },
  {
    key: "reduceMotion",
    label: "Reduce motion",
    description: "Turns off animation and scroll effects. Already applied automatically if your system asks for it.",
    category: "Motion",
  },
];

export function readA11yPreferences(): A11yPreferences {
  if (typeof window === "undefined") return A11Y_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return A11Y_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<A11yPreferences>;
    return { ...A11Y_DEFAULTS, ...parsed };
  } catch {
    return A11Y_DEFAULTS;
  }
}

/** Attribute name for one preference, e.g. `data-a11y-high-contrast`. */
function attrFor(key: keyof A11yPreferences): string {
  return `data-a11y-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

export function applyA11yPreferences(prefs: A11yPreferences): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  (Object.keys(A11Y_DEFAULTS) as Array<keyof A11yPreferences>).forEach((key) => {
    if (prefs[key]) root.setAttribute(attrFor(key), "true");
    else root.removeAttribute(attrFor(key));
  });
}

export function saveA11yPreferences(prefs: A11yPreferences): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
  applyA11yPreferences(prefs);
}

/**
 * Runs before first paint (injected in the root layout's <head>, same
 * pattern as the existing theme script) so a preference is never applied a
 * frame late — a flash of the un-adjusted interface is exactly the jolt
 * someone who enabled "reduce motion" is trying to avoid.
 */
export const a11yInitScript = `
(function(){
  try {
    var raw = localStorage.getItem(${JSON.stringify(A11Y_STORAGE_KEY)});
    if (!raw) return;
    var p = JSON.parse(raw);
    var root = document.documentElement;
    Object.keys(p).forEach(function(k){
      if (!p[k]) return;
      root.setAttribute('data-a11y-' + k.replace(/[A-Z]/g, function(c){ return '-' + c.toLowerCase(); }), 'true');
    });
  } catch (e) {}
})();
`;
