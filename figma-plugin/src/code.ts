/**
 * Main thread (has Plugin API access, no DOM). Receives a redemption code
 * from ui.ts, fetches the payload from StyleBook (allow-listed in
 * manifest.json), builds one Variable Collection, then walks
 * componentLibrary/canvas building real Auto Layout frames bound to those
 * variables.
 *
 * Written defensively per node/text/icon — one bad node (unsupported font,
 * malformed SVG) is skipped with a console warning rather than aborting the
 * whole import, so a partial payload still produces a partial, useful
 * result (see the plan's error/edge-case section).
 */
import type { FigmaComponentSet, FigmaExportPayload, FigmaFrameNode, FigmaPaint, FigmaVariables } from "./types";

figma.showUI(__html__, { width: 360, height: 280 });

type Warning = string;

figma.ui.onmessage = async (msg: { type: string; code?: string }) => {
  if (msg.type !== "import" || !msg.code) return;

  try {
    const payload = await fetchPayload(msg.code.trim().toUpperCase());
    if (payload.schemaVersion !== 1) {
      figma.ui.postMessage({ type: "error", message: "This export was made with a newer StyleBook — update the plugin." });
      return;
    }

    const warnings: Warning[] = [];
    const colorVars = await buildVariables(payload.variables, warnings);

    // Canvas goes first and anchors at the origin; the component library
    // (if also requested) starts well below it rather than also at (0,0) —
    // placing everything at the same origin was stacking the canvas root
    // and every component set directly on top of each other.
    let created = 0;
    let libraryStartY = 0;
    if (payload.canvas) {
      const root = await buildFrameTree(payload.canvas, payload.variables, colorVars, warnings);
      if (root) {
        figma.currentPage.appendChild(root);
        root.x = 0;
        root.y = 0;
        libraryStartY = root.height + 200;
      }
      created += 1;
    }
    if (payload.componentLibrary?.length) {
      await buildComponentLibrary(payload.componentLibrary, payload.variables, colorVars, warnings, libraryStartY);
      created += payload.componentLibrary.length;
    }

    figma.ui.postMessage({ type: "done", created, warnings });
    figma.notify(`Imported ${payload.meta.name} from StyleBook`);
  } catch (err) {
    // Always log the raw error to the plugin console (Plugins > Development
    // > Open Console) even though the UI panel only has room for a short
    // message — a bare "Import failed" with no detail is undebuggable both
    // for a user and for whoever gets asked to fix it after the fact.
    console.error("StyleBook Import failed:", err);
    const message =
      err instanceof Error
        ? err.message
        : `Import failed: ${typeof err === "string" ? err : JSON.stringify(err)} — see Plugins > Development > Open Console for detail.`;
    figma.ui.postMessage({ type: "error", message });
  }
};

