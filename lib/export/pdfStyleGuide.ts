/**
 * Client-side PDF style-guide export — the feature CLAUDE.md/docs long
 * described as "planned via html-to-image" but never built. Mounts
 * StyleGuidePdfPages off-screen, rasterizes each printed page to a PNG
 * with html-to-image, then stitches the PNGs into a multi-page PDF with
 * jsPDF (one PDF page per rendered page, same pixel dimensions so there's
 * no scaling/letterboxing math to get wrong).
 *
 * Both html-to-image and jsPDF are dynamically imported — this only ever
 * runs from a click handler in the browser, so there's no reason to add
 * their weight to every route's bundle.
 */
"use client";

import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { StyleGuidePdfPages, STYLE_GUIDE_PAGE_SIZE } from "@/components/studio/StyleGuidePdfPages";
import { StudioExportTokens } from "@/lib/studio/exportCode";

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "style-guide"
  );
}

export async function exportStyleGuidePdf(tokens: StudioExportTokens): Promise<void> {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const container = document.createElement("div");
  // Off-screen but still laid out/rendered — html-to-image needs real
  // dimensions and paint, so display:none or width:0 won't work here.
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-99999px";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    await new Promise<void>((resolve) => {
      root.render(createElement(StyleGuidePdfPages, { tokens }));
      // Two rAFs: one for React to commit, one for layout/paint to settle
      // before html-to-image reads computed styles off the real DOM.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const pageNodes = Array.from(container.querySelectorAll<HTMLElement>("[data-style-guide-page]"));
    if (pageNodes.length === 0) {
      throw new Error("Style guide produced no pages to export");
    }

    const doc = new jsPDF({
      unit: "px",
      format: [STYLE_GUIDE_PAGE_SIZE.width, STYLE_GUIDE_PAGE_SIZE.height],
      hotfixes: ["px_scaling"],
      compress: true,
    });

    for (let i = 0; i < pageNodes.length; i++) {
      // JPEG, not PNG: these pages are flat color blocks and text with no
      // transparency, and JPEG's lossy compression at high quality shrinks
      // the output by roughly 10x over a lossless PNG at the same
      // pixelRatio — the difference between a multi-megabyte and a
      // multi-tens-of-megabytes download for a 4-page guide.
      const jpeg = await toJpeg(pageNodes[i], { pixelRatio: 2, backgroundColor: "#ffffff", quality: 0.92 });
      if (i > 0) doc.addPage([STYLE_GUIDE_PAGE_SIZE.width, STYLE_GUIDE_PAGE_SIZE.height], "portrait");
      doc.addImage(jpeg, "JPEG", 0, 0, STYLE_GUIDE_PAGE_SIZE.width, STYLE_GUIDE_PAGE_SIZE.height, undefined, "FAST");
    }

    doc.save(`${slugify(tokens.name)}-style-guide.pdf`);
  } finally {
    root.unmount();
    container.remove();
  }
}
