/**
 * ThemeGrid — grid of Theme cards, each showing a small live mockup
 * (card + heading + body + button) rendered in that theme's actual
 * colors/fonts so it's judged in context, not as a swatch list.
 */
import { Theme } from "@/types/theme";

export function ThemeGrid({ themes }: { themes: Theme[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {themes.map((theme) => (
        <a key={theme.id} href={`/browse/themes/${theme.slug}`} className="rounded-lg border p-4">
          <p className="font-semibold">{theme.name}</p>
          <p className="text-xs text-neutral-500">{theme.category}</p>
        </a>
      ))}
    </div>
  );
}
