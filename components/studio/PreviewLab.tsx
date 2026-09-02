// A drag-and-drop surface for testing color/font pairings pulled from the
// Clipboard. Colors stack top-to-bottom, filling the canvas equally as
// they're added (max 5); dropping a font onto a band pairs them with a live
// WCAG contrast readout.
"use client";

import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { colord } from "colord";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePreviewLabStore } from "@/store/previewLabStore";
import { useStudioImportStore } from "@/store/studioImportStore";
import { ClipboardColorItem, ClipboardFontItem } from "@/store/clipboardStore";

function getRelativeLuminance(color: string) {
  const parsed = colord(color);

  if (!parsed.isValid()) {
    return 0;
  }

  const { r, g, b } = parsed.toRgb();
  const toLinear = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const red = toLinear(r);
  const green = toLinear(g);
  const blue = toLinear(b);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function getContrastInfo(background: string, foreground: string) {
  const bg = getRelativeLuminance(background);
  const fg = getRelativeLuminance(foreground);
  const lighter = Math.max(bg, fg);
  const darker = Math.min(bg, fg);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  if (ratio >= 7) {
    return { ratio, label: "AAA", pass: true };
  }

  if (ratio >= 4.5) {
    return { ratio, label: "AA", pass: true };
  }

  return { ratio, label: "Fail", pass: false };
}

function getReadableTextColor(background: string) {
  return colord(background).isDark() ? "#f8fafc" : "#0f172a";
}

type DragItemData =
  | { kind: "sidebar-color"; item: ClipboardColorItem }
  | { kind: "sidebar-font"; item: ClipboardFontItem };

function DraggableColorChip({ item }: { item: ClipboardColorItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-color-${item.id}`,
    data: { kind: "sidebar-color", item } satisfies DragItemData,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : "auto",
        position: "relative",
        touchAction: "none",
      }}
      className="flex cursor-grab items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 active:cursor-grabbing"
    >
      <span className="h-6 w-6 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: item.hex }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-neutral-800">{item.name}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-400">{item.hex}</p>
      </div>
    </div>
  );
}

function DraggableFontChip({ item }: { item: ClipboardFontItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-font-${item.id}`,
    data: { kind: "sidebar-font", item } satisfies DragItemData,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : "auto",
        position: "relative",
        touchAction: "none",
      }}
      className="flex cursor-grab items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 active:cursor-grabbing"
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-[12px]"
        style={{ fontFamily: item.family }}
      >
        Aa
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-neutral-800" style={{ fontFamily: item.family }}>
          {item.family}
        </p>
        <p className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{item.category}</p>
      </div>
    </div>
  );
}

