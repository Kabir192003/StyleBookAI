// Computes a WCAG contrast ratio between two colors with chroma-js
// (already a project dependency) and renders the standard AAA/AA/Fail badge.
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
        passed ? "border-[#22733F]/30 bg-[#22733F]/10 text-[#22733F]" : "border-[#B3261E]/30 bg-[#B3261E]/10 text-[#B3261E]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${passed ? "bg-[#22733F]" : "bg-[#B3261E]"}`}
        aria-hidden="true"
      />
      {ratio.toFixed(1)}:1 · {rating}
    </span>
  );
}
