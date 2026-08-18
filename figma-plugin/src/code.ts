/**
 * Main thread (has Plugin API access, no DOM). Fetches a payload from
 * StyleBook and rebuilds it as real Figma layers.
 *
 * The payload is a serialization of StyleBook's live canvas DOM, so this
 * side is a fairly mechanical translator: measured rect → size/position,
 * computed CSS → fills/strokes/effects/text style. It deliberately does not
 * re-derive or re-guess anything — every "smart" reconstruction attempt
 * (rebuilding layouts from token values, inferring component shapes) is what
 * made earlier versions drift from what the browser actually painted.
 *
 * Defensive per node: one bad node (an unavailable font, a malformed SVG)
 * is skipped with a warning rather than aborting the whole import.
 */
import type {
  FigmaColor,
  FigmaComponentSet,
  FigmaExportPayload,
  FigmaFrameNode,
  FigmaShadow,
  FigmaTextStyle,
  FigmaVariables,
} from "./types";

figma.showUI(__html__, { width: 360, height: 300 });

type Warning = string;

figma.ui.onmessage = async (msg: { type: string; code?: string }) => {
  if (msg.type !== "import" || !msg.code) return;

  try {
    const payload = await fetchPayload(msg.code.trim().toUpperCase());
    if (payload.schemaVersion !== 2) {
      figma.ui.postMessage({
        type: "error",
        message: "This export came from a different StyleBook version — rebuild the plugin (npm run build) and retry.",
      });
      return;
    }

    const warnings: Warning[] = [];
    await buildVariables(payload.variables);

    const placed: SceneNode[] = [];
    let libraryStartY = 0;

    if (payload.canvas) {
      const root = await buildNode(payload.canvas, warnings);
      if (root) {
        figma.currentPage.appendChild(root);
        root.x = 0;
        root.y = 0;
        placed.push(root);
        libraryStartY = root.height + 200;
      }
    }
    if (payload.componentLibrary && payload.componentLibrary.length > 0) {
      const sets = await buildComponentLibrary(payload.componentLibrary, warnings, libraryStartY);
      placed.push(...sets);
    }

    if (placed.length > 0) {
      figma.currentPage.selection = placed;
      figma.viewport.scrollAndZoomIntoView(placed);
    }

    figma.ui.postMessage({ type: "done", warnings });
    figma.notify(`Imported ${payload.meta.name}${warnings.length ? ` (${warnings.length} warnings)` : ""}`);
  } catch (err) {
    console.error("StyleBook Import failed:", err);
    const message =
      err instanceof Error
        ? err.message
        : `Import failed: ${typeof err === "string" ? err : JSON.stringify(err)} — see Plugins > Development > Open Console.`;
    figma.ui.postMessage({ type: "error", message });
  }
};

