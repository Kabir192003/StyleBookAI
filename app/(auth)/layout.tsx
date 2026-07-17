/**
 * Layout for /sign-in and /sign-up. Deliberately minimal — each page
 * builds its own split-screen chrome (dark "cover" panel + cream form
 * panel) directly, since the left panel's content differs per page. This
 * file exists mainly so the (auth) route group has one, and so a shared
 * background color applies before either page's own layout paints.
 *
 * Owner: Amna
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-app-bg">{children}</div>;
}
