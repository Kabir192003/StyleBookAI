/**
 * StudioBuilder — the manual builder's token editor + live preview,
 * embedded in app/studio/page.tsx. Styled to match the Studio.dc.html
 * design pulled from claude.ai/design (project "Website redesign
 * request"): a 5-token palette (accent/support/surface/ink/muted), a
 * display/body font pair, corner radius, and density, all driving a live
 * mock landing page preview via CSS custom properties, plus an export
 * drawer that formats the tokens as CSS/Tailwind/JSON/SwiftUI/Figma.
 *
 * Replaces the old StudioCanvas.tsx stub — a different, unfinished
 * "pick arbitrary colors + assign roles" model that never shipped and
 * doesn't match this design's much simpler, more opinionated token set.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Undo2, Redo2 } from "lucide-react";
import { ExportDrawer } from "./ExportDrawer";
import { StudioCanvas } from "./StudioCanvas";
import { ShowcaseContent } from "./ShowcaseContent";
import { ComponentInspector } from "./ComponentInspector";
import { SpacingVisualization } from "@/components/design-system/SpacingVisualization";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { cn } from "@/lib/utils";
import { useAIResultStore, useAuthStore } from "@/store";
import { useStudioImportStore } from "@/store/studioImportStore";
import { PaletteTokens } from "@/lib/studio/exportCode";
import { projectInputFromStudioState } from "@/lib/studio/projectFromState";
import { applyStudioImport } from "@/lib/studio/applyImport";
import { paletteFromAIColors } from "@/lib/studio/paletteFromAIColors";
import {
  deriveDarkPaletteTokens,
  deriveThemeVariantFromPalette,
  synthesizeDesignSystemFromPalettes,
} from "@/lib/studio/deriveThemeVariant";
import {
  PrimitiveColor,
  ColorValue,
  isColorRef,
  resolvePalette,
  unlinkPrimitiveFromPalette,
  makePrimitiveId,
} from "@/lib/studio/tokenGraph";
import type { ComponentName, ComponentTokenSet } from "@/types/designSystem";
import { generateTypeScale, TYPE_SCALE_RATIOS } from "@/lib/typeScale/generateTypeScale";
import { generateSpacingScale } from "@/lib/designTokens/spacing";
import { buildShadowScale } from "@/lib/designTokens/shadows";
import { SpacingScale, ShadowScale, MoodboardImage } from "@/types/designTokens";
import { DesignSystem, ThemeVariantTokens } from "@/types/designSystem";
import { TypeScale } from "@/types/theme";
import { AIReasoning } from "@/types/project";

const FONTS = [
  "Fraunces",
  "Playfair Display",
  "Cormorant Garamond",
  "Source Serif 4",
  "Archivo",
  "Inter",
  "Manrope",
  "DM Sans",
  "Work Sans",
  "Space Grotesk",
  "Sora",
  "Unbounded",
];

// Each preset is a complete 5-token palette in its own right, muted
// included — previously `muted` wasn't part of this data at all and was
// patched on afterward with a 2-value brightness guess (applyPalette
// below), so the swatch button shown here didn't even represent the
// colour it was about to apply.
const PALETTES = [
  { name: "Studio Navy", accent: "#222D52", support: "#C36B3E", surface: "#F5F1E8", ink: "#211E18", muted: "#8A8477" },
  { name: "Emerald", accent: "#1F5C41", support: "#C9A96E", surface: "#F4F2EC", ink: "#1C2B24", muted: "#7C9186" },
  { name: "Punch", accent: "#E63946", support: "#2540C6", surface: "#F4F2EE", ink: "#16141A", muted: "#8A8577" },
  { name: "Midnight", accent: "#8B5CF6", support: "#22D3EE", surface: "#121022", ink: "#E6E1F5", muted: "#6B6483" },
  { name: "Terracotta", accent: "#B65735", support: "#4E7147", surface: "#F7EFE6", ink: "#38291F", muted: "#9C8879" },
  { name: "Mono", accent: "#3C3C36", support: "#8A8477", surface: "#F6F6F4", ink: "#1F1F1E", muted: "#A6A197" },
] as const;

const PAIRS = [
  { label: "Editorial", head: "Fraunces", body: "Archivo" },
  { label: "Luxe", head: "Playfair Display", body: "Manrope" },
  { label: "Techno", head: "Space Grotesk", body: "Inter" },
  { label: "Bold", head: "Unbounded", body: "DM Sans" },
] as const;

const DENSITIES = {
  Compact: { pad: 18, gap: 12 },
  Cozy: { pad: 30, gap: 18 },
  Airy: { pad: 46, gap: 30 },
} as const;
type Density = keyof typeof DENSITIES;

const RADII = [2, 6, 10, 16, 22];

const ROLES = [
  { key: "accent", label: "Accent", token: "--accent" },
  { key: "support", label: "Support", token: "--support" },
  { key: "surface", label: "Surface", token: "--surface" },
  { key: "ink", label: "Ink / text", token: "--ink" },
  { key: "muted", label: "Muted", token: "--muted" },
] as const;

const FEATURES = [
  { mark: "01", title: "One source", body: "Colour, type and shape live in a single system that everything reads from." },
  { mark: "02", title: "Live everywhere", body: "Change a token once and watch every surface update in real time." },
  { mark: "03", title: "Export ready", body: "Ship to CSS, Tailwind, SwiftUI or Figma in a single click." },
];

const STATS = [
  { n: "6", l: "core tokens" },
  { n: "30", l: "themes" },
  { n: "∞", l: "exports" },
];

function onColor(hex: string): string {
  return getContrastRatio(hex, "#FBF8F2") >= getContrastRatio(hex, "#141110") ? "#FBF8F2" : "#141110";
}

function randomOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Each of the 5 roles now holds either a literal hex (today's behavior,
// "Custom" in the UI) or a reference to a named entry in state.primitives
// ("Linked") — see lib/studio/tokenGraph.ts. Resolution to plain hex
// happens once, in resolvedLight/resolvedDark below; every other consumer
// (preview, export, save) only ever sees resolved hex, unchanged.
export type EditablePaletteTokens = {
  accent: ColorValue;
  support: ColorValue;
  surface: ColorValue;
  ink: ColorValue;
  muted: ColorValue;
};

export type StudioState = {
  name: string;
  mode: "Light" | "Dark";
  // Two independently-editable token sets — previously a single flat
  // palette with a "mode" label that nothing actually read. The mode
  // toggle now switches which of these drives the preview (see
  // previewVars below), so it's a real dark mode, not cosmetic.
  light: EditablePaletteTokens;
  dark: EditablePaletteTokens;
  // Named, unlimited-count swatches a palette role can alias instead of
  // holding its own literal hex — editing a primitive here cascades to
  // every role (light or dark) linked to it.
  primitives: PrimitiveColor[];
  headFont: string;
  bodyFont: string;
  accentFont?: string;
  radius: number;
  density: Density;
  // Always present now, manual build or AI-seeded alike — these three
  // used to only exist when hydrated from an AI result, so a from-scratch
  // build had no way to see or edit type scale at all, and the Shadow/
  // Spacing controls further down would simply never appear. Every
  // Studio project is now a real typographic + spacing system, not just
  // a palette.
  typeScale: TypeScale;
  spacing: SpacingScale;
  shadows: ShadowScale;
  // The "advanced" layer (per-component tokens, accessibility, icon
  // style, grid, breakpoints) — still optional. A manual build starts
  // without one; the "Enable component tokens" action synthesizes a
  // real starting one rather than this staying AI-generation-only.
  designSystem?: DesignSystem;
  moodboard?: MoodboardImage[];
  aiReasoning?: AIReasoning;
};

export const DEFAULT_LIGHT: PaletteTokens = {
  accent: "#222D52",
  support: "#C36B3E",
  surface: "#F5F1E8",
  ink: "#211E18",
  muted: "#8A8477",
};

// The from-scratch dark default ONLY. This exact violet set is what QA found
// shipping byte-identical across three unrelated AI-generated brands: nothing
// was deriving a dark palette, so every brand fell through to these five
// hexes. It is now unreachable from any branded path — anywhere a light
// palette is known (URL seed, AI result, saved project), dark is derived from
// it via deriveDarkPaletteTokens instead. Don't reintroduce it as a fallback.
const DEFAULT_DARK: PaletteTokens = {
  accent: "#8B5CF6",
  support: "#22D3EE",
  surface: "#121022",
  ink: "#E6E1F5",
  muted: "#6B6483",
};

// Fixed ids (not makePrimitiveId()) — this array is built at module init,
// which also runs during SSR; a random id generated there would differ
// between the server-rendered HTML and the client's first render and
// trip a hydration mismatch. Starts unlinked (every role below still
// ships in "Custom" mode) — the Primitives panel just has a named
// starter set ready to link to, not a required migration.
const DEFAULT_PRIMITIVES: PrimitiveColor[] = [
  { id: "primitive-navy", name: "Navy", hex: DEFAULT_LIGHT.accent },
  { id: "primitive-terracotta", name: "Terracotta", hex: DEFAULT_LIGHT.support },
  { id: "primitive-cream", name: "Cream", hex: DEFAULT_LIGHT.surface },
  { id: "primitive-charcoal", name: "Charcoal", hex: DEFAULT_LIGHT.ink },
  { id: "primitive-stone", name: "Stone", hex: DEFAULT_LIGHT.muted },
];

export const DEFAULT_STATE: StudioState = {
  name: "Northwind",
  mode: "Light",
  light: DEFAULT_LIGHT,
  dark: DEFAULT_DARK,
  primitives: DEFAULT_PRIMITIVES,
  headFont: "Fraunces",
  bodyFont: "Archivo",
  radius: 10,
  density: "Cozy",
  typeScale: generateTypeScale(16, "Major Third"),
  spacing: generateSpacingScale(4),
  shadows: buildShadowScale("subtle"),
};

function seedFromParams(params: URLSearchParams): Partial<StudioState> {
  const seeded: Partial<StudioState> = {};
  const name = params.get("name");
  if (name) seeded.name = name;

  const mode = params.get("mode");
  const resolvedMode: "Light" | "Dark" = mode === "Dark" ? "Dark" : "Light";
  if (mode === "Light" || mode === "Dark") seeded.mode = mode;

  const seededPalette: Partial<PaletteTokens> = {};
  (["accent", "support", "surface", "ink", "muted"] as const).forEach((key) => {
    const value = params.get(key);
    if (value) seededPalette[key] = value;
  });
  if (Object.keys(seededPalette).length > 0) {
    const base = resolvedMode === "Dark" ? DEFAULT_DARK : DEFAULT_LIGHT;
    const merged = { ...base, ...seededPalette };
    seeded[resolvedMode === "Dark" ? "dark" : "light"] = merged;
    // A deep link ("Open in Studio", "Apply this edition") only ever carries
    // ONE palette — the light one. Without this, the brand's light palette
    // landed next to the stock violet DEFAULT_DARK, so flipping to Dark threw
    // away the brand entirely. Derive the counterpart from what we were given.
    if (resolvedMode !== "Dark") seeded.dark = deriveDarkPaletteTokens(merged);
  }

  const head = params.get("head");
  if (head) seeded.headFont = head;
  const body = params.get("body");
  if (body) seeded.bodyFont = body;
  const radius = params.get("radius");
  if (radius) seeded.radius = parseInt(radius, 10) || DEFAULT_STATE.radius;
  return seeded;
}

// Derives a flat 5-token palette from a designSystem theme variant's
// colorRoles/component tokens — used only to seed Studio's DARK palette,
// since an AI result's `colors` array (the canonical source, see
// paletteFromAIColors) has no dark-mode concept of its own. Falls back to
// whatever palette Studio would otherwise use for any field the design
// system didn't specify.
function paletteFromThemeVariant(variant: ThemeVariantTokens | undefined, fallback: PaletteTokens): PaletteTokens {
  if (!variant) return fallback;
  return {
    accent: variant.components.button?.background ?? fallback.accent,
    support: variant.components.buttonSecondary?.background ?? fallback.support,
    surface: variant.colorRoles.surface,
    ink: variant.colorRoles.text,
    muted: variant.colorRoles.textMuted,
  };
}

export function StudioBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aiResult = useAIResultStore((s) => s.result);
  const savedProjectId = useAIResultStore((s) => s.savedProjectId);
  const setSavedProjectId = useAIResultStore((s) => s.setSavedProjectId);
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const [state, setState] = useState<StudioState>(() => {
    const seeded = { ...DEFAULT_STATE, ...seedFromParams(searchParams) };
    // Only enrich from the persisted AI result when this navigation didn't
    // already provide its own explicit palette from a different source
    // (e.g. a saved theme's "Apply this edition" link) — avoids leaking a
    // stale/unrelated AI result's design system into an unrelated deep link.
    const cameFromOtherSource = Boolean(searchParams.get("accent")) && searchParams.get("from") !== "ai";
    // Hoisted so the dark fallback below can derive from the *resolved* light
    // palette rather than from seeded.dark (which, absent a URL palette to
    // seed from, is still the stock DEFAULT_DARK). Two values because a saved
    // project's light palette may hold primitive references rather than
    // literal hex: `aiLight` is what Studio edits, `aiLightHex` is the
    // flattened form the colour maths needs.
    const aiPrimitives = aiResult?.colorPrimitives ?? seeded.primitives;
    const aiLight = aiResult
      ? (aiResult.studioPaletteLinks?.light ??
        paletteFromAIColors(aiResult.colors, resolvePalette(seeded.light, seeded.primitives)))
      : null;
    const aiLightHex = aiLight ? resolvePalette(aiLight, aiPrimitives) : null;
    const base =
      !aiResult || cameFromOtherSource
        ? seeded
        : {
            ...seeded,
            typeScale: aiResult.typeScale ?? seeded.typeScale,
            spacing: aiResult.spacing ?? seeded.spacing,
            shadows: aiResult.shadows ?? seeded.shadows,
            designSystem: aiResult.designSystem,
            moodboard: aiResult.moodboard,
            aiReasoning: aiResult.aiReasoning,
            // A saved project that already went through Studio once carries
            // its own primitives/links forward as-is — re-deriving from
            // aiResult.colors would silently drop them. Only a result with
            // no prior Studio session falls back to the literal-hex
            // derivation below.
            primitives: aiResult.colorPrimitives ?? seeded.primitives,
            // Light always traces back to aiResult.colors — the same
            // canonical source the AI results page itself renders and
            // that "Open in Studio" already seeds via URL params (see
            // paletteFromAIColors) — never to designSystem.light, which is
            // a second, independently-generated color set that isn't
            // guaranteed to agree with it (a confirmed data-fidelity bug:
            // the two could silently disagree, e.g. "Secondary" showing
            // one hex on the results page and a different one in Studio).
            // Dark has no equivalent in aiResult.colors, so designSystem.dark
            // is still the best available signal for dark mode specifically —
            // but when it's absent the fallback derives from this brand's own
            // light palette (deriveDarkPaletteTokens), never from seeded.dark.
            // That fallback was the stock violet set, which is how three
            // unrelated QA brands ended up sharing an identical dark palette.
            light: aiLight!,
            dark:
              aiResult.studioPaletteLinks?.dark ??
              paletteFromThemeVariant(aiResult.designSystem?.dark, deriveDarkPaletteTokens(aiLightHex!)),
          };

    const importPayload = useStudioImportStore.getState().consume();
    return importPayload ? applyStudioImport(base, importPayload) : base;
  });
  const [exportOpen, setExportOpen] = useState(false);
  // Which component the canvas has selected. Deliberately *not* part of
  // StudioState: it is a view concern, and putting it there would make every
  // click an undo step and mark the project dirty.
  const [selected, setSelected] = useState<ComponentName | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedPing, setSavedPing] = useState(false);

  // Debounced snapshot history — a snapshot is only pushed once edits
  // settle for 500ms, so dragging a color/slider doesn't spam undo with
  // one entry per pixel. isUndoRedoRef suppresses the snapshot that would
  // otherwise fire from undo/redo's own setState.
  const [past, setPast] = useState<StudioState[]>([]);
  const [future, setFuture] = useState<StudioState[]>([]);
  const prevStateRef = useRef(state);
  const isUndoRedoRef = useRef(false);
  // Dirty is derived by identity against the last-saved snapshot rather
  // than tracked via its own useState — a "skip the first effect run"
  // flag doesn't survive React Strict Mode's double-invoked mount effect
  // in dev, which was flipping this true immediately on load.
  const savedSnapshotRef = useRef(state);
  const isDirty = state !== savedSnapshotRef.current;

  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      prevStateRef.current = state;
      return;
    }
    const timeout = setTimeout(() => {
      if (prevStateRef.current !== state) {
        setPast((p) => [...p, prevStateRef.current]);
        setFuture([]);
        prevStateRef.current = state;
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [state]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function undo() {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [state, ...f]);
    isUndoRedoRef.current = true;
    setState(previous);
  }

  function redo() {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, state]);
    isUndoRedoRef.current = true;
    setState(next);
  }

  useEffect(() => {
    const families = [state.headFont, state.bodyFont]
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    const id = "studio-preview-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [state.headFont, state.bodyFont]);

  const density = DENSITIES[state.density];
  const domain = `${state.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

  // FONTS is a small curated list for the manual builder's dropdown, but
  // an AI-generated result can seed headFont/bodyFont with any font from
  // the full ~2,000-font catalog (e.g. "IBM Plex Mono"). Previously the
  // <select> silently had no matching <option> for those, so it rendered
  // out of sync with the actually-applied font — a confirmed data-fidelity
  // bug. Unioning the current value in keeps the control honest for any
  // font, not just the 12 curated ones.
  const headFontOptions = FONTS.includes(state.headFont) ? FONTS : [state.headFont, ...FONTS];
  const bodyFontOptions = FONTS.includes(state.bodyFont) ? FONTS : [state.bodyFont, ...FONTS];
  const activeVariant = state.mode === "Dark" ? "dark" : "light";
  // Raw (possibly-linked) palette — used only by the editor UI below to
  // decide Custom vs Linked per role. Everything else (preview, export,
  // save) reads the resolved version, which is always plain hex.
  const activePalette = state[activeVariant];
  const resolvedLight = useMemo(() => resolvePalette(state.light, state.primitives), [state.light, state.primitives]);
  const resolvedDark = useMemo(() => resolvePalette(state.dark, state.primitives), [state.dark, state.primitives]);
  const resolvedActivePalette = activeVariant === "dark" ? resolvedDark : resolvedLight;
  // Everything downstream that only needs to render/export (Live Preview,
  // the Export drawer) reads this — plain resolved hex, so those consumers
  // never need to know the token graph exists. Saving is different: it
  // needs the raw, unresolved state.light/state.dark/state.primitives too
  // (to persist links), so handleSave passes `state` itself, not this.
  const resolvedState = useMemo(
    () => ({ ...state, light: resolvedLight, dark: resolvedDark }),
    [state, resolvedLight, resolvedDark]
  );

  const previewVars = useMemo(
    () =>
      ({
        "--accent": resolvedActivePalette.accent,
        "--support": resolvedActivePalette.support,
        "--surface": resolvedActivePalette.surface,
        "--ink": resolvedActivePalette.ink,
        "--muted": resolvedActivePalette.muted,
        "--on-accent": onColor(resolvedActivePalette.accent),
        "--head": `'${state.headFont}', serif`,
        "--body": `'${state.bodyFont}', sans-serif`,
        "--r": `${state.radius}px`,
        "--pad": `${density.pad}px`,
        "--gap": `${density.gap}px`,
      }) as React.CSSProperties,
    [resolvedActivePalette, state.headFont, state.bodyFont, state.radius, density]
  );

  /**
   * The selected component's tokens for the variant currently on screen.
   * Falls back to the light variant when the system has no dark one, matching
   * where `setComponentTokens` writes — the panel must never display one
   * variant's values while edits land in another.
   */
  const activeComponentTokens = useMemo<ComponentTokenSet | null>(() => {
    if (!selected || !state.designSystem) return null;
    const variant =
      activeVariant === "dark" && state.designSystem.dark ? state.designSystem.dark : state.designSystem.light;
    // An AI-authored design system is free to omit components — the schema
    // marks every one optional — so a missing entry is normal data, not a
    // bug. Deriving one from the palette on demand keeps every component in
    // the canvas clickable; without it, clicking (say) a table on a system
    // whose model never mentioned tables selects the element and then opens
    // nothing, which reads as broken.
    return (
      variant.components[selected] ??
      deriveThemeVariantFromPalette(activeVariant === "dark" ? resolvedDark : resolvedLight).components[selected] ??
      null
    );
  }, [selected, state.designSystem, activeVariant, resolvedLight, resolvedDark]);

  function set<K extends keyof StudioState>(key: K, value: StudioState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  /**
   * Opening the inspector on a system with no `designSystem` synthesises one
   * first, rather than showing an empty panel or refusing the click. This is
   * the same call the old "Enable component tokens" button made — a manual
   * build simply has no per-component tokens until something needs them, and
   * "I clicked a button" is a clearer trigger than a button labelled with an
   * implementation detail.
   */
  function handleSelect(name: ComponentName | null) {
    setSelected(name);
    if (name === null) return;
    setState((s) =>
      s.designSystem
        ? s
        : {
            ...s,
            designSystem: synthesizeDesignSystemFromPalettes(
              resolvePalette(s.light, s.primitives),
              resolvePalette(s.dark, s.primitives)
            ),
          }
    );
  }

  function setComponentTokens(name: ComponentName, next: ComponentTokenSet) {
    setState((s) => {
      if (!s.designSystem) return s;
      const variant = s.mode === "Dark" ? "dark" : "light";
      // The dark variant is optional on the type. Editing in dark mode on a
      // system that has none would otherwise write into `undefined` and be
      // silently dropped, so fall back to patching light — the variant the
      // inspector header names is then still the one that changed.
      const target: "light" | "dark" = variant === "dark" && s.designSystem.dark ? "dark" : "light";
      const current = s.designSystem[target];
      if (!current) return s;
      return {
        ...s,
        designSystem: {
          ...s.designSystem,
          [target]: { ...current, components: { ...current.components, [name]: next } },
        },
      };
    });
  }

  function setToken<K extends keyof EditablePaletteTokens>(key: K, value: ColorValue) {
    setState((s) => {
      const variant = s.mode === "Dark" ? "dark" : "light";
      return { ...s, [variant]: { ...s[variant], [key]: value } };
    });
  }

  function addPrimitive() {
    setState((s) => ({
      ...s,
      primitives: [...s.primitives, { id: makePrimitiveId(), name: `Color ${s.primitives.length + 1}`, hex: "#888888" }],
    }));
  }

  function updatePrimitive(id: string, patch: Partial<Omit<PrimitiveColor, "id">>) {
    setState((s) => ({
      ...s,
      primitives: s.primitives.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  function removePrimitive(id: string) {
    setState((s) => ({
      ...s,
      primitives: s.primitives.filter((p) => p.id !== id),
      light: unlinkPrimitiveFromPalette(s.light, id, s.primitives),
      dark: unlinkPrimitiveFromPalette(s.dark, id, s.primitives),
    }));
  }

  function applyPalette(p: (typeof PALETTES)[number]) {
    setState((s) => {
      const variant = s.mode === "Dark" ? "dark" : "light";
      return {
        ...s,
        [variant]: {
          accent: p.accent,
          support: p.support,
          surface: p.surface,
          ink: p.ink,
          muted: p.muted,
        },
      };
    });
  }

  function shuffle() {
    const p = randomOf(PALETTES);
    const pair = randomOf(PAIRS);
    applyPalette(p);
    setState((s) => ({ ...s, headFont: pair.head, bodyFont: pair.body, radius: randomOf(RADII) }));
  }

  async function handleSave() {
    if (authStatus === "loading") return;
    if (!user) {
      router.push(`/sign-in?reason=save-project&from=${encodeURIComponent("/studio")}`);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload = projectInputFromStudioState(state);
      const res = await fetch(savedProjectId ? `/api/projects/${savedProjectId}` : "/api/projects", {
        method: savedProjectId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save this project.");
      if (!savedProjectId) setSavedProjectId(data.project.id);
      savedSnapshotRef.current = state;
      setSavedPing(true);
      setTimeout(() => setSavedPing(false), 1800);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Couldn't save this project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EDE6DA] font-grotesk text-[#211E18]">
      <div className="sticky top-14 z-40 flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.18] bg-[#EDE6DA]/[0.94] px-6 py-3.5 backdrop-blur-md sm:px-12">
        <div className="flex items-center gap-2 font-mono-plex text-[11px] uppercase tracking-[0.18em] text-[#8A8477]">
          The Studio — {state.name}
          {isDirty && (
            <span
              className="h-1.5 w-1.5 flex-none rounded-full bg-[#C36B3E]"
              title="Unsaved changes"
              aria-label="Unsaved changes"
            />
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {aiResult && (
            <Link
              href="/studio/ai"
              className="rounded-full border border-black/30 px-4 py-2 font-mono-plex text-[11px] uppercase tracking-[0.12em] text-[#211E18]"
            >
              ← Back to AI result
            </Link>
          )}
          <div className="flex items-center overflow-hidden rounded-full border border-black/30">
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              title="Undo"
              aria-label="Undo"
              className="px-3 py-2 text-[#211E18] disabled:opacity-30"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <div className="h-4 w-px bg-black/20" />
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              title="Redo"
              aria-label="Redo"
              className="px-3 py-2 text-[#211E18] disabled:opacity-30"
            >
              <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={shuffle}
            className="rounded-full border border-black/30 px-4 py-2 font-mono-plex text-[11px] uppercase tracking-[0.12em] text-[#211E18]"
          >
            Shuffle
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-full border border-black/30 px-4 py-2 font-mono-plex text-[11px] uppercase tracking-[0.12em] text-[#211E18] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : savedPing ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : null}
            {saving ? "Saving…" : savedProjectId ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="rounded-full bg-[#222D52] px-[22px] py-2.5 text-[13px] tracking-[0.02em] text-[#F2EBE0]"
          >
            Export ↓
          </button>
        </div>
      </div>
      {saveError && (
        <div className="border-b border-[#B3261E]/30 bg-[#B3261E]/10 px-6 py-2.5 text-center text-xs text-[#B3261E] sm:px-12">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[376px_1fr]">
        <aside className="flex flex-col gap-[30px] border-b border-black/[0.18] bg-[#F2EBE0] px-6 py-6 lg:sticky lg:top-[105px] lg:max-h-[calc(100vh-105px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div>
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#8A8477]">The Studio</div>
            <h1 className="mt-2 font-editorial-serif text-[34px] font-normal leading-[1.02] tracking-[-0.02em]">
              Compose your system.
            </h1>
            <p className="mt-2.5 text-[13px] leading-relaxed text-[#6E675C]">
              Tune every token on the left. The preview on the right is your system, live.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Identity</div>
            <input
              value={state.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-lg border border-black/20 bg-white px-[13px] py-[11px] font-editorial-serif text-lg text-[#211E18]"
            />
            <div className="flex gap-2">
              {(["Light", "Dark"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("mode", m)}
                  className={cn(
                    "flex-1 rounded-lg border py-[9px] font-mono-plex text-[10px] uppercase tracking-[0.14em]",
                    state.mode === m ? "border-[#211E18] bg-[#211E18] text-[#F2EBE0]" : "border-black/[0.16] bg-white text-[#6E675C]"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Palette</div>
              <div className="font-mono-plex text-[9px] uppercase tracking-[0.12em] text-[#B4AD9E]">
                Editing {state.mode}
              </div>
            </div>
            {ROLES.map((r) => {
              const raw = activePalette[r.key];
              const linked = isColorRef(raw);
              const resolvedHex = resolvedActivePalette[r.key];
              return (
                <div key={r.key} className="flex items-center gap-3">
                  {linked ? (
                    <span
                      className="h-10 w-10 flex-none rounded-lg shadow-[0_0_0_1px_rgba(33,30,24,0.14)]"
                      style={{ backgroundColor: resolvedHex }}
                      title={resolvedHex}
                    />
                  ) : (
                    <input
                      type="color"
                      value={raw}
                      onChange={(e) => setToken(r.key, e.target.value)}
                      className="studio-color-input h-10 w-10 flex-none rounded-lg shadow-[0_0_0_1px_rgba(33,30,24,0.14)]"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[13px] text-[#211E18]">{r.label}</span>
                    {linked ? (
                      <select
                        value={raw.primitiveId}
                        onChange={(e) => setToken(r.key, { primitiveId: e.target.value })}
                        className="rounded-md border border-black/[0.16] bg-white px-1.5 py-1 font-mono-plex text-[11px] uppercase text-[#211E18]"
                      >
                        {state.primitives.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-mono-plex text-[11px] uppercase text-[#8A8477]">{resolvedHex}</span>
                    )}
                  </div>
                  <div className="flex flex-none overflow-hidden rounded-md border border-black/[0.16]">
                    <button
                      type="button"
                      onClick={() => {
                        if (linked) setToken(r.key, resolvedHex);
                      }}
                      className={cn(
                        "px-2 py-1 font-mono-plex text-[9px] uppercase tracking-[0.08em]",
                        !linked ? "bg-[#211E18] text-[#F2EBE0]" : "bg-white text-[#8A8477]"
                      )}
                    >
                      Custom
                    </button>
                    <button
                      type="button"
                      disabled={state.primitives.length === 0}
                      onClick={() => {
                        if (!linked) setToken(r.key, { primitiveId: state.primitives[0].id });
                      }}
                      className={cn(
                        "px-2 py-1 font-mono-plex text-[9px] uppercase tracking-[0.08em] disabled:opacity-30",
                        linked ? "bg-[#211E18] text-[#F2EBE0]" : "bg-white text-[#8A8477]"
                      )}
                    >
                      Linked
                    </button>
                  </div>
                  <span className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#B4AD9E]">{r.token}</span>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-2 pt-1">
              {PALETTES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  title={p.name}
                  onClick={() => applyPalette(p)}
                  className="flex h-[22px] overflow-hidden rounded-md border border-black/[0.16]"
                >
                  <span className="w-3.5" style={{ backgroundColor: p.accent }} />
                  <span className="w-3.5" style={{ backgroundColor: p.support }} />
                  <span className="w-3.5" style={{ backgroundColor: p.surface }} />
                  <span className="w-3.5" style={{ backgroundColor: p.ink }} />
                  <span className="w-3.5" style={{ backgroundColor: p.muted }} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Primitives</div>
              <button
                type="button"
                onClick={addPrimitive}
                className="font-mono-plex text-[9px] uppercase tracking-[0.12em] text-[#222D52]"
              >
                + Add
              </button>
            </div>
            <p className="text-[12px] leading-relaxed text-[#6E675C]">
              Named swatches a palette role can link to instead of holding its own hex — edit one here and every
              linked role, in both modes, updates with it.
            </p>
            {state.primitives.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <input
                  type="color"
                  value={p.hex}
                  onChange={(e) => updatePrimitive(p.id, { hex: e.target.value })}
                  className="studio-color-input h-9 w-9 flex-none rounded-lg shadow-[0_0_0_1px_rgba(33,30,24,0.14)]"
                />
                <input
                  value={p.name}
                  onChange={(e) => updatePrimitive(p.id, { name: e.target.value })}
                  className="min-w-0 flex-1 rounded-md border border-black/[0.16] bg-white px-2 py-1.5 text-[13px] text-[#211E18]"
                />
                <span className="font-mono-plex text-[11px] uppercase text-[#8A8477]">{p.hex}</span>
                <button
                  type="button"
                  onClick={() => removePrimitive(p.id)}
                  className="font-mono-plex text-[13px] text-[#B4AD9E]"
                  aria-label={`Remove ${p.name}`}
                  title={`Remove ${p.name}`}
                >
                  ×
                </button>
              </div>
            ))}
            {state.primitives.length === 0 && (
              <p className="font-mono-plex text-[11px] uppercase text-[#B4AD9E]">No primitives yet.</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Typography</div>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#B4AD9E]">Display</span>
              <select
                value={state.headFont}
                onChange={(e) => set("headFont", e.target.value)}
                className="rounded-lg border border-black/20 bg-white px-3 py-2.5 text-sm text-[#211E18]"
              >
                {headFontOptions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#B4AD9E]">Body</span>
              <select
                value={state.bodyFont}
                onChange={(e) => set("bodyFont", e.target.value)}
                className="rounded-lg border border-black/20 bg-white px-3 py-2.5 text-sm text-[#211E18]"
              >
                {bodyFontOptions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#B4AD9E]">Accent (optional)</span>
              <select
                value={state.accentFont ?? ""}
                onChange={(e) => set("accentFont", e.target.value || undefined)}
                className="rounded-lg border border-black/20 bg-white px-3 py-2.5 text-sm text-[#211E18]"
              >
                <option value="">None</option>
                {(state.accentFont && !FONTS.includes(state.accentFont) ? [state.accentFont, ...FONTS] : FONTS).map(
                  (f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  )
                )}
              </select>
            </label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {PAIRS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, headFont: p.head, bodyFont: p.body }))}
                  className="rounded-full border border-black/[0.16] bg-white px-3 py-1.5 text-[11px] text-[#6E675C]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Shape &amp; density</div>
            <label className="flex flex-col gap-2">
              <span className="flex justify-between text-xs text-[#6E675C]">
                <span>Corner radius</span>
                <span className="font-mono-plex text-[#211E18]">{state.radius}px</span>
              </span>
              <input
                type="range"
                min={0}
                max={28}
                step={1}
                value={state.radius}
                onChange={(e) => set("radius", Number(e.target.value))}
                className="studio-range w-full"
              />
            </label>
            <div className="flex gap-2">
              {(Object.keys(DENSITIES) as Density[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("density", d)}
                  className={cn(
                    "flex-1 rounded-lg border py-[9px] font-mono-plex text-[10px] uppercase tracking-[0.1em]",
                    state.density === d ? "border-[#211E18] bg-[#211E18] text-[#F2EBE0]" : "border-black/[0.16] bg-white text-[#6E675C]"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Type scale</div>
            <label className="flex flex-col gap-1.5">
              <span className="flex justify-between text-xs text-[#6E675C]">
                <span>Base size</span>
                <span className="font-mono-plex text-[#211E18]">{state.typeScale.baseSize}px</span>
              </span>
              <input
                type="range"
                min={12}
                max={22}
                step={1}
                value={state.typeScale.baseSize}
                onChange={(e) => set("typeScale", generateTypeScale(Number(e.target.value), state.typeScale.ratioName))}
                className="studio-range w-full"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#B4AD9E]">Ratio</span>
              <select
                value={state.typeScale.ratioName}
                onChange={(e) => set("typeScale", generateTypeScale(state.typeScale.baseSize, e.target.value))}
                className="rounded-lg border border-black/20 bg-white px-3 py-2.5 text-sm text-[#211E18]"
              >
                {Object.keys(TYPE_SCALE_RATIOS).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2 rounded-lg border border-black/[0.12] bg-white px-3 py-3">
              {(["sm", "base", "lg", "xl", "2xl", "3xl"] as const).map((k) => (
                <span
                  key={k}
                  className="font-editorial-serif leading-none text-[#211E18]"
                  style={{ fontSize: Math.min(state.typeScale.sizes[k], 34) }}
                  title={`${k}: ${state.typeScale.sizes[k]}px`}
                >
                  Aa
                </span>
              ))}
            </div>
          </div>
        </aside>

        <main
          className="relative overflow-hidden"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #E7DFD1, #E7DFD1 1px, #EDE6DA 1px, #EDE6DA 11px)",
          }}
        >
          <div className="flex items-center justify-between px-6 py-3.5 font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477] sm:px-8">
            <span>Live preview</span>
            <span>
              {state.name} · {state.mode} · {state.headFont} + {state.bodyFont}
            </span>
          </div>

          <div className="px-6 pb-10 sm:px-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">Shadow</div>
              <div className="flex gap-2">
                {(["none", "subtle", "dramatic"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, shadows: { ...s.shadows, recommended: level } }))}
                    className={cn(
                      "rounded-lg border px-3.5 py-[7px] font-mono-plex text-[10px] uppercase tracking-[0.1em]",
                      state.shadows.recommended === level
                        ? "border-[#211E18] bg-[#211E18] text-[#F2EBE0]"
                        : "border-black/[0.16] bg-white text-[#6E675C]"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex items-center overflow-hidden rounded-full border border-black/[0.2]">
                {(["Light", "Dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => set("mode", mode)}
                    className={cn(
                      "px-3.5 py-1.5 font-mono-plex text-[10px] uppercase tracking-[0.12em]",
                      state.mode === mode ? "bg-[#211E18] text-[#F2EBE0]" : "text-[#6E675C]"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <StudioCanvas
              tokens={resolvedState}
              theme={activeVariant}
              selected={selected}
              onSelect={handleSelect}
            >
              <ShowcaseContent systemName={state.name} />
            </StudioCanvas>

            <div className="mt-6 rounded-2xl border border-black/[0.14] bg-white/60 p-4">
              <SpacingVisualization
                spacing={state.spacing}
                editable
                onChange={(sp) => setState((s) => ({ ...s, spacing: sp }))}
              />
            </div>
          </div>
        </main>

        {/* Mounted only while something is selected, so the canvas gets the
            full width the rest of the time. `activeComponentTokens` is null
            until the synthesise-on-first-click in handleSelect has landed. */}
        {selected && activeComponentTokens && (
          <ComponentInspector
            name={selected}
            variant={activeVariant}
            tokens={activeComponentTokens}
            radius={state.radius}
            headFont={state.headFont}
            bodyFont={state.bodyFont}
            fontOptions={headFontOptions}
            onTokensChange={(next) => setComponentTokens(selected, next)}
            onRadiusChange={(r) => set("radius", r)}
            onHeadFontChange={(f) => set("headFont", f)}
            onBodyFontChange={(f) => set("bodyFont", f)}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {exportOpen && <ExportDrawer tokens={resolvedState} onClose={() => setExportOpen(false)} />}
    </div>
  );
}
