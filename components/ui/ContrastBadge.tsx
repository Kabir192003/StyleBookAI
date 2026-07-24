/**
 * ContrastBadge — computes a WCAG contrast ratio between two colors with
 * chroma-js (already a project dependency) and renders the standard
 * AAA/AA/Fail badge.
 *
 * Owner: Amna
 */
import chroma from "chroma-js";

function ratingFor(ratio: number, isLargeText = false) {
  if (ratio >= 7 || (isLargeText && ratio >= 4.5)) return "AAA";
  if (ratio >= 4.5 || (isLargeText && ratio >= 3)) return "AA";
  return "Fail";
}

export function ContrastBadge({
  foreground,
  background,
  isLargeText = false,
}: {
  foreground: string;
  background: string;
  isLargeText?: boolean;
}) {
  const ratio = chroma.contrast(foreground, background);
  const rating = ratingFor(ratio, isLargeText);
  const passed = rating !== "Fail";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        passed
          ? "border-app-success/30 bg-app-success/10 text-app-success"
          : "border-app-danger/30 bg-app-danger-soft text-app-danger"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${passed ? "bg-app-success" : "bg-app-danger"}`}
        aria-hidden="true"
      />
      {ratio.toFixed(1)}:1 · {rating}
    </span>
  );
}
