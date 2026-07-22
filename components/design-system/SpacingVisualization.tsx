/**
 * Shared spacing-scale visualization — used by both the AI results page
 * (components/ai/PromptInput.tsx) and Studio. Previously only the first 4
 * of 8 steps were shown, as unlabeled flat bars ("just lines"). Now shows
 * every step with its index and px value.
 */
import { SpacingScale } from "@/types/designTokens";

export function SpacingVisualization({ spacing }: { spacing: SpacingScale }) {
  return (
    <div>
      <div className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#EFE9DC]/50">
        Spacing · base {spacing.base}px
      </div>
      <div className="mt-3 space-y-1.5">
        {spacing.steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2.5">
            <span className="w-6 shrink-0 font-mono-plex text-[9px] text-[#EFE9DC]/40">{i + 1}</span>
            <div className="h-2 rounded-full bg-[#D2B68A]/40" style={{ width: `${Math.min(step, 160)}px` }} />
            <span className="shrink-0 font-mono-plex text-[10px] text-[#EFE9DC]/60">{step}px</span>
          </div>
        ))}
      </div>
    </div>
  );
}
