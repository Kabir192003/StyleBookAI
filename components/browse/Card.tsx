import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
