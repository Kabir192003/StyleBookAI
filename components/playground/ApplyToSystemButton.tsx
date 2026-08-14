/**
 * "Apply to design system" — the moment a playground experiment stops being
 * an experiment (docs/DESIGN_PLAYGROUND.md §12).
 *
 * Mounted in each experiment card's footer. Self-contained by contract: it
 * takes only `experimentId` and owns its own trigger, dialog, diff and
 * confirmation, so the card doesn't have to thread any of that through.
 *
 * The rule this UI exists to enforce: nothing changes until the user has
 * seen, token by token, exactly what will change. Every row in the diff is
 * an overwrite of a live value, so the dialog states that plainly and names
 * the escape hatch (Studio's undo) instead of leaving the user to find out.
 *
 * The write itself is the existing Preview-Lab bridge — stage a payload,
 * navigate to /studio, let StudioBuilder fold it into `StudioState`. See the
 * header of lib/playground/applyToSystem.ts for why that route rather than
 * lifting Studio's state into a store.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, TriangleAlert, X } from "lucide-react";
import { buildApplyPlan, type ApplyDiffGroup, type ApplyDiffRow } from "@/lib/playground/applyToSystem";
import { playgroundBaseFromAIResult } from "@/lib/playground/baseSystem";
import { useAIResultStore } from "@/store";
import { useStudioImportStore } from "@/store/studioImportStore";
import { useExperiment } from "@/store/playgroundStore";

const GROUP_ORDER: ApplyDiffGroup[] = ["Palette", "Typography", "Shape", "Component tokens"];

function Swatch({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 rounded-[3px] border border-black/20 align-middle"
      style={{ background: hex }}
      aria-hidden="true"
    />
  );
}

/** One token's before → after. Colours get swatches because a designer reads
 *  #222D52 → #C36B3E as two hex strings, but reads the swatches instantly. */
function DiffRow({ row }: { row: ApplyDiffRow }) {
  return (
    <div className="flex items-center gap-3 border-t border-black/[0.08] py-2 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] text-[#211E18]">{row.label}</p>
        <p className="font-mono-plex truncate text-[9px] uppercase tracking-[0.12em] text-[#B4AD9E]">{row.token}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {row.kind === "color" && <Swatch hex={row.current} />}
        <span className="font-mono-plex text-[10px] text-[#6E675C] line-through decoration-[#B4AD9E]">
          {row.current}
        </span>
      </div>
      <ArrowRight className="h-3 w-3 shrink-0 text-[#B4AD9E]" aria-hidden="true" />
      <div className="flex min-w-0 items-center gap-1.5">
        {row.kind === "color" && <Swatch hex={row.next} />}
        <span className="font-mono-plex truncate text-[10px] font-medium text-[#211E18]">{row.next}</span>
      </div>
    </div>
  );
}

