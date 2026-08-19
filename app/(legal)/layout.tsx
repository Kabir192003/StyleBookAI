// (legal) is a route group, so the parens never show up in the URL — this
// just wraps /privacy, /terms, /ai-disclaimer and /guide with a footer.
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
