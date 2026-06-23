/**
 * Navbar — top nav used on every page except the landing page (which has
 * its own minimal header, see HeroSection.tsx).
 *
 * Owner: Amna
 *
 * TODO (Amna):
 * - Logo → /
 * - Links: Browse (dropdown: Colors/Fonts/Themes), Studio, Dashboard
 * - Right side: Clerk <UserButton /> if signed in, else Sign in/Sign up
 *   links
 * - Mobile: collapse into a sheet/drawer
 */
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b p-4">
      <Link href="/" className="font-bold">
        StyleBook AI
      </Link>
      <div className="flex gap-4 text-sm">
        <Link href="/browse/colors">Browse</Link>
        <Link href="/studio">Studio</Link>
        <Link href="/dashboard">Dashboard</Link>
      </div>
    </nav>
  );
}
