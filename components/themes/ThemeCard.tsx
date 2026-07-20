import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/browse/Card";
import { Theme } from "@/types/theme";
import { hexToRgb, rgbToHsl } from "@/lib/colors/colorUtils";

function isDark(hex: string): boolean {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b).l < 50;
}

export function ThemeCard({ theme }: { theme: Theme }) {
  const p = theme.colorRoles;
  const dark = isDark(p.background);
  const swatches = [p.primary, p.secondary, p.accent, p.background, p.surface, p.text];

  return (
    <Card className="p-0 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-40 w-full overflow-hidden p-5" style={{ backgroundColor: p.background, color: p.text }}>
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: p.surface }}>
          <div className="text-sm font-semibold" style={{ fontFamily: `'${theme.primaryFont.family}'` }}>
            {theme.name}
          </div>
          <div className="mt-1 text-[11px]" style={{ fontFamily: `'${theme.secondaryFont.family}'`, color: p.textMuted }}>
            {theme.category}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-md px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: p.primary, color: p.surface }}>
              Primary
            </span>
            <span className="rounded-md px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: p.accent, color: p.surface }}>
              Accent
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-neutral-900">{theme.name}</h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
              {theme.primaryFont.family} · {theme.secondaryFont.family}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: dark ? "#171717" : "#f5f5f5", color: dark ? "#fafafa" : "#404040" }}
          >
            {dark ? "Dark" : "Light"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {swatches.map((c, i) => (
            <span key={i} className="h-6 w-6 rounded-md ring-1 ring-inset ring-black/5" style={{ backgroundColor: c }} title={c} />
          ))}
          <span className="ml-1 text-xs text-neutral-500">{swatches.length} colors</span>
        </div>

        <Link
          href={`/browse/themes/${theme.slug}`}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          View details <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
