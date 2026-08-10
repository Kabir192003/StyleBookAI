/**
 * "Live Preview" panel in Studio — an arrangeable canvas over the app's
 * supported components (see lib/studio/livePreviewBlocks.ts), styled by
 * the *exact* CSS the Export drawer's CSS tab would give a user
 * (generateExportCode("CSS", tokens), lib/studio/exportCode.ts). Since it
 * derives everything from `tokens` (the same StudioState the rest of
 * Studio and the export drawer already read), it updates automatically
 * whenever a token, or a whole AI-generated design system, changes — no
 * separate sync path to maintain.
 *
 * Previously this rendered inside a sandboxed iframe. That's gone: making
 * blocks drag/resize/hide-able needs @dnd-kit (already used the same way
 * in components/studio/PreviewLab.tsx — DndContext + SortableContext +
 * useSortable + arrayMove), and @dnd-kit's DndContext cannot see pointer
 * events across an iframe boundary — a DndContext in the host page can't
 * drag elements living inside a separate iframe document. So the exact
 * same generated CSS is now injected as a plain <style> tag in the host
 * document, scoped under `[data-lp-scope="studio-canvas"]` (via
 * generateExportCode's scopeSelector option) instead of `:root`, so it
 * can't clobber the real page's own custom properties. Block HTML is
 * still the same static strings from livePreviewBlocks.ts (rendered via
 * dangerouslySetInnerHTML — no new XSS surface, nothing here is
 * AI- or user-authored text).
 *
 * `theme`/`onThemeChange` and `layout`/`onLayoutChange` are controlled by
 * the caller (StudioBuilder) rather than owned locally — same pattern:
 * one source of truth, shown consistently everywhere, persisted on save.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical } from "lucide-react";
import { generateExportCode, StudioExportTokens } from "@/lib/studio/exportCode";
import { LIVE_PREVIEW_BLOCKS, PreviewLayoutItem } from "@/lib/studio/livePreviewBlocks";

const SCOPE_SELECTOR = '[data-lp-scope="studio-canvas"]';
const MIN_BLOCK_WIDTH = 160;

function SortableBlock({
  item,
  html,
  label,
  onToggleVisible,
  onResize,
}: {
  item: PreviewLayoutItem;
  html: string;
  label: string;
  onToggleVisible: () => void;
  onResize: (width: number | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    width: item.width ?? undefined,
    maxWidth: "100%",
  };

  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = item.width ?? e.currentTarget.parentElement?.getBoundingClientRect().width ?? 400;
    function onMove(ev: PointerEvent) {
      onResize(Math.max(MIN_BLOCK_WIDTH, Math.round(startWidth + (ev.clientX - startX))));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative rounded-xl border border-black/[0.1] bg-white/60 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <button
          type="button"
          className="cursor-grab rounded p-1 text-[#B4AD9E] active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${label}`}
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleVisible}
          className="rounded p-1 text-[#B4AD9E]"
          aria-label={`Hide ${label}`}
          title="Hide"
        >
          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <div
        onPointerDown={startResize}
        className="absolute bottom-2 right-0 top-9 flex w-3 cursor-ew-resize items-center justify-center opacity-0 group-hover:opacity-100"
        title="Drag to resize"
      >
        <div className="h-full w-px bg-black/20" />
      </div>
    </div>
  );
}

export function LivePreviewSection({
  tokens,
  theme,
  onThemeChange,
  layout,
  onLayoutChange,
}: {
  tokens: StudioExportTokens;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  layout: PreviewLayoutItem[];
  onLayoutChange: (next: PreviewLayoutItem[]) => void;
}) {
  const cssText = useMemo(
    () => generateExportCode("CSS", tokens, { scopeSelector: SCOPE_SELECTOR }),
    [tokens]
  );
  const blocksById = useMemo(() => new Map(LIVE_PREVIEW_BLOCKS.map((b) => [b.id, b])), []);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // @dnd-kit generates internal ids (aria-describedby, live-region ids)
  // from a module-level counter that isn't guaranteed to line up between
  // the server-rendered HTML and the client's first render, which trips a
  // hydration mismatch. Studio is fully client-interactive already (no
  // SEO/content reason to SSR the draggable canvas), so the drag-enabled
  // subtree renders a plain, non-interactive list until mount, then swaps
  // to the real DndContext version — sidesteps the mismatch entirely
  // instead of fighting dnd-kit's id generation.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function updateItem(id: string, patch: Partial<PreviewLayoutItem>) {
    onLayoutChange(layout.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = layout.findIndex((item) => item.id === active.id);
    const newIndex = layout.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onLayoutChange(arrayMove(layout, oldIndex, newIndex));
  }

  const visibleItems = layout.filter((item) => item.visible);
  const hiddenItems = layout.filter((item) => !item.visible);

  return (
    <div className="mt-5 rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
      {/* dangerouslySetInnerHTML, not a text child — <style> text children get
          HTML-entity-escaped differently between SSR and hydration, which
          trips a hydration mismatch; raw innerHTML sidesteps that. Safe here
          since cssText is our own generated CSS, never user/AI-authored. */}
      <style dangerouslySetInnerHTML={{ __html: cssText }} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#222D52]">Live preview</p>
          <p className="mt-1 text-[12px] text-[#8A8477]">
            Drag to reorder, drag a block&rsquo;s right edge to resize, hide what you don&rsquo;t need.
          </p>
        </div>
        <div className="inline-flex overflow-hidden rounded-full border border-black/[0.16]">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onThemeChange(t)}
              className="px-4 py-1.5 text-xs capitalize"
              style={{
                backgroundColor: theme === t ? "#222D52" : "transparent",
                color: theme === t ? "#F2EBE0" : "#6E675C",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {hiddenItems.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-black/[0.1] bg-white/40 p-2.5">
          <span className="font-mono-plex text-[9px] uppercase tracking-[0.12em] text-[#B4AD9E]">Hidden</span>
          {hiddenItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateItem(item.id, { visible: true })}
              className="flex items-center gap-1.5 rounded-full border border-black/[0.14] bg-white px-2.5 py-1 text-[11px] text-[#6E675C]"
            >
              <Eye className="h-3 w-3" aria-hidden="true" />
              {blocksById.get(item.id)?.label ?? item.id}
            </button>
          ))}
        </div>
      )}

      <div data-lp-scope="studio-canvas" data-theme={theme}>
        {mounted ? (
          <DndContext
            id="studio-live-preview"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={visibleItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {visibleItems.map((item) => {
                  const block = blocksById.get(item.id);
                  if (!block) return null;
                  return (
                    <SortableBlock
                      key={item.id}
                      item={item}
                      html={block.html}
                      label={block.label}
                      onToggleVisible={() => updateItem(item.id, { visible: false })}
                      onResize={(width) => updateItem(item.id, { width })}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          // Pre-mount fallback — no @dnd-kit here (its internal ids aren't
          // guaranteed to match between server and client, see the comment
          // above `mounted`), just the static blocks. Swaps to the real
          // drag/resize/hide canvas the instant the client mounts.
          <div className="flex flex-col gap-3">
            {visibleItems.map((item) => {
              const block = blocksById.get(item.id);
              if (!block) return null;
              return (
                <div key={item.id} className="rounded-xl border border-black/[0.1] bg-white/60 p-3">
                  <div dangerouslySetInnerHTML={{ __html: block.html }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
