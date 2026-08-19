// The manual builder's token editor + live preview, embedded in
// app/studio/page.tsx: a 5-token palette (accent/support/surface/ink/muted),
// a display/body font pair, corner radius, and density, all driving a live
// mock landing page preview via CSS custom properties, plus an export drawer
// that formats the tokens as CSS/Tailwind/JSON/SwiftUI/Figma.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Undo2, Redo2 } from "lucide-react";
import { ExportDrawer } from "./ExportDrawer";
import { StudioCanvas } from "./StudioCanvas";
import { ShowcaseContent } from "./ShowcaseContent";
import { GeneratedContent } from "./GeneratedContent";
import { ComponentInspector } from "./ComponentInspector";
import { SpacingVisualization } from "@/components/design-system/SpacingVisualization";
import type { NonDefaultState } from "@/components/design-system/ComponentEditor";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { cn } from "@/lib/utils";
import { useAIResultStore, useAuthStore } from "@/store";
import { useStudioImportStore } from "@/store/studioImportStore";
import { PaletteTokens } from "@/lib/studio/exportCode";
import { projectInputFromStudioState } from "@/lib/studio/projectFromState";
import { applyStudioImport } from "@/lib/studio/applyImport";
import { paletteFromAIColors, primitivesFromAIColors } from "@/lib/studio/paletteFromAIColors";
import {
  deriveDarkPaletteTokens,
  deriveThemeVariantFromPalette,
  synthesizeDesignSystemFromPalettes,
} from "@/lib/studio/deriveThemeVariant";
import { PrimitiveColor, ColorValue, resolvePalette } from "@/lib/studio/tokenGraph";
import type { ComponentName, ComponentTokenSet } from "@/types/designSystem";
import type { Selection } from "@/lib/studio/componentSelection";
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

// Each preset is a complete 5-token palette, muted included, so the swatch
// shown here actually matches the colors it applies (see applyPalette below).
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

// Each of the 5 roles holds either a literal hex ("Custom" in the UI) or a
// reference to a named entry in state.primitives ("Linked") — see
// lib/studio/tokenGraph.ts. Resolution to plain hex happens once, in
// resolvedLight/resolvedDark below; every other consumer (preview, export,
// save) only ever sees resolved hex.
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
  // Two independently-editable token sets — the mode toggle switches which
  // one drives the preview (see previewVars below), so it's a real dark
  // mode, not cosmetic.
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
  // Always present, manual build or AI-seeded alike, so a from-scratch
  // build can see and edit type scale and the Shadow/Spacing controls
  // further down — every Studio project is a real typographic + spacing
  // system, not just a palette.
  typeScale: TypeScale;
  spacing: SpacingScale;
  shadows: ShadowScale;
  // The "advanced" layer (per-component tokens, accessibility, icon style,
  // grid, breakpoints) is optional. A manual build starts without one; the
  // "Enable component tokens" action synthesizes a real starting one.
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

// The from-scratch dark default ONLY. Don't reintroduce this as a fallback
// for branded paths — anywhere a light palette is known (URL seed, AI
// result, saved project), dark must be derived from it via
// deriveDarkPaletteTokens, or every brand ends up sharing this exact violet set.
const DEFAULT_DARK: PaletteTokens = {
  accent: "#8B5CF6",
  support: "#22D3EE",
  surface: "#121022",
  ink: "#E6E1F5",
  muted: "#6B6483",
};

