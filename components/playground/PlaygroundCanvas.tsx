/**
 * The Design Playground canvas — a responsive, reorderable grid of
 * experiment cards (docs/DESIGN_PLAYGROUND.md, batch P1).
 *
 * Explicitly not a freeform vector canvas: cards are a CSS grid that
 * auto-fits as many columns as the viewport can give each card a readable
 * ~360px, and collapses to a single stacked column on tablet and below. Drag
 * reorder is @dnd-kit, the same DndContext + SortableContext + useSortable +
 * arrayMove pattern as components/studio/LivePreviewSection.tsx and
 * components/studio/PreviewLab.tsx.
 *
 * This component owns three things the cards don't: the base system every
 * experiment is an override of, the Google Fonts link covering every family
 * any card references, and the client-only-mount guard.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { ExperimentCard } from "./ExperimentCard";
import { PlaygroundToolbar } from "./PlaygroundToolbar";
import { playgroundBaseFromAIResult, seedExperiments } from "@/lib/playground/baseSystem";
import { experimentFontFamilies } from "@/lib/playground/resolveExperiment";
import { useAIResultStore } from "@/store";
import { useExperimentIds, usePlaygroundStore } from "@/store/playgroundStore";

const FONT_LINK_ID = "playground-preview-fonts";

export function PlaygroundCanvas() {
  // @dnd-kit generates internal ids (aria-describedby, live-region ids) from
  // a module-level counter that isn't guaranteed to line up between the
  // server-rendered HTML and the client's first render, which trips a
  // hydration mismatch — the reason LivePreviewSection carries the same
  // guard. Here it does double duty: useAIResultStore is a sessionStorage-
  // persisted store, so its value is necessarily null during SSR and
  // populated on the client, and rendering the real base system before mount
  // would mismatch for that reason too. The playground is fully
  // client-interactive with no SEO surface, so it simply doesn't render
  // until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // useAIResultStore is sessionStorage-persisted, and zustand's persist
  // middleware rehydrates *asynchronously after mount*. Seeding the board
  // before that lands would derive the seed experiments' colours from the
  // fallback palette and then never correct them, because seeding only fires
  // into an empty board — the user would be experimenting on stock navy
  // instead of the brand they just generated. So wait for the rehydration to
  // finish (or for `hasHydrated` to already be true, when the store settled
  // before this component mounted).
  const [resultStoreReady, setResultStoreReady] = useState(false);
  useEffect(() => {
    if (useAIResultStore.persist.hasHydrated()) {
      setResultStoreReady(true);
      return;
    }
    return useAIResultStore.persist.onFinishHydration(() => setResultStoreReady(true));
  }, []);

  const aiResult = useAIResultStore((s) => s.result);
  const base = useMemo(() => playgroundBaseFromAIResult(aiResult), [aiResult]);

  const experimentIds = useExperimentIds();
  const hydrate = usePlaygroundStore((s) => s.hydrate);
  const reorderExperiments = usePlaygroundStore((s) => s.reorderExperiments);

  // Seeds only into a genuinely empty store — the playground store is
  // in-memory, so navigating to /studio and back returns you to the
  // experiments you were working on rather than silently resetting them.
  useEffect(() => {
    if (!resultStoreReady) return;
    if (usePlaygroundStore.getState().experiments.length === 0) {
      hydrate(seedExperiments(base));
    }
  }, [base, hydrate, resultStoreReady]);

  const experiments = usePlaygroundStore((s) => s.experiments);
  const fontFamilies = useMemo(() => {
    const families = new Set<string>();
    experiments.forEach((exp) => experimentFontFamilies(base, exp).forEach((f) => families.add(f)));
    return Array.from(families).sort();
  }, [experiments, base]);

  // One shared <link> for every family on the board. Same mechanism as
  // components/fonts/GoogleFontsLoader.tsx and StudioBuilder's preview-font
  // effect, but keyed on the playground's own id so the three don't fight
  // over a single element. next/font/google can't be used: the family list
  // is user-driven at runtime, not statically known at build time.
  useEffect(() => {
    if (fontFamilies.length === 0) return;
    const href = `https://fonts.googleapis.com/css2?${fontFamilies
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
      .join("&")}&display=swap`;
    let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = FONT_LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [fontFamilies]);

  // 8px activation distance so a click on a card's rename/duplicate/delete
  // button isn't swallowed as the start of a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderExperiments(String(active.id), String(over.id));
  }

  return (
    <div className="min-h-screen bg-[#EDE6DA]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-6 py-6">
        {/* Gated on `mounted` for the same reason as the grid: the base
            system's name and palette are only knowable on the client. */}
        {mounted ? (
          <PlaygroundToolbar base={base} isDerivedFromAI={Boolean(aiResult)} />
        ) : (
          <div className="h-[104px] rounded-2xl border border-black/[0.12] bg-[#F2EBE0]" />
        )}

        {mounted ? (
          <DndContext
            id="playground-canvas"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={experimentIds} strategy={rectSortingStrategy}>
              <div
                className="grid items-start gap-5"
                // auto-fit + a 360px floor rather than fixed breakpoints: the
                // number of columns follows however much room the window
                // actually has, and on tablet/mobile it resolves to one
                // full-width column with the cards stacked, no media query.
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))" }}
              >
                {experimentIds.map((id) => (
                  <ExperimentCard key={id} id={id} base={base} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          // Pre-mount placeholder — deliberately structural only. Rendering
          // real cards here would need the base system, which isn't knowable
          // on the server (see the `mounted` comment).
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))" }}>
            {[0, 1].map((i) => (
              <div key={i} className="h-[420px] rounded-2xl border border-black/[0.12] bg-[#F2EBE0]" />
            ))}
          </div>
        )}

        {mounted && experimentIds.length === 0 && (
          <p className="rounded-2xl border border-dashed border-black/[0.18] px-5 py-10 text-center text-[13px] text-[#6E675C]">
            No experiments. Add one to start comparing.
          </p>
        )}
      </div>
    </div>
  );
}
