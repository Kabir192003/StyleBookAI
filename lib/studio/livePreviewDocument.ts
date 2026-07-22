/**
 * Assembles the srcDoc for the Studio Live Preview's iframe. The generated
 * CSS (verbatim from generateExportCode("CSS", ...) in exportCode.ts — the
 * exact text the Export drawer's CSS tab shows) is injected unmodified, so
 * `:root` / `[data-theme="dark"]` there is exactly what a user would export.
 * An iframe (rather than a <style> tag in the host page) is what makes that
 * safe: :root here only ever affects this iframe's own document, never the
 * app's page. Only the wrapper CSS below (layout/reset, not design tokens)
 * is added, and it only ever references the same custom properties via
 * var(...) — never a hardcoded value standing in for a token.
 */
import { LIVE_PREVIEW_BLOCKS } from "./livePreviewBlocks";

export function buildLivePreviewDocument(cssText: string, theme: "light" | "dark"): string {
  const blocksHtml = LIVE_PREVIEW_BLOCKS.map((b) => b.html).join("\n");

  return `<!doctype html>
<html data-theme="${theme}">
<head>
<meta charset="utf-8" />
<style>
${cssText}

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-body, sans-serif);
  background: var(--ds-color-bg, var(--color-surface));
  color: var(--ds-color-text, var(--color-ink));
  padding: var(--space-4, 20px);
}
.lp-stack { display: flex; flex-direction: column; gap: var(--space-4, 20px); }
.lp-block-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  opacity: 0.5;
  margin-bottom: var(--space-1, 6px);
}
</style>
</head>
<body>
<div class="lp-stack">
${blocksHtml}
</div>
</body>
</html>`;
}
