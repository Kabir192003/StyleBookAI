/**
 * Root layout — wraps every route. Add Clerk's <ClerkProvider>, the
 * shared <Navbar /> and <Footer />, and any global font declarations here.
 * Keep this file thin; per-route chrome belongs in nested layouts.
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StyleBook AI",
  description:
    "Colours, fonts, and themes in one place — browse a curated library or describe your brand and let AI build it for you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
