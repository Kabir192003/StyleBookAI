/**
 * Layout for /sign-in and /sign-up — deliberately not the full app shell
 * (Navbar/Footer): auth screens read best minimal, centered, with just the
 * logo and a way back home. See docs/PRODUCT_AND_UX.md §4 for the
 * restrained-chrome principle this still follows.
 *
 * Owner: Amna
 */
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <div className="flex justify-center px-6 pt-10">
        <Link
          href="/"
          className="flex items-center gap-2 font-editorial-serif text-lg font-semibold text-app-heading"
        >
          <img src="/brand/stylebook-glyph.svg" alt="" aria-hidden="true" width={26} height={26} />
          StyleBook
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-10">{children}</div>
    </div>
  );
}
