/**
 * /browse layout — no container of its own. Navigation is the shared
 * <SiteHeader /> in the root layout (app/layout.tsx). Individual browse
 * pages own their container width — /browse/colors goes full-bleed to
 * match its editorial design, while fonts/themes keep the standard
 * centered `max-w-7xl` container inside their own grid components.
 */
export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>;
}
