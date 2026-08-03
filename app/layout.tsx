/**
 * Root layout — wraps every route.
 *
 * No auth provider here — Clerk was removed (see CLAUDE.md); the app is
 * fully public for now, pending a simple username/password login later.
 * Keep this file thin; per-route chrome belongs in nested layouts.
 */

import type { Metadata, Viewport } from "next";
import { landingFontVariables } from "@/lib/landing/fonts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "StyleBook — Colours, fonts & themes in one place",
  description:
    "Browse a curated library of colours, fonts, and complete design themes — or describe your brand and let AI build a palette, font pairing, and type scale for you.",
  openGraph: {
    title: "StyleBook — Colours, fonts & themes in one place",
    description:
      "One creative workspace for every design decision: colours, typography, themes, accessibility, and AI generation.",
    siteName: "StyleBook",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F2EBE0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={landingFontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}