type BrowseHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  count?: number;
};

export function BrowseHeader({ eyebrow, title, description, count }: BrowseHeaderProps) {
  return (
    <header className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{eyebrow}</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">{title}</h1>
        {typeof count === "number" && (
          <span className="text-sm text-neutral-500">
            {count} {count === 1 ? "result" : "results"}
          </span>
        )}
      </div>
      <p className="max-w-2xl text-sm text-neutral-600 sm:text-base">{description}</p>
    </header>
  );
}
