/**
 * Root layout — wraps every route.
 *
 * Add Clerk's <ClerkProvider>, the shared <Navbar /> and <Footer />, and
 * any global font declarations here. Keep this file thin; per-route chrome
 * belongs in nested layouts.
 */
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { landingFontVariables } from "@/lib/landing/fonts";
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
    <ClerkProvider>
      <html lang="en" className={landingFontVariables} suppressHydrationWarning>
        <head>
          {/* Runs before paint so the page never flashes the wrong theme —
              see lib/theme.ts. Safe to inline: no user data, no network. */}
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
