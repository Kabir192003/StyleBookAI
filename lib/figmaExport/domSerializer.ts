/**
 * Serializes the **real rendered Studio canvas** into the Figma payload by
 * walking the DOM and reading computed styles.
 *
 * This replaced a hand-written server-side rebuild of the page. That
 * approach could not work: it was a second implementation of
 * ShowcaseContent/GeneratedContent that had to be kept in sync by hand, so
 * every export was a near-miss — wrong padding, missing sections, a
 * "dropdown" that was really a rounded box, a table that was a stack of
 * text. Reading the DOM makes the export exact *by construction*: whatever
 * the browser painted is what Figma receives, and a change to any component
 * or to styles.ts propagates with no edit here.
 *
 * Client-only — it needs `getComputedStyle`/`getBoundingClientRect` and the
 * live canvas element. The rest of lib/figmaExport stays server-safe.
 */
"use client";

import type {
  FigmaColor,
  FigmaFrameNode,
  FigmaLayout,
  FigmaShadow,
  FigmaStroke,
  FigmaTextStyle,
} from "./types";

// ---------------------------------------------------------------------------
// Colour

/**
 * Normalises *any* CSS colour the browser can parse — including the
 * `color(srgb …)` and `oklab(…)` forms `color-mix()` resolves to, which the
 * component library uses heavily for hover/active states — by painting one
 * pixel and reading it back. String-parsing each notation by hand would
 * silently mis-handle exactly the states this export most needs to get right.
 */
let probeCtx: CanvasRenderingContext2D | null = null;
function colorToRgba(css: string): FigmaColor | null {
  if (!css || css === "none" || css === "transparent") return null;
  if (!probeCtx) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    probeCtx = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!probeCtx) return null;
  probeCtx.clearRect(0, 0, 1, 1);
  probeCtx.fillStyle = "#000";
  probeCtx.fillStyle = css;
  // An unparseable colour leaves fillStyle at the previous value, which would
  // silently paint black; bail instead so the caller can omit the fill.
  probeCtx.clearRect(0, 0, 1, 1);
  probeCtx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data;
  if (a === 0) return null;
  return { r, g, b, a: a / 255 };
}

function px(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// Box decoration

function readStroke(cs: CSSStyleDeclaration): FigmaStroke | undefined {
  const sides = [
    { w: px(cs.borderTopWidth), c: cs.borderTopColor, style: cs.borderTopStyle },
    { w: px(cs.borderRightWidth), c: cs.borderRightColor, style: cs.borderRightStyle },
    { w: px(cs.borderBottomWidth), c: cs.borderBottomColor, style: cs.borderBottomStyle },
    { w: px(cs.borderLeftWidth), c: cs.borderLeftColor, style: cs.borderLeftStyle },
  ].map((s) => (s.style === "none" || s.style === "hidden" ? { ...s, w: 0 } : s));

  const painted = sides.find((s) => s.w > 0);
  if (!painted) return undefined;
  const color = colorToRgba(painted.c);
  if (!color) return undefined;
  return { color, top: sides[0].w, right: sides[1].w, bottom: sides[2].w, left: sides[3].w };
}

function readRadius(cs: CSSStyleDeclaration, rect: DOMRect) {
  // Percentage radii (border-radius: 50% on avatars/dots) resolve against the
  // element's own box, so they must be converted here — Figma corner radii are
  // absolute px and a raw "50" would be a mild rounding instead of a circle.
  const toPx = (v: string, axis: number) => (v.trim().endsWith("%") ? (parseFloat(v) / 100) * axis : px(v));
  const pair = (v: string) => {
    const parts = v.split(" ");
    return toPx(parts[0], Math.min(rect.width, rect.height));
  };
  const tl = pair(cs.borderTopLeftRadius);
  const tr = pair(cs.borderTopRightRadius);
  const br = pair(cs.borderBottomRightRadius);
  const bl = pair(cs.borderBottomLeftRadius);
  if (!tl && !tr && !br && !bl) return undefined;
  const cap = Math.min(rect.width, rect.height) / 2;
  return { tl: Math.min(tl, cap), tr: Math.min(tr, cap), br: Math.min(br, cap), bl: Math.min(bl, cap) };
}

/** Splits a computed `box-shadow` into layers. Values arrive resolved
 *  (colour first or last depending on authoring), so this tolerates both. */
function readShadows(value: string): FigmaShadow[] | undefined {
  if (!value || value === "none") return undefined;
  const layers: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      layers.push(current);
      current = "";
    } else current += ch;
  }
  if (current.trim()) layers.push(current);

  const shadows: FigmaShadow[] = [];
  for (const layer of layers) {
    const inset = layer.includes("inset");
    const cleaned = layer.replace("inset", "").trim();
    const colorMatch = cleaned.match(/^(rgba?\([^)]*\)|color\([^)]*\)|oklab\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]+)/i);
    const rest = colorMatch ? cleaned.slice(colorMatch[0].length) : cleaned;
    const nums = rest.trim().split(/\s+/).map(px);
    const color = colorToRgba(colorMatch ? colorMatch[0] : "rgba(0,0,0,0.2)");
    if (!color || nums.length < 2) continue;
    shadows.push({ color, offsetX: nums[0], offsetY: nums[1], blur: nums[2] ?? 0, spread: nums[3] ?? 0, inset });
  }
  return shadows.length ? shadows : undefined;
}