export function ApplyToSystemButton({ experimentId }: { experimentId: string }): JSX.Element {
  const router = useRouter();
  const experiment = useExperiment(experimentId);
  const aiResult = useAIResultStore((s) => s.result);
  const stageStudioImport = useStudioImportStore((s) => s.stage);
  const [open, setOpen] = useState(false);

  // Rebuilt from the same source the canvas uses, rather than taken as a
  // prop: the contract for this component is `experimentId` and nothing
  // else, so the card that mounts it never has to know about base systems.
  const base = useMemo(() => playgroundBaseFromAIResult(aiResult), [aiResult]);
  const plan = useMemo(() => (experiment ? buildApplyPlan(base, experiment) : null), [base, experiment]);

  // Escape closes. A modal you can only leave by hitting a button is a modal
  // people learn to fear, and this one sits in front of a destructive action.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Portalled to <body> because the card wrapper carries a dnd-kit
  // `transform`, and a transformed ancestor becomes the containing block for
  // `position: fixed` descendants — an un-portalled overlay would be pinned
  // inside the card and clipped by its `overflow-hidden`, not over the page.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setPortalTarget(document.body), []);

  function handleApply() {
    if (!plan || plan.rows.length === 0) return;
    stageStudioImport(plan.payload);
    setOpen(false);
    router.push("/studio");
  }

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    rows: plan?.rows.filter((r) => r.group === group) ?? [],
  })).filter((g) => g.rows.length > 0);

  const nothingToApply = !plan || plan.rows.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono-plex inline-flex items-center gap-1.5 rounded-full border border-[#222D52] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#222D52] transition-colors hover:bg-[#222D52] hover:text-[#F2EBE0]"
      >
        <Check className="h-3 w-3" aria-hidden="true" />
        Apply to design system
      </button>

      {open &&
        portalTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[#211E18]/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Apply ${experiment?.name ?? "experiment"} to the design system`}
            onClick={(e) => {
              // Backdrop only — a click inside the panel must not dismiss it.
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-black/[0.16] bg-[#F2EBE0] shadow-2xl">
              <header className="flex items-start gap-3 border-b border-black/[0.1] px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#222D52]">
                    Apply to design system
                  </p>
                  <h2 className="mt-1 truncate text-[19px] leading-tight text-[#211E18]">{experiment?.name}</h2>
                  <p className="mt-1 text-[12px] text-[#6E675C]">
                    {nothingToApply
                      ? `This experiment overrides nothing — it is already ${base.name} exactly as built.`
                      : `${plan!.rows.length} token${plan!.rows.length === 1 ? "" : "s"} in ${base.name} will change.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded p-1 text-[#B4AD9E] hover:text-[#211E18]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {nothingToApply ? (
                  <p className="rounded-xl border border-dashed border-black/[0.18] px-4 py-8 text-center text-[13px] text-[#6E675C]">
                    Change a colour, a font or the corner radius on this card first. There is nothing here to apply.
                  </p>
                ) : (
                  <>
                    {/* Stated before the list, not after: this is the fact
                        that decides whether the user should press the button
                        at all. */}
                    <div className="mb-4 flex gap-2.5 rounded-xl border border-[#B4791F]/40 bg-[#B4791F]/[0.08] px-3.5 py-3">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B4791F]" aria-hidden="true" />
                      <p className="text-[12px] leading-relaxed text-[#211E18]">
                        Every value below is <strong className="font-semibold">overwritten</strong> in your live design
                        system. Studio&rsquo;s undo reverts the whole apply in one step.
                      </p>
                    </div>

                    {grouped.map(({ group, rows }) => (
                      <section key={group} className="mb-4 last:mb-0">
                        <h3 className="font-mono-plex mb-1 text-[9px] uppercase tracking-[0.18em] text-[#6E675C]">
                          {group}
                        </h3>
                        <div className="rounded-xl border border-black/[0.1] bg-[#EDE6DA] px-3.5 py-1">
                          {rows.map((row) => (
                            <DiffRow key={row.id} row={row} />
                          ))}
                        </div>
                      </section>
                    ))}

                    {plan!.enablesComponentTokens && plan!.payload.designSystem && (
                      <p className="mt-1 text-[11px] leading-relaxed text-[#6E675C]">
                        This system has no component tokens yet — applying creates them, the same set Studio&rsquo;s
                        &ldquo;Enable component tokens&rdquo; action would generate.
                      </p>
                    )}

                    {plan!.unmapped.length > 0 && (
                      <p className="mt-2 text-[11px] leading-relaxed text-[#6E675C]">
                        Not carried over: {plan!.unmapped.join(", ")}. Studio&rsquo;s token set has no slot for{" "}
                        {plan!.unmapped.length === 1 ? "it" : "them"}, so {plan!.unmapped.length === 1 ? "it stays" : "they stay"}{" "}
                        in the playground only.
                      </p>
                    )}
                  </>
                )}
              </div>

              <footer className="flex items-center justify-between gap-3 border-t border-black/[0.1] px-5 py-3.5">
                {/* The one thing the diff cannot know. Said here rather than
                    quietly omitted — the "current" column is the system this
                    playground was derived from, not Studio's unsaved edits. */}
                <p className="text-[10px] leading-snug text-[#B4AD9E]">
                  Compared against the system this playground was opened on.
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="font-mono-plex rounded-full border border-black/[0.18] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[#211E18]"
                  >
                    Cancel
                  </button>
                  {!nothingToApply && (
                    <button
                      type="button"
                      onClick={handleApply}
                      className="font-mono-plex rounded-full bg-[#222D52] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[#F2EBE0]"
                    >
                      Overwrite {plan!.rows.length} token{plan!.rows.length === 1 ? "" : "s"}
                    </button>
                  )}
                </div>
              </footer>
            </div>
          </div>,
          portalTarget
        )}
    </>
  );
}
