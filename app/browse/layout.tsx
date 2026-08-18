/**
 * /browse layout — no container of its own. Navigation is the shared
 * <SiteHeader /> in the root layout (app/layout.tsx). Individual browse
 * pages own their container width — /browse/colors goes full-bleed to
 * match its editorial design, while fonts/themes keep the standard
 * centered `max-w-7xl` container inside their own grid components.
 *
 * Footer is mounted here (not just on account/dashboard) so the browse
 * pages — the ones a first-time, signed-out visitor is most likely to
 * land on — carry the same Privacy/Terms/Guide links as the rest of the
 * app instead of being a dead end with no way to reach them.
 */
import { Footer } from "@/components/layout/Footer";

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