async function fetchPayload(code: string): Promise<FigmaExportPayload> {
  // Defaults to the deployed StyleBook site, matching manifest.json's
  // allowedDomains. Override for local dev by setting `stylebookApiBase` in
  // the file's plugin data — manifest.json's devAllowedDomains already
  // permits localhost when testing an unpublished dev build.
  const base = figma.root.getPluginData("stylebookApiBase") || "https://style-book-ai.vercel.app";
  const res = await fetch(`${base}/api/figma-export/${code}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Import failed — check the code and try again.");
  return data as FigmaExportPayload;
}

// ---------------------------------------------------------------------------
// Paint helpers

function toRgb(c: FigmaColor): RGB {
  return { r: c.r / 255, g: c.g / 255, b: c.b / 255 };
}

function solid(c: FigmaColor): SolidPaint {
  return { type: "SOLID", color: toRgb(c), opacity: c.a };
}

// ---------------------------------------------------------------------------
// Variables
//
// The imported page is a flat snapshot of one theme; the Variable Collection
// is what makes it re-themeable afterwards, which is the whole reason to
// keep emitting it alongside the DOM capture.

async function buildVariables(vars: FigmaVariables): Promise<void> {
  const collection = figma.variables.createVariableCollection("StyleBook Tokens");
  const lightModeId = collection.modes[0].modeId;
  collection.renameMode(lightModeId, "Light");
  const darkModeId = collection.addMode("Dark");

  for (const name of Object.keys(vars.color)) {
    const value = vars.color[name];
    const v = figma.variables.createVariable(`color/${name}`, collection, "COLOR");
    v.setValueForMode(lightModeId, hexToRgba(value.light));
    v.setValueForMode(darkModeId, hexToRgba(value.dark || value.light));
  }
  vars.spacing.forEach((px, i) => {
    const v = figma.variables.createVariable(`spacing/${i + 1}`, collection, "FLOAT");
    v.setValueForMode(lightModeId, px);
    v.setValueForMode(darkModeId, px);
  });
  for (const key of Object.keys(vars.radius)) {
    const px = (vars.radius as unknown as Record<string, number>)[key];
    const v = figma.variables.createVariable(`radius/${key}`, collection, "FLOAT");
    v.setValueForMode(lightModeId, px);
    v.setValueForMode(darkModeId, px);
  }
  for (const key of Object.keys(vars.typeSize)) {
    const v = figma.variables.createVariable(`fontSize/${key}`, collection, "FLOAT");
    v.setValueForMode(lightModeId, vars.typeSize[key]);
    v.setValueForMode(darkModeId, vars.typeSize[key]);
  }
}

function hexToRgba(hex: string): RGBA {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const a = clean.length >= 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

// ---------------------------------------------------------------------------
// Fonts

/** Figma names weights as styles, and families disagree about the exact
 *  spelling ("SemiBold" vs "Semi Bold"), so each weight carries candidates
 *  and the first that loads wins. */
const WEIGHT_STYLES: Record<number, string[]> = {
  100: ["Thin", "Hairline"],
  200: ["ExtraLight", "Extra Light", "UltraLight"],
  300: ["Light"],
  400: ["Regular", "Normal", "Book"],
  500: ["Medium"],
  600: ["SemiBold", "Semi Bold", "DemiBold", "Demi Bold"],
  700: ["Bold"],
  800: ["ExtraBold", "Extra Bold", "UltraBold"],
  900: ["Black", "Heavy"],
};

const fontCache = new Map<string, FontName | null>();

function nearestWeight(weight: number): number {
  const steps = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  let best = 400;
  let bestDelta = Infinity;
  for (const step of steps) {
    const delta = Math.abs(step - weight);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = step;
    }
  }
  return best;
}

async function resolveFont(family: string, weight: number, italic: boolean): Promise<FontName> {
  const key = `${family}|${weight}|${italic}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const candidates: FontName[] = [];
  const push = (fam: string, style: string) => candidates.push({ family: fam, style });

  const styles = WEIGHT_STYLES[nearestWeight(weight)] || ["Regular"];
  for (const style of styles) {
    if (italic) push(family, `${style} Italic`);
    push(family, style);
  }
  // Same family at a normal weight, then the app's own fallback face, so a
  // missing weight degrades within the brand before leaving it entirely.
  if (italic) push(family, "Italic");
  push(family, "Regular");
  for (const style of styles) push("Inter", style);
  push("Inter", "Regular");

  for (const candidate of candidates) {
    try {
      await figma.loadFontAsync(candidate);
      fontCache.set(key, candidate);
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  const fallback: FontName = { family: "Inter", style: "Regular" };
  await figma.loadFontAsync(fallback);
  fontCache.set(key, fallback);
  return fallback;
}

// ---------------------------------------------------------------------------
// Node building

async function buildNode(node: FigmaFrameNode, warnings: Warning[]): Promise<SceneNode | null> {
  try {
    if (node.kind === "vector") return buildVector(node, warnings);
    if (node.kind === "text") return await buildText(node, warnings);
    return await buildFrame(node, warnings);
  } catch (err) {
    warnings.push(`Skipped "${node.name}": ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

function applyDecoration(frame: FrameNode | ComponentNode, node: FigmaFrameNode): void {
  // createFrame() starts with an opaque white fill; every node here states
  // its own fill explicitly, and "no fill" genuinely means transparent.
  frame.fills = node.fill ? [solid(node.fill)] : [];

  if (node.stroke) {
    frame.strokes = [solid(node.stroke.color)];
    frame.strokeAlign = "INSIDE"; // CSS borders sit inside the border-box
    frame.strokeTopWeight = node.stroke.top;
    frame.strokeRightWeight = node.stroke.right;
    frame.strokeBottomWeight = node.stroke.bottom;
    frame.strokeLeftWeight = node.stroke.left;
  } else {
    frame.strokes = [];
  }

  if (node.radius) {
    frame.topLeftRadius = node.radius.tl;
    frame.topRightRadius = node.radius.tr;
    frame.bottomRightRadius = node.radius.br;
    frame.bottomLeftRadius = node.radius.bl;
  }

  if (node.shadows && node.shadows.length > 0) {
    frame.effects = node.shadows.map(
      (s: FigmaShadow): DropShadowEffect | InnerShadowEffect => ({
        type: s.inset ? "INNER_SHADOW" : "DROP_SHADOW",
        color: { r: s.color.r / 255, g: s.color.g / 255, b: s.color.b / 255, a: s.color.a },
        offset: { x: s.offsetX, y: s.offsetY },
        radius: s.blur,
        spread: s.spread,
        visible: true,
        blendMode: "NORMAL",
      })
    );
  }

  if (node.opacity !== undefined) frame.opacity = node.opacity;
  frame.clipsContent = node.clipsContent === true;
}

async function buildFrame(node: FigmaFrameNode, warnings: Warning[]): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = node.name;
  frame.resize(Math.max(node.rect.width, 0.01), Math.max(node.rect.height, 0.01));
  applyDecoration(frame, node);

  const layout = node.layout;
  const auto = !!layout && layout.direction !== "NONE";
  if (auto && layout) {
    frame.layoutMode = layout.direction as "HORIZONTAL" | "VERTICAL";
    frame.itemSpacing = layout.gap || 0;
    if (layout.padding) {
      frame.paddingTop = layout.padding[0];
      frame.paddingRight = layout.padding[1];
      frame.paddingBottom = layout.padding[2];
      frame.paddingLeft = layout.padding[3];
    }
    if (layout.primaryAlign) frame.primaryAxisAlignItems = layout.primaryAlign;
    if (layout.counterAlign) frame.counterAxisAlignItems = layout.counterAlign;
    // Sizes are measured, not inferred, so both axes stay fixed — letting
    // Figma re-hug would recompute a layout the browser already resolved and
    // reintroduce exactly the drift this rewrite removes.
    frame.primaryAxisSizingMode = "FIXED";
    frame.counterAxisSizingMode = "FIXED";
  } else {
    frame.layoutMode = "NONE";
  }

  for (const child of node.children || []) {
    const built = await buildNode(child, warnings);
    if (!built) continue;
    frame.appendChild(built);
    if (auto) {
      // Keep the measured size inside an auto-layout parent — except for
      // single-line text, which is deliberately left hugging so it can't be
      // re-wrapped by Figma's slightly different text metrics (see buildText).
      // Forcing FIXED here would pin it back to the measured width and
      // reintroduce exactly the wrapping this avoids.
      const hugsToAvoidWrapping = child.kind === "text" && (child.text?.lineCount ?? 1) <= 1;
      if (!hugsToAvoidWrapping && "layoutSizingHorizontal" in built) {
        try {
          (built as FrameNode).layoutSizingHorizontal = "FIXED";
          (built as FrameNode).layoutSizingVertical = "FIXED";
        } catch {
          // Text nodes with auto-resize refuse FIXED until resized; harmless.
        }
      }
      if (child.absolute) {
        (built as FrameNode).layoutPositioning = "ABSOLUTE";
        built.x = child.rect.x;
        built.y = child.rect.y;
      }
    } else {
      built.x = child.rect.x;
      built.y = child.rect.y;
    }
  }

  // Re-assert the measured box: appending children into an auto-layout frame
  // can grow it past what the browser actually painted.
  if (auto) {
    frame.resize(Math.max(node.rect.width, 0.01), Math.max(node.rect.height, 0.01));
  }

  return frame;
}

async function buildText(node: FigmaFrameNode, warnings: Warning[]): Promise<TextNode> {
  const t = node.text as FigmaTextStyle;
  const font = await resolveFont(t.fontFamily, t.fontWeight, t.italic);
  if (font.family !== t.fontFamily) {
    warnings.push(`"${t.fontFamily}" isn't available in Figma — used ${font.family} ${font.style} instead.`);
  }

  const text = figma.createText();
  text.fontName = font;
  text.characters = t.characters;
  text.name = node.name || t.characters.slice(0, 40);
  text.fontSize = t.fontSize;
  text.fills = [solid(t.color)];
  text.textAlignHorizontal = t.align;
  if (t.decoration !== "NONE") text.textDecoration = t.decoration;
  if (t.letterSpacing) text.letterSpacing = { unit: "PIXELS", value: t.letterSpacing };
  if (t.lineHeight !== null) text.lineHeight = { unit: "PIXELS", value: t.lineHeight };

  // Sizing is the difference between a clean import and a mangled one.
  //
  // Pinning every node to its measured box looks right in principle but
  // fails in practice: Figma's text engine measures a little differently
  // from the browser, so any string that comes out even a pixel wider wraps
  // to a second line, and since siblings sit at fixed offsets that extra
  // line lands on top of whatever is below it. That's what turned "Northwind"
  // into "Northw/ind" and dropped field hints onto the next label.
  //
  // So: text the browser kept on one line hugs its own width, which makes
  // wrapping structurally impossible regardless of metric differences. Text
  // the browser genuinely wrapped keeps the measured width — that width is
  // what produced the wrap — and is free to grow in height so a differently
  // placed break lengthens the block instead of clipping it.
  if (t.lineCount > 1) {
    text.textAutoResize = "HEIGHT";
    text.resize(Math.max(node.rect.width, 1), Math.max(node.rect.height, 1));
  } else {
    text.textAutoResize = "WIDTH_AND_HEIGHT";
  }
  if (node.opacity !== undefined) text.opacity = node.opacity;

  return text;
}

function buildVector(node: FigmaFrameNode, warnings: Warning[]): SceneNode | null {
  if (!node.iconSvg) return null;
  try {
    const vector = figma.createNodeFromSvg(node.iconSvg);
    vector.name = node.name;
    vector.resize(Math.max(node.rect.width, 0.01), Math.max(node.rect.height, 0.01));
    return vector;
  } catch (err) {
    warnings.push(`Couldn't import icon "${node.name}": ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Component library → variant component sets

const ROW_MAX_WIDTH = 2600;

async function buildComponentLibrary(sets: FigmaComponentSet[], warnings: Warning[], startY: number): Promise<SceneNode[]> {
  const page = figma.currentPage;
  const placed: SceneNode[] = [];
  let x = 0;
  let y = startY;
  let rowHeight = 0;

  for (const set of sets) {
    const components: ComponentNode[] = [];

    for (const entry of set.states) {
      const built = await buildNode(entry.node, warnings);
      if (!built) continue;
      // createComponentFromNode wraps whatever it's given; building the frame
      // first keeps one code path for every node type.
      const component = figma.createComponentFromNode(built);
      component.name = `State=${entry.state}`;
      components.push(component);
    }

    if (components.length === 0) {
      warnings.push(`No states could be built for ${set.label} (${set.variant}).`);
      continue;
    }

    let container: SceneNode;
    if (components.length > 1) {
      const combined = figma.combineAsVariants(components, page);
      combined.name = `${set.label} — ${set.variant}`;
      combined.layoutMode = "HORIZONTAL";
      combined.itemSpacing = 24;
      combined.paddingTop = 24;
      combined.paddingBottom = 24;
      combined.paddingLeft = 24;
      combined.paddingRight = 24;
      combined.primaryAxisSizingMode = "AUTO";
      combined.counterAxisSizingMode = "AUTO";
      combined.counterAxisAlignItems = "CENTER";
      container = combined;
    } else {
      components[0].name = `${set.label} — ${set.variant}`;
      container = components[0];
    }

    if (x > 0 && x + container.width > ROW_MAX_WIDTH) {
      x = 0;
      y += rowHeight + 120; // headroom for Figma's floating layer labels
      rowHeight = 0;
    }
    container.x = x;
    container.y = y;
    x += container.width + 64;
    rowHeight = Math.max(rowHeight, container.height);
    placed.push(container);
  }

  return placed;
}