// Fixed ids, not makePrimitiveId() — this array is built at module init,
// which also runs during SSR, and a random id there would differ between
// server-rendered HTML and the client's first render and trip a hydration
// mismatch. Starts unlinked — the Primitives panel just has a named starter
// set ready to link to, not a required migration.
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
    // the light palette, so derive dark from it — otherwise the brand's
    // light palette lands next to the stock DEFAULT_DARK and flipping to
    // Dark throws the brand away.
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
    // already provide its own explicit palette from a different source (e.g.
    // a saved theme's "Apply this edition" link) — avoids leaking a
    // stale/unrelated AI result's design system into an unrelated deep link.
    const cameFromOtherSource = Boolean(searchParams.get("accent")) && searchParams.get("from") !== "ai";
    // A project that already went through Studio once (Save) carries its own
    // primitives + role→primitive links forward as-is — re-deriving from
    // aiResult.colors on every load would silently drop manual edits (a
    // renamed/re-hexed primitive, a role relinked to a different one).
    const hasSavedPrimitiveLinks = Boolean(aiResult?.colorPrimitives && aiResult?.studioPaletteLinks?.light);
    // One Primitive per AI-generated color, with the Palette's 5 roles linked
    // to them via ColorRef (see paletteFromAIColors.ts), so state.primitives
    // and the Palette/export show the same colors instead of two unrelated
    // palettes.
    const freshDerivation =
      aiResult && !hasSavedPrimitiveLinks
        ? primitivesFromAIColors(aiResult.colors, resolvePalette(seeded.light, seeded.primitives))
        : null;
    // Hoisted so the dark fallback below can derive from the resolved light
    // palette rather than seeded.dark (still the stock DEFAULT_DARK absent a
    // URL palette). Two values because a saved project's light palette may
    // hold primitive references rather than literal hex: aiLight is what
    // Studio edits, aiLightHex is the flattened form the color math needs.
    const aiPrimitives = hasSavedPrimitiveLinks
      ? aiResult!.colorPrimitives!
      : (freshDerivation?.primitives ?? seeded.primitives);
    const aiLight = aiResult
      ? hasSavedPrimitiveLinks
        ? aiResult!.studioPaletteLinks!.light!
        : freshDerivation!.palette
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
            // See hasSavedPrimitiveLinks/freshDerivation above — saved
            // primitives/links pass through untouched; a fresh result gets
            // primitives synthesized from its own colors.
            primitives: aiPrimitives,
            // Light always traces back to aiResult.colors, the same canonical
            // source the AI results page renders and "Open in Studio" seeds
            // via URL params — never to designSystem.light, which is a
            // second, independently-generated color set that isn't
            // guaranteed to agree with it. Dark has no equivalent in
            // aiResult.colors, so designSystem.dark is the best available
            // signal there; when it's absent, derive from this brand's own
            // light palette (deriveDarkPaletteTokens), never from seeded.dark.
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
  const [selected, setSelected] = useState<Selection | null>(null);
  // Which non-default state the canvas is forcing onto the selected
  // instance for preview. Reset on every new selection so switching
  // components never leaves a stale state forced onto the new one.
  const [previewState, setPreviewState] = useState<NonDefaultState | null>(null);
  // The generated screen, when this session produced one. Switching back to
  // the showcase is a view change only — it never discards the structure, so
  // the toggle is safe to press.
  const generatedStructure = aiResult?.uiStructure;
  const [showGenerated, setShowGenerated] = useState(true);
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

  // FONTS is a small curated list for the manual builder's dropdown, but an
  // AI-generated result can seed headFont/bodyFont with any font from the
  // full ~2,000-font catalog. Unioning the current value in keeps the
  // <select> honest for those too, not just the 12 curated ones.
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
  // Everything downstream that only renders/exports (Live Preview, Export
  // drawer) reads this plain resolved hex, so those consumers never need to
  // know the token graph exists. Saving needs the raw, unresolved
  // state.light/dark/primitives too (to persist links), so handleSave
  // passes `state` itself, not this.
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

  // Falls back to the light variant when the system has no dark one, matching
  // where setComponentTokens writes — the panel must never show one variant's
  // values while edits land in another.
  const activeComponentTokens = useMemo<ComponentTokenSet | null>(() => {
    if (!selected || selected.kind !== "component" || !state.designSystem) return null;
    const variant =
      activeVariant === "dark" && state.designSystem.dark ? state.designSystem.dark : state.designSystem.light;
    // An AI-authored design system can omit components (the schema marks
    // every one optional), so deriving one from the palette on demand keeps
    // every component clickable — otherwise clicking a table on a system
    // that never mentioned tables selects it and opens nothing.
    return (
      variant.components[selected.name] ??
      deriveThemeVariantFromPalette(activeVariant === "dark" ? resolvedDark : resolvedLight).components[selected.name] ??
      null
    );
  }, [selected, state.designSystem, activeVariant, resolvedLight, resolvedDark]);

  function set<K extends keyof StudioState>(key: K, value: StudioState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  // Opening the inspector on a system with no designSystem synthesizes one
  // first, rather than showing an empty panel or refusing the click — a
  // manual build has no per-component tokens until something needs them.
  function handleSelect(next: Selection | null) {
    setSelected(next);
    setPreviewState(null);
    // Only a component selection needs component tokens to exist.
    if (next === null || next.kind !== "component") return;
    setState((s) => {
      if (s.designSystem) return s;
      const synthesized = synthesizeDesignSystemFromPalettes(
        resolvePalette(s.light, s.primitives),
        resolvePalette(s.dark, s.primitives)
      );
      // `components` starts empty rather than pre-filled with every
      // component's derived default — a pre-filled entry is a frozen hex
      // that can never react to a later palette/primitive edit. Leaving a
      // component absent lets the canvas's own var(--ds-*-bg, var(--pgc-*))
      // fallback resolve it live from the palette until someone actually
      // clicks and edits it, at which point setComponentTokens() writes a
      // real, intentionally sticky entry.
      return {
        ...s,
        designSystem: {
          ...synthesized,
          light: { ...synthesized.light, components: {} },
          dark: synthesized.dark ? { ...synthesized.dark, components: {} } : synthesized.dark,
        },
      };
    });
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

  // Clears every component's stored color rather than re-populating it from
  // the palette — an emptied component falls through to the canvas's own
  // var(--ds-*, var(--pgc-*)) fallback and stays live from then on (same
  // mechanism a newly-created design system starts in, see handleSelect).
  // This discards per-component edits and goes back to following the
  // palette; it's a confirmed action since it overwrites click-to-edit work.
  function resyncDesignSystemFromPalette() {
    if (!state.designSystem) return;
    const proceed = window.confirm(
      "Clear every component's individual colour and follow the palette live again? This discards any per-component colour edits made by clicking components on the canvas."
    );
    if (!proceed) return;
    setState((s) => ({
      ...s,
      designSystem: {
        ...s.designSystem!,
        light: { ...s.designSystem!.light, components: {} },
        dark: s.designSystem!.dark ? { ...s.designSystem!.dark, components: {} } : s.designSystem!.dark,
      },
    }));
  }

  function setToken<K extends keyof EditablePaletteTokens>(key: K, value: ColorValue) {
    setState((s) => {
      const variant = s.mode === "Dark" ? "dark" : "light";
      return { ...s, [variant]: { ...s[variant], [key]: value } };
    });
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
        <div className="flex items-center gap-2 font-mono-plex text-[11px] uppercase tracking-[0.18em] text-[#6E675C]">
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

      {/* Three columns while something is selected, two otherwise — without the extra track the inspector drops to a new row instead of sitting beside the canvas. */}
      <div
        className={cn(
          "grid grid-cols-1",
          selected ? "lg:grid-cols-[376px_1fr_288px]" : "lg:grid-cols-[376px_1fr]"
        )}
      >
        <aside className="flex flex-col gap-[30px] border-b border-black/[0.18] bg-[#F2EBE0] px-6 py-6 lg:sticky lg:top-[105px] lg:max-h-[calc(100vh-105px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div>
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#6E675C]">The Studio</div>
            <h1 className="mt-2 font-editorial-serif text-[34px] font-normal leading-[1.02] tracking-[-0.02em]">
              Compose your system.
            </h1>
            <p className="mt-2.5 text-[13px] leading-relaxed text-[#6E675C]">
              Tune every token on the left. The preview on the right is your system, live.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Identity</div>
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
              <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Palette</div>
              <div className="font-mono-plex text-[9px] uppercase tracking-[0.12em] text-[#6E675C]">
                Editing {state.mode}
              </div>
            </div>
            {state.designSystem &&
              (Object.keys(state.designSystem.light.components).length > 0 ||
                Object.keys(state.designSystem.dark?.components ?? {}).length > 0) && (
                <button
                  type="button"
                  onClick={resyncDesignSystemFromPalette}
                  className="flex items-center gap-1.5 self-start font-mono-plex text-[9px] uppercase tracking-[0.1em] text-[#222D52] hover:underline"
                  title="Some components have their own colour from being clicked and edited directly, so they no longer follow the palette. This clears those overrides so every component follows the palette live again."
                >
                  ↻ Reset components to follow palette
                </button>
              )}
            {ROLES.map((r) => {
              // A role may still hold a ColorRef internally (every role on an
              // AI-generated project does), and the swatch resolves/displays
              // that either way. Picking a new color always writes a literal
              // hex regardless — that's the entire "unlink" step, folded into
              // the same interaction as editing any other role.
              const resolvedHex = resolvedActivePalette[r.key];
              return (
                <div key={r.key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={resolvedHex}
                    onChange={(e) => setToken(r.key, e.target.value)}
                    className="studio-color-input h-10 w-10 flex-none rounded-lg shadow-[0_0_0_1px_rgba(33,30,24,0.14)]"
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[13px] text-[#211E18]">{r.label}</span>
                    <span className="font-mono-plex text-[11px] uppercase text-[#6E675C]">{resolvedHex}</span>
                  </div>
                  <span className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#6E675C]">{r.token}</span>
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
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Typography</div>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Display</span>
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
              <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Body</span>
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
              <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Accent (optional)</span>
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
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Shape &amp; density</div>
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

          <div className="flex flex-col gap-3 border-t border-black/[0.1] pt-4">
            <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Type scale</div>
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
              <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#6E675C]">Ratio</span>
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
          id="main"
          className="relative overflow-hidden"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #E7DFD1, #E7DFD1 1px, #EDE6DA 1px, #EDE6DA 11px)",
          }}
        >
          <div className="flex items-center justify-between px-6 py-3.5 font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C] sm:px-8">
            <span>Live preview</span>
            <span>
              {state.name} · {state.mode} · {state.headFont} + {state.bodyFont}
            </span>
          </div>

          <div className="px-6 pb-10 sm:px-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">Shadow</div>
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

              {generatedStructure && (
                <div className="flex items-center overflow-hidden rounded-full border border-black/[0.2]">
                  {([
                    ["Generated", true],
                    ["Showcase", false],
                  ] as const).map(([label, wantsGenerated]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        // A selected component may not exist in the state being
                        // switched to (Showcase's Modal has no Generated
                        // counterpart) — close the inspector rather than leave
                        // it open on nothing.
                        if (wantsGenerated !== showGenerated) handleSelect(null);
                        setShowGenerated(wantsGenerated);
                      }}
                      className={cn(
                        "px-3.5 py-1.5 font-mono-plex text-[10px] uppercase tracking-[0.12em]",
                        showGenerated === wantsGenerated ? "bg-[#222D52] text-[#F2EBE0]" : "text-[#6E675C]"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

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
              previewState={previewState}
            >
              {showGenerated && generatedStructure ? (
                <GeneratedContent structure={generatedStructure} />
              ) : (
                <ShowcaseContent systemName={state.name} />
              )}
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

        {/* Mounted only while something is selected, so the canvas gets full width otherwise. */}
        {selected && (
          <ComponentInspector
            selection={selected}
            variant={activeVariant}
            tokens={activeComponentTokens}
            radius={state.radius}
            headFont={state.headFont}
            bodyFont={state.bodyFont}
            typeScale={state.typeScale}
            previewState={previewState}
            onPreviewStateChange={setPreviewState}
            onTokensChange={(next) => {
              if (selected.kind === "component") setComponentTokens(selected.name, next);
            }}
            onRadiusChange={(r) => set("radius", r)}
            onHeadFontChange={(f) => set("headFont", f)}
            onBodyFontChange={(f) => set("bodyFont", f)}
            onBaseSizeChange={(size) => set("typeScale", generateTypeScale(size, state.typeScale.ratioName))}
            onClose={() => {
              setSelected(null);
              setPreviewState(null);
            }}
          />
        )}
      </div>

      {exportOpen && <ExportDrawer tokens={resolvedState} onClose={() => setExportOpen(false)} />}
    </div>
  );
}