async function fetchPayload(code: string): Promise<FigmaExportPayload> {
  // Defaults to the deployed StyleBook site, matching manifest.json's
  // allowedDomains. Override for local dev by setting `stylebookApiBase` in
  // the file's plugin data (figma.root.setPluginData("stylebookApiBase",
  // "http://localhost:3000")) — manifest.json's devAllowedDomains already
  // permits that origin when testing an unpublished dev build.
  const base = figma.root.getPluginData("stylebookApiBase") || "https://style-book-ai.vercel.app";
  const res = await fetch(`${base}/api/figma-export/${code}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Import failed — check the code and try again.");
  return data as FigmaExportPayload;
}

// ---------------------------------------------------------------------------
// Variables

type ColorVarMap = Record<string, Variable>;

async function buildVariables(vars: FigmaVariables, warnings: Warning[]): Promise<ColorVarMap> {
  const collection = figma.variables.createVariableCollection("StyleBook Tokens");
  const lightModeId = collection.modes[0].modeId;
  collection.renameMode(lightModeId, "Light");
  const darkModeId = collection.addMode("Dark");

  const colorVars: ColorVarMap = {};
  for (const [name, value] of Object.entries(vars.color)) {
    const v = figma.variables.createVariable(`color/${name}`, collection, "COLOR");
    v.setValueForMode(lightModeId, hexToRgba(value.light));
    v.setValueForMode(darkModeId, hexToRgba(value.dark ?? value.light));
    colorVars[name] = v;
  }

  vars.spacing.forEach((px, i) => {
    const v = figma.variables.createVariable(`spacing/${i + 1}`, collection, "FLOAT");
    v.setValueForMode(lightModeId, px);
    v.setValueForMode(darkModeId, px);
    colorVars[`spacing-${i + 1}`] = v; // stored alongside colors for lookup convenience in buildFrameTree
  });

  for (const [key, px] of Object.entries(vars.radius)) {
    const v = figma.variables.createVariable(`radius/${key}`, collection, "FLOAT");
    v.setValueForMode(lightModeId, px);
    v.setValueForMode(darkModeId, px);
    colorVars[`radius-${key}`] = v;
  }

  void warnings;
  return colorVars;
}

function hexToRgba(hex: string): RGBA {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const a = clean.length >= 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function resolvePaint(paint: FigmaPaint | undefined, colorVars: ColorVarMap): Paint | undefined {
  if (!paint) return undefined;
  if ("hex" in paint) return figma.util.solidPaint(paint.hex);
  const variable = colorVars[paint.variable];
  const base = figma.util.solidPaint(hexToFallback(paint.variable));
  return variable ? figma.variables.setBoundVariableForPaint(base, "color", variable) : base;
}

function hexToFallback(name: string): string {
  // Only reached if a referenced variable name doesn't exist in this
  // export's variables (schema drift) — a visible neutral rather than a
  // thrown error.
  void name;
  return "#8A8477";
}

// ---------------------------------------------------------------------------
// Frame tree

async function buildFrameTree(node: FigmaFrameNode, vars: FigmaVariables, colorVars: ColorVarMap, warnings: Warning[]): Promise<SceneNode | null> {
  try {
    if (node.kind === "text") return await buildText(node, colorVars, warnings);
    if (node.kind === "vector") return buildVector(node, warnings);
    return await buildFrame(node, vars, colorVars, warnings);
  } catch (err) {
    warnings.push(`Skipped "${node.name}": ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function buildFrame(node: FigmaFrameNode, vars: FigmaVariables, colorVars: ColorVarMap, warnings: Warning[]): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = node.name;

  if (node.layout && node.layout.direction !== "NONE") {
    frame.layoutMode = node.layout.direction;
    frame.itemSpacing = node.layout.gap ?? 0;
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
    if (node.layout.padding) {
      const [top, right, bottom, left] = node.layout.padding;
      frame.paddingTop = top;
      frame.paddingRight = right;
      frame.paddingBottom = bottom;
      frame.paddingLeft = left;
    }
    if (node.layout.primaryAlign) frame.primaryAxisAlignItems = node.layout.primaryAlign;
    if (node.layout.counterAlign) frame.counterAxisAlignItems = node.layout.counterAlign;
    if (node.layout.wrap) frame.layoutWrap = "WRAP";
  } else {
    frame.layoutMode = "NONE";
  }

  if (typeof node.radius === "number") frame.cornerRadius = node.radius;
  else if (node.radius) {
    const v = colorVars[`radius-${node.radius.variable}`];
    if (v) frame.setBoundVariable("topLeftRadius" as VariableBindableNodeField, v);
  }

  // figma.createFrame() defaults to an opaque white fill. Every node in this
  // export that has no `fill` in the payload means "transparent" (e.g. a
  // plain layout row inside a card) — leaving Figma's default in place
  // painted solid white boxes over content wherever a node was fill-less.
  const fillPaint = resolvePaint(node.fill, colorVars);
  frame.fills = fillPaint ? [fillPaint] : [];
  if (node.stroke) {
    const strokePaint = resolvePaint(node.stroke.paint, colorVars);
    if (strokePaint) {
      frame.strokes = [strokePaint];
      frame.strokeWeight = node.stroke.width;
    }
  }
  if (node.opacity !== undefined) frame.opacity = node.opacity;

  for (const child of node.children ?? []) {
    const built = await buildFrameTree(child, vars, colorVars, warnings);
    if (!built) continue;
    frame.appendChild(built);
    // A row laid out as "space between" (e.g. a card's price+CTA footer)
    // only has room to space its children apart if it actually fills the
    // parent's width — with the default hug-contents sizing every child
    // stayed pinned together with no gap between them at all, since the row
    // itself shrank to fit. This mirrors CSS's own default (a block-level
    // flex child stretches to its container's width unless told not to).
    if (child.layout?.primaryAlign === "SPACE_BETWEEN" && "layoutSizingHorizontal" in built) {
      (built as FrameNode).layoutSizingHorizontal = "FILL";
    }
  }

  return frame;
}

async function buildText(node: FigmaFrameNode, colorVars: ColorVarMap, warnings: Warning[]): Promise<TextNode> {
  const t = node.text!;
  const family = t.fontFamily === "display" ? "Inter" : "Inter"; // Figma can't guarantee arbitrary custom fonts are installed — Inter is StyleBook's own safe fallback everywhere a real brand font isn't available in this Figma account.
  let fontName: FontName = { family, style: t.weight >= 700 ? "Bold" : t.weight >= 600 ? "Semi Bold" : "Regular" };

  try {
    await figma.loadFontAsync(fontName);
  } catch {
    warnings.push(`Font "${family} ${fontName.style}" unavailable — used a fallback for "${node.name}".`);
    fontName = { family: "Inter", style: "Regular" };
    await figma.loadFontAsync(fontName);
  }

  const text = figma.createText();
  text.name = node.name;
  text.fontName = fontName;
  text.characters = t.characters;
  text.fontSize = t.size ?? 16;

  const fill = t.fillVar ? resolvePaint({ variable: t.fillVar }, colorVars) : t.fillHex ? resolvePaint({ hex: t.fillHex }, colorVars) : undefined;
  if (fill) text.fills = [fill];

  return text;
}

function buildVector(node: FigmaFrameNode, warnings: Warning[]): SceneNode | null {
  if (!node.iconSvg) {
    warnings.push(`Skipped icon "${node.name}": no SVG available for this V1 icon set.`);
    return null;
  }
  const vector = figma.createNodeFromSvg(node.iconSvg);
  vector.name = node.name;
  return vector;
}

// ---------------------------------------------------------------------------
// Component library → variant component sets

const LIBRARY_ROW_MAX_WIDTH = 2400;

async function buildComponentLibrary(sets: FigmaComponentSet[], vars: FigmaVariables, colorVars: ColorVarMap, warnings: Warning[], startY: number) {
  const page = figma.currentPage;
  let x = 0;
  let y = startY;
  let rowHeight = 0;

  for (const set of sets) {
    const components: ComponentNode[] = [];
    for (const { state, node } of set.states) {
      const built = await buildFrameTree(node, vars, colorVars, warnings);
      if (!built) continue;
      const component = figma.createComponentFromNode(built as FrameNode);
      component.name = `State=${state}`;
      components.push(component);
    }
    if (components.length === 0) continue;

    const combined = components.length > 1 ? figma.combineAsVariants(components, page) : components[0];
    combined.name = `${set.componentName} (${set.variant})`;
    if ("layoutMode" in combined) {
      combined.layoutMode = "HORIZONTAL";
      combined.itemSpacing = 24;
    }

    // Wrap into a new row rather than one unbounded strip 20 component sets
    // wide — each set's own width varies (a table's is much wider than a
    // badge's), so wrapping is width-based, not count-based.
    if (x > 0 && x + combined.width > LIBRARY_ROW_MAX_WIDTH) {
      x = 0;
      y += rowHeight + 48;
      rowHeight = 0;
    }
    combined.x = x;
    combined.y = y;
    x += combined.width + 48;
    rowHeight = Math.max(rowHeight, combined.height);
  }
}
