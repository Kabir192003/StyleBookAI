/**
 * Raw SVG markup for the lucide-react icons actually used in
 * ShowcaseContent/GeneratedContent/components/system, embedded directly in
 * the export payload (FigmaFrameNode.iconSvg) rather than shipped as a
 * separate asset the plugin has to bundle — one less thing that can drift
 * out of sync between the web app and a separately-shipped plugin package.
 *
 * lucide-react icons are plain 24x24 stroke paths (currentColor, 2px
 * stroke, round caps/joins) — figma.createNodeFromSvg() handles this shape
 * cleanly (its one documented rough edge is gradients, which none of these
 * have). Covers the icons used by the nav/hero/button templates this V1
 * ships with (see serializeCanvas.ts); the rest of the icons referenced
 * across the app (Download, Heart, Plus, Trash2, Star, Bell, Layers, …)
 * aren't wired into any serializer template yet — add both here and in the
 * relevant template together as canvas-export coverage grows.
 */

const STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

export const ICON_SVGS: Record<string, string> = {
  ArrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${STROKE}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  Search: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${STROKE}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  Menu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${STROKE}><path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/></svg>`,
  Check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${STROKE}><path d="M20 6 9 17l-5-5"/></svg>`,
  ChevronRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${STROKE}><path d="m9 18 6-6-6-6"/></svg>`,
  ChevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${STROKE}><path d="m6 9 6 6 6-6"/></svg>`,
  X: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${STROKE}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  Bell: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${STROKE}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
};

export function iconSvg(name: string): string | undefined {
  return ICON_SVGS[name];
}
