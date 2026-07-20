import { Card } from "@/components/browse/Card";
import { Font } from "@/types/font";

export function FontCard({ font }: { font: Font }) {
  return (
    <Card className="p-6 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-neutral-900">{font.family}</h3>
          <p className="mt-0.5 truncate text-xs text-neutral-500 capitalize">{font.category}</p>
        </div>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-600">
          {font.useCase[0]}
        </span>
      </div>

      <div
        className="mt-6 truncate text-4xl leading-tight text-neutral-900"
        style={{ fontFamily: `'${font.family}', ${font.category === "monospace" ? "monospace" : font.category === "serif" ? "serif" : "sans-serif"}`, fontWeight: 600 }}
      >
        Ag 123
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-neutral-500" style={{ fontFamily: `'${font.family}'` }}>
        {font.note}
      </p>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {font.variants.map((w) => (
          <span
            key={w}
            className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] text-neutral-500"
          >
            {w}
          </span>
        ))}
      </div>
    </Card>
  );
}