function CanvasBand({
  band,
  onRemove,
  onColorChange,
  onTextColorChange,
  onResetTextColor,
}: {
  band: { id: string; hex: string; name: string; font?: { family: string; category: string }; textColor?: string };
  onRemove: () => void;
  onColorChange: (hex: string) => void;
  onTextColorChange: (hex: string) => void;
  onResetTextColor: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `band-${band.id}`, data: { kind: "band", bandId: band.id } });
  const autoTextColor = getReadableTextColor(band.hex);
  // band.textColor, when set, is a deliberate override — someone testing a
  // specific pairing they have in mind, not just the safest computed one.
  const textColor = band.textColor ?? autoTextColor;
  const contrast = getContrastInfo(band.hex, textColor);

  return (
    <div
      ref={setNodeRef}
      className="relative flex flex-1 items-center justify-between px-6 py-4 transition-shadow"
      style={{
        backgroundColor: band.hex,
        boxShadow: isOver ? `inset 0 0 0 2px ${textColor}` : "none",
      }}
    >
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: textColor, opacity: 0.65 }}>
          {band.name}
        </p>
        <p
          className="mt-1 truncate text-lg font-medium"
          style={{ color: textColor, fontFamily: band.font?.family, opacity: band.font ? 1 : 0.5 }}
        >
          {band.font ? band.font.family : "Drop a font here"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ color: textColor, backgroundColor: `${textColor}22` }}
        >
          {contrast.label} · {contrast.ratio.toFixed(1)}:1
        </span>
        <input
          type="color"
          value={band.hex}
          onChange={(e) => onColorChange(e.target.value)}
          aria-label={`Change ${band.name}'s background colour`}
          className="h-7 w-7 flex-none cursor-pointer rounded-full border-0 bg-transparent p-0"
          style={{ boxShadow: `0 0 0 1px ${textColor}55` }}
        />
        <div className="relative flex-none">
          <input
            type="color"
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            aria-label={`Change ${band.name}'s text colour`}
            title="Text colour"
            className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
            style={{ boxShadow: `0 0 0 1px ${textColor}55` }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold"
            style={{ backgroundColor: band.hex, color: textColor, boxShadow: `0 0 0 1px ${textColor}55` }}
          >
            T
          </span>
        </div>
        {band.textColor && (
          <button
            type="button"
            onClick={onResetTextColor}
            aria-label={`Reset ${band.name}'s text colour to automatic`}
            className="text-[10px] underline underline-offset-2"
            style={{ color: textColor, opacity: 0.75 }}
          >
            Auto
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${band.name} from canvas`}
          className="rounded-full p-1.5 transition-colors hover:bg-black/10"
          style={{ color: textColor }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CanvasDropZone({
  canvasBands,
  removeColorFromCanvas,
  updateBandColor,
  updateBandTextColor,
  resetBandTextColor,
}: {
  canvasBands: { id: string; hex: string; name: string; font?: { family: string; category: string }; textColor?: string }[];
  removeColorFromCanvas: (bandId: string) => void;
  updateBandColor: (bandId: string, hex: string) => void;
  updateBandTextColor: (bandId: string, hex: string) => void;
  resetBandTextColor: (bandId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });

  return (
    <div
      ref={setNodeRef}
      className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl"
      style={{
        boxShadow: isOver && canvasBands.length < 5 ? "inset 0 0 0 2px #a3a3a3" : "inset 0 0 0 1px #e5e5e5",
      }}
    >
      {canvasBands.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
          Drag up to 5 colors here to build the canvas
        </div>
      ) : (
        canvasBands.map((band) => (
          <CanvasBand
            key={band.id}
            band={band}
            onRemove={() => removeColorFromCanvas(band.id)}
            onColorChange={(hex) => updateBandColor(band.id, hex)}
            onTextColorChange={(hex) => updateBandTextColor(band.id, hex)}
            onResetTextColor={() => resetBandTextColor(band.id)}
          />
        ))
      )}
    </div>
  );
}

export function PreviewLab() {
  const sidebarColors = usePreviewLabStore((s) => s.sidebarColors);
  const sidebarFonts = usePreviewLabStore((s) => s.sidebarFonts);
  const canvasBands = usePreviewLabStore((s) => s.canvasBands);
  const addColorToCanvas = usePreviewLabStore((s) => s.addColorToCanvas);
  const removeColorFromCanvas = usePreviewLabStore((s) => s.removeColorFromCanvas);
  const assignFontToBand = usePreviewLabStore((s) => s.assignFontToBand);
  const updateBandColor = usePreviewLabStore((s) => s.updateBandColor);
  const updateBandTextColor = usePreviewLabStore((s) => s.updateBandTextColor);
  const resetBandTextColor = usePreviewLabStore((s) => s.resetBandTextColor);
  const router = useRouter();
  const stageStudioImport = useStudioImportStore((s) => s.stage);

  // PointerSensor's distance-based activation works for mouse/trackpad, but
  // on touch it doesn't preventDefault until the distance threshold is
  // crossed — by then the browser's own scroll gesture has usually already
  // taken over, so the drag never starts. TouchSensor with a delay+tolerance
  // constraint is dnd-kit's documented fix: the delay gives it time to
  // capture the touch and block native scroll before the drag begins.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const data = active.data.current as DragItemData | undefined;
    if (!data) return;

    if (data.kind === "sidebar-color") {
      addColorToCanvas(data.item);
      return;
    }

    if (data.kind === "sidebar-font") {
      const overId = String(over.id);
      if (overId.startsWith("band-")) {
        assignFontToBand(overId.slice("band-".length), data.item);
        return;
      }
      // The bands sit inside the canvas drop zone and are flex-1, so a single
      // band fills it and the two centres coincide. closestCenter then resolves
      // to the zone rather than the band under the cursor and the drop silently
      // does nothing, which is why pairing a font never worked with one colour
      // on the canvas. Recover the band from the collision list, falling back to
      // the only band when there is just one.
      const bandHit = event.collisions?.find((c) => String(c.id).startsWith("band-"));
      if (bandHit) {
        assignFontToBand(String(bandHit.id).slice("band-".length), data.item);
      } else if (canvasBands.length === 1) {
        assignFontToBand(canvasBands[0].id, data.item);
      }
    }
  }

  function handleSendToStudio() {
    const bandFonts = canvasBands.map((b) => b.font).filter((f): f is NonNullable<typeof f> => Boolean(f));
    stageStudioImport({
      colors: canvasBands.map((band) => ({ hex: band.hex })),
      primaryFont: bandFonts[0]?.family,
      secondaryFont: bandFonts[1]?.family,
    });
    router.push("/studio");
  }

  return (
    <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Preview Lab</p>
          <h2 className="mt-1 text-xl font-semibold text-neutral-900">Build a color and type canvas</h2>
        </div>
        <button
          type="button"
          onClick={handleSendToStudio}
          disabled={canvasBands.length === 0}
          className="rounded-full border border-neutral-200 bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send to Studio
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="mt-6 grid gap-4 md:grid-cols-[240px_1fr]">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Colors</p>
            <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto">
              {sidebarColors.length === 0 && (
                <p className="text-xs leading-relaxed text-neutral-400">
                  Clip colors and use &ldquo;Import to Live Preview&rdquo; from the clipboard tray.
                </p>
              )}
              {sidebarColors.map((c) => (
                <DraggableColorChip key={c.id} item={c} />
              ))}
            </div>

            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Fonts</p>
            <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto">
              {sidebarFonts.length === 0 && (
                <p className="text-xs leading-relaxed text-neutral-400">Clipped fonts will show up here.</p>
              )}
              {sidebarFonts.map((f) => (
                <DraggableFontChip key={f.id} item={f} />
              ))}
            </div>
          </div>

          <CanvasDropZone
            canvasBands={canvasBands}
            removeColorFromCanvas={removeColorFromCanvas}
            updateBandColor={updateBandColor}
            updateBandTextColor={updateBandTextColor}
            resetBandTextColor={resetBandTextColor}
          />
        </div>
      </DndContext>
      <p className="mt-2 text-xs text-neutral-400">
        {canvasBands.length}/5 colors on canvas · drag a font from the sidebar onto any color to pair it and check live WCAG contrast.
      </p>
    </div>
  );
}
