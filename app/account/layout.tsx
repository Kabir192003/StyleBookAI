// SiteHeader is already global (app/layout.tsx), so this only adds the Footer.
import { Footer } from "@/components/layout/Footer";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#EDE6DA]">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