// ---------------------------------------------------------------------------
// Layout

const JUSTIFY: Record<string, FigmaLayout["primaryAlign"]> = {
  "flex-start": "MIN",
  start: "MIN",
  left: "MIN",
  center: "CENTER",
  "flex-end": "MAX",
  end: "MAX",
  right: "MAX",
  "space-between": "SPACE_BETWEEN",
};

const ALIGN: Record<string, FigmaLayout["counterAlign"]> = {
  "flex-start": "MIN",
  start: "MIN",
  center: "CENTER",
  "flex-end": "MAX",
  end: "MAX",
  baseline: "BASELINE",
  stretch: "MIN",
  normal: "MIN",
};

/**
 * Only real CSS flex containers become Figma auto-layout. Everything else
 * (block, grid, inline) is emitted with `layout.direction: "NONE"` and its
 * children placed at measured offsets.
 *
 * Grid is deliberately in the second group: `.pg-grid` is
 * `repeat(auto-fit, minmax(210px, 1fr))`, whose column count depends on the
 * rendered width. Reconstructing that as nested auto-layout rows would
 * re-flow the moment anything resizes in Figma and stop matching the canvas.
 * Absolute placement from the measured rects is exact, and every child is
 * still a fully editable layer.
 */
function readLayout(cs: CSSStyleDeclaration): FigmaLayout {
  const display = cs.display;
  const isFlex = display === "flex" || display === "inline-flex";
  if (!isFlex) return { direction: "NONE" };

  const column = cs.flexDirection.startsWith("column");
  const wrap = cs.flexWrap === "wrap" || cs.flexWrap === "wrap-reverse";
  // A wrapping flex row has the same reflow problem as grid, so it is also
  // placed absolutely rather than guessed at.
  if (wrap) return { direction: "NONE" };

  const gapSource = column ? cs.rowGap : cs.columnGap;
  return {
    direction: column ? "VERTICAL" : "HORIZONTAL",
    gap: gapSource === "normal" ? 0 : px(gapSource),
    padding: [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)],
    primaryAlign: JUSTIFY[cs.justifyContent] ?? "MIN",
    counterAlign: ALIGN[cs.alignItems] ?? "MIN",
  };
}

// ---------------------------------------------------------------------------
// Text

const DECORATION: Record<string, FigmaTextStyle["decoration"]> = {
  underline: "UNDERLINE",
  "line-through": "STRIKETHROUGH",
};

const TEXT_ALIGN: Record<string, FigmaTextStyle["align"]> = {
  left: "LEFT",
  start: "LEFT",
  center: "CENTER",
  right: "RIGHT",
  end: "RIGHT",
  justify: "JUSTIFIED",
};

