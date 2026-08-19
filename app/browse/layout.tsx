// No container here on purpose — /browse/colors goes full-bleed, fonts and
// themes keep their own centered max-w-7xl, so this layout stays hands-off.
// Footer's mounted here too, not just on account/dashboard, since browse is
// usually the first thing a signed-out visitor sees.
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
