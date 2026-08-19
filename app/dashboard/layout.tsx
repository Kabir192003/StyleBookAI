// Also covers /dashboard/[id] since Next nests routes. SiteHeader is global
// already, so this just adds the Footer.
import { Footer } from "@/components/layout/Footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#EDE6DA]">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
