// No third-party auth provider here — auth is self-hosted username/password
// (lib/auth/) via a plain session cookie, not a context provider.
import type { Metadata, Viewport } from "next";
import { landingFontVariables } from "@/lib/landing/fonts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ClipboardTray } from "@/components/clipboard/ClipboardTray";
import { themeInitScript } from "@/lib/theme";
import { a11yInitScript } from "@/lib/a11y/preferences";
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
  // Versioned query on purpose: browsers cache favicons hard, and without a
  // changed URL an old icon can survive a redeploy indefinitely.
  icons: { icon: [{ url: "/favicon.svg?v=2", type: "image/svg+xml" }] },
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
        <script dangerouslySetInnerHTML={{ __html: a11yInitScript }} />
      </head>
      <body>
        <SiteHeader />
        {children}
        <ClipboardTray />
      </body>
    </html>
  );
}