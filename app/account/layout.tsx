/**
 * Layout for /account — mounts the shared Navbar/Footer. Kept as its own
 * nested layout (rather than adding Navbar/Footer to the root layout) so
 * the landing page's own header/footer never doubles up — see the note
 * at the top of components/layout/Navbar.tsx.
 *
 * Owner: Amna
 */
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
