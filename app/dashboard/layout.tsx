/**
 * Layout for /dashboard (and, since Next nests routes, /dashboard/[id])
 * — mounts Footer (SiteHeader is already global).
 *
 * Owner: Amna
 */
import { Footer } from "@/components/layout/Footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
