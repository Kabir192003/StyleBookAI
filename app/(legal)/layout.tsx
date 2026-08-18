/**
 * Shared chrome for the legal/help pages (/privacy, /terms,
 * /ai-disclaimer, /guide) — a route group so none of it affects the URL.
 * SiteHeader is already global (app/layout.tsx); this just adds the
 * shared reading container and mounts Footer, matching how
 * app/account/layout.tsx and app/dashboard/layout.tsx do it.
 */
import { Footer } from "@/components/layout/Footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#EDE6DA]">
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
