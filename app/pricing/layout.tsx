/**
 * Layout for /pricing — mounts the shared Navbar/Footer.
 *
 * Owner: Amna
 */
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
