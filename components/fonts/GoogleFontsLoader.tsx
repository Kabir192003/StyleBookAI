// Injects one Google Fonts CSS2 stylesheet link covering every font passed
// in, so previews render in the real typeface instead of a fallback.
// next/font/google can't be used here since the font list is data-driven,
// not known at build time.
"use client";

import { useEffect } from "react";
import { Font } from "@/types/font";

const LINK_ID = "google-fonts-browse-preview";

// Cap to a few representative weights per font — with hundreds of fonts
// on screen, requesting every one of a font's 15+ weights would blow past
// the browser's URL length limit for the stylesheet link.
const MAX_WEIGHTS_PER_FONT = 4;

function representativeWeights(variants: string[]): string[] {
  if (variants.length <= MAX_WEIGHTS_PER_FONT) return variants;
  const step = (variants.length - 1) / (MAX_WEIGHTS_PER_FONT - 1);
  const picked = new Set<string>();
  for (let i = 0; i < MAX_WEIGHTS_PER_FONT; i++) {
    picked.add(variants[Math.round(i * step)]);
  }
  return Array.from(picked);
}

export function GoogleFontsLoader({ fonts }: { fonts: Font[] }) {
  useEffect(() => {
    const families = fonts
      .map((f) => `family=${encodeURIComponent(f.googleFontsId)}:wght@${representativeWeights(f.variants).join(";")}`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;

    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) {
      link.href = href;
    }
  }, [fonts]);

  return null;
}
