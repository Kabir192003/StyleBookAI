/**
 * /browse layout — content container only. Navigation is the shared
 * <SiteHeader /> in the root layout (app/layout.tsx); this used to have
 * its own duplicate tab bar, removed in favor of one consistent header
 * everywhere.
 */
export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">{children}</main>;
}
