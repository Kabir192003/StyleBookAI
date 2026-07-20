import { SearchX } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "No results found",
  description = "Try adjusting your search or filters.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100">
        <SearchX className="h-5 w-5 text-neutral-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
    </div>
  );
}
