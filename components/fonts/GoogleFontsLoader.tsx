/**
 * Injects a single Google Fonts CSS2 stylesheet link covering every font
 * passed in, so FontCard can render live previews in the real typeface
 * instead of a fallback. next/font/google can't be used here since the
 * font list is data-driven, not known statically at build time.
 */
"use client";

import { useEffect } from "react";
import { Font } from "@/types/font";

const LINK_ID = "google-fonts-browse-preview";

export function GoogleFontsLoader({ fonts }: { fonts: Font[] }) {
  useEffect(() => {
    const families = fonts
      .map((f) => `family=${encodeURIComponent(f.googleFontsId)}:wght@${f.variants.join(";")}`)
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