function firstFamily(fontFamily: string): string {
  const first = fontFamily.split(",")[0] ?? "";
  return first.trim().replace(/^["']|["']$/g, "") || "Inter";
}

function applyTransform(text: string, transform: string): { text: string; transformed: boolean } {
  if (transform === "uppercase") return { text: text.toUpperCase(), transformed: true };
  if (transform === "lowercase") return { text: text.toLowerCase(), transformed: true };
  if (transform === "capitalize") {
    return { text: text.replace(/\b\w/g, (c) => c.toUpperCase()), transformed: true };
  }
  return { text, transformed: false };
}

/**
 * How many line boxes a run of text occupies, counted from the rectangles
 * the browser actually laid out rather than inferred from height ÷
 * line-height (which rounds badly once line-height is `normal`).
 *
 * `getClientRects()` returns one rect per line box for a plain text run, but
 * can return several on the same line when inline children split it — so
 * distinct `top` values are counted, not raw rects.
 */
function countLines(range: Range): number {
  const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0.5 && r.height > 0.5);
  if (rects.length === 0) return 1;
  const tops = new Set(rects.map((r) => Math.round(r.top)));
  return Math.max(1, tops.size);
}

function lineCountOf(el: Element): number {
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    const count = countLines(range);
    range.detach();
    return count;
  } catch {
    return 1;
  }
}

function readText(cs: CSSStyleDeclaration, raw: string, lineCount = 1): FigmaTextStyle | null {
  const { text, transformed } = applyTransform(raw.replace(/\s+/g, " ").trim(), cs.textTransform);
  if (!text) return null;
  const color = colorToRgba(cs.color) ?? { r: 0, g: 0, b: 0, a: 1 };
  const lineHeight = cs.lineHeight === "normal" ? null : px(cs.lineHeight);
  return {
    lineCount,
    characters: text,
    fontFamily: firstFamily(cs.fontFamily),
    fontWeight: parseInt(cs.fontWeight, 10) || 400,
    italic: cs.fontStyle === "italic" || cs.fontStyle === "oblique",
    fontSize: px(cs.fontSize),
    lineHeight,
    letterSpacing: cs.letterSpacing === "normal" ? 0 : px(cs.letterSpacing),
    color,
    align: TEXT_ALIGN[cs.textAlign] ?? "LEFT",
    transformed,
    decoration: DECORATION[cs.textDecorationLine] ?? "NONE",
  };
}

/** The visible string for a form control, which has no text children. */
function controlText(el: Element): string | null {
  if (el instanceof HTMLInputElement) {
    if (el.type === "checkbox" || el.type === "radio" || el.type === "range" || el.type === "color") return null;
    return el.value || el.placeholder || null;
  }
  if (el instanceof HTMLTextAreaElement) return el.value || el.placeholder || null;
  if (el instanceof HTMLSelectElement) return el.selectedOptions[0]?.textContent ?? null;
  return null;
}

// ---------------------------------------------------------------------------
// Walk

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "OPTION", "BR"]);

function isVisible(el: Element, cs: CSSStyleDeclaration, rect: DOMRect): boolean {
  if (SKIP_TAGS.has(el.tagName)) return false;
  if (cs.display === "none" || cs.visibility === "hidden" || px(cs.opacity) === 0) return false;
  if (rect.width < 0.5 || rect.height < 0.5) return false;
  // The screen-reader-only pattern (1px clipped box) would otherwise emit
  // stray 1px layers all over the Figma file.
  if (rect.width <= 1 && rect.height <= 1) return false;
  return true;
}

function nameFor(el: Element, text: string | null): string {
  if (text) return text.slice(0, 40);
  const cls = typeof el.className === "string" ? el.className.split(/\s+/).find((c) => c.startsWith("pg-")) : null;
  return cls ?? el.tagName.toLowerCase();
}

/**
 * Walks one element into a node tree.
 *
 * `origin` is the parent's *padding-box* top-left in viewport coordinates,
 * so a child's measured rect converts to a parent-relative offset — which is
 * what Figma wants both for absolute placement and for sanity-checking
 * auto-layout results.
 */
