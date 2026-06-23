/**
 * Footer — simple, shared across all non-landing pages.
 *
 * TODO: links (Browse, Studio, Dashboard, Pricing), copyright line,
 * maybe a "built with StyleBook AI" badge concept for exported assets.
 */
export function Footer() {
  return (
    <footer className="border-t p-6 text-center text-xs text-neutral-400">
      © {new Date().getFullYear()} StyleBook AI
    </footer>
  );
}
