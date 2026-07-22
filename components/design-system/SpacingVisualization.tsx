/**
 * Shared spacing-scale visualization — used by both the AI results page
 * (components/ai/PromptInput.tsx, always read-only) and Studio (`editable`
 * there). Shows every step with its index and px value; when editable, a
 * 4px/8px base toggle regenerates the whole scale via generateSpacingScale.
 */
import { SpacingScale } from "@/types/designTokens";
import { SPACING_BASE_OPTIONS, generateSpacingScale } from "@/lib/designTokens/spacing";

export function SpacingVisualization({
  spacing,
  editable = false,
  onChange,
}: {
  spacing: SpacingScale;
  editable?: boolean;
  onChange?: (next: SpacingScale) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono-plex text-[9px] uppercase tracking-[0.14em] text-[#8A8477]">
          Spacing · base {spacing.base}px
        </div>
        {editable && (
          <div className="inline-flex overflow-hidden rounded-full border border-black/[0.14]">
            {SPACING_BASE_OPTIONS.map((base) => (
              <button
                key={base}
                type="button"
                onClick={() => onChange?.(generateSpacingScale(base))}
                className="px-2.5 py-0.5 text-[10px]"
                style={{
                  backgroundColor: spacing.base === base ? "#222D52" : "transparent",
                  color: spacing.base === base ? "#F2EBE0" : "#6E675C",
                }}
              >
                {base}px
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1.5">
        {spacing.steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2.5">
            <span className="w-6 shrink-0 font-mono-plex text-[9px] text-[#8A8477]">{i + 1}</span>
            <div className="h-2 rounded-full bg-[#222D52]/30" style={{ width: `${Math.min(step, 160)}px` }} />
            <span className="shrink-0 font-mono-plex text-[10px] text-[#6E675C]">{step}px</span>
          </div>
        ))}
      </div>
    </div>
  );
}