function walk(el: Element, originX: number, originY: number, parentIsAutoLayout: boolean, depth: number): FigmaFrameNode | null {
  if (depth > 40) return null; // pathological nesting guard; the real canvas is ~12 deep
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  if (!isVisible(el, cs, rect)) return null;

  const node: Partial<FigmaFrameNode> = {
    rect: { x: rect.left - originX, y: rect.top - originY, width: rect.width, height: rect.height },
    absolute: !parentIsAutoLayout,
  };

  const opacity = px(cs.opacity);
  if (opacity > 0 && opacity < 1) node.opacity = opacity;

  // --- SVG: hand the whole thing to figma.createNodeFromSvg untouched.
  if (el.tagName.toLowerCase() === "svg") {
    return {
      ...(node as FigmaFrameNode),
      kind: "vector",
      name: nameFor(el, null),
      iconSvg: el.outerHTML,
    };
  }

  const fill = colorToRgba(cs.backgroundColor) ?? undefined;
  const stroke = readStroke(cs);
  const radius = readRadius(cs, rect);
  const shadows = readShadows(cs.boxShadow);

  // --- Text leaf: no element children, or a form control carrying a value.
  const elementChildren = Array.from(el.children).filter((c) => !SKIP_TAGS.has(c.tagName));
  const ownText = controlText(el) ?? (elementChildren.length === 0 ? el.textContent ?? "" : "");
  if (elementChildren.length === 0) {
    const text = readText(cs, ownText, lineCountOf(el));
    if (text) {
      // Wrap in a frame only when the text box itself is decorated (a pill
      // badge, an input); otherwise emit the text node directly so a designer
      // gets a real editable text layer, not a box containing one.
      const bare: FigmaFrameNode = { ...(node as FigmaFrameNode), kind: "text", name: nameFor(el, text.characters), text };
      if (!fill && !stroke && !shadows) return bare;
      return {
        ...(node as FigmaFrameNode),
        kind: "frame",
        name: nameFor(el, text.characters),
        fill,
        stroke,
        radius,
        shadows,
        layout: readLayout(cs),
        children: [
          {
            kind: "text",
            name: text.characters.slice(0, 40),
            // Inset by the control's own padding so the label sits where it
            // does on screen rather than at the frame's corner.
            rect: {
              x: px(cs.paddingLeft) + px(cs.borderLeftWidth),
              y: px(cs.paddingTop) + px(cs.borderTopWidth),
              width: Math.max(0, rect.width - px(cs.paddingLeft) - px(cs.paddingRight) - px(cs.borderLeftWidth) - px(cs.borderRightWidth)),
              height: Math.max(0, rect.height - px(cs.paddingTop) - px(cs.paddingBottom) - px(cs.borderTopWidth) - px(cs.borderBottomWidth)),
            },
            absolute: readLayout(cs).direction === "NONE",
            text,
          },
        ],
      };
    }
    // Decoration-only leaf (a swatch, a divider, a progress fill).
    if (!fill && !stroke && !shadows) return null;
    return { ...(node as FigmaFrameNode), kind: "frame", name: nameFor(el, null), fill, stroke, radius, shadows };
  }

  // --- Container.
  const layout = readLayout(cs);
  const childOriginX = rect.left + px(cs.borderLeftWidth) + (layout.direction === "NONE" ? 0 : px(cs.paddingLeft));
  const childOriginY = rect.top + px(cs.borderTopWidth) + (layout.direction === "NONE" ? 0 : px(cs.paddingTop));
  const isAuto = layout.direction !== "NONE";

  const children: FigmaFrameNode[] = [];

  // Direct text sitting alongside element children (e.g. a table cell with a
  // nested badge) would be dropped entirely by a children-only walk, so each
  // run is measured with a Range and placed on its own.
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const raw = child.textContent ?? "";
      if (!raw.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(child);
      const tr = range.getBoundingClientRect();
      const runLines = countLines(range);
      range.detach();
      if (tr.width < 0.5 || tr.height < 0.5) continue;
      const text = readText(cs, raw, runLines);
      if (!text) continue;
      children.push({
        kind: "text",
        name: text.characters.slice(0, 40),
        rect: { x: tr.left - childOriginX, y: tr.top - childOriginY, width: tr.width, height: tr.height },
        absolute: !isAuto,
        text,
      });
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const built = walk(child as Element, childOriginX, childOriginY, isAuto, depth + 1);
    if (built) children.push(built);
  }

  return {
    ...(node as FigmaFrameNode),
    kind: "frame",
    name: nameFor(el, null),
    layout,
    fill,
    stroke,
    radius,
    shadows,
    clipsContent: cs.overflow === "hidden" || cs.overflowX === "hidden" || cs.overflowY === "hidden",
    children,
  };
}

/** Serializes one element (and everything inside it) as a standalone tree. */
export function serializeElement(el: HTMLElement, name?: string): FigmaFrameNode | null {
  const rect = el.getBoundingClientRect();
  const node = walk(el, rect.left, rect.top, false, 0);
  if (!node) return null;
  node.rect = { x: 0, y: 0, width: rect.width, height: rect.height };
  node.absolute = false;
  if (name) node.name = name;
  return node;
}
