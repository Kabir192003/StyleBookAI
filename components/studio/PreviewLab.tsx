/**
 * PreviewLab — the actual three-view UI described in
 * docs/PRODUCT_AND_UX.md §3. This is the single most important component
 * in the app; take the time to read the spec fully before building.
 *
 * Owner: Qi
 */
"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { colord } from "colord";
import { useRouter } from "next/navigation";
import { usePreviewLabStore } from "@/store/previewLabStore";
import { useStudioImportStore } from "@/store/studioImportStore";
import { Color } from "@/types/color";
import { Font } from "@/types/font";

const fontOptions: Font[] = [
  {
    id: "inter",
    family: "Inter, sans-serif",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
    mood: ["clean"],
    style: ["modern"],
    era: "modern",
    useCase: ["heading"],
    googleFontsId: "Inter",
    isPro: false,
    pairsWith: ["manrope"],
    note: "Inter is crisp and editorial, ideal for headlines.",
  },
  {
    id: "manrope",
    family: "Manrope, sans-serif",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
    mood: ["friendly"],
    style: ["modern"],
    era: "modern",
    useCase: ["body"],
    googleFontsId: "Manrope",
    isPro: false,
    pairsWith: ["inter"],
    note: "Manrope is approachable and balanced for body copy.",
  },
  {
    id: "playfair-display",
    family: "Playfair Display, serif",
    category: "serif",
    variants: ["400", "500", "600", "700"],
    mood: ["luxurious"],
    style: ["elegant"],
    era: "classic",
    useCase: ["heading"],
    googleFontsId: "Playfair Display",
    isPro: false,
    pairsWith: ["source-sans-pro"],
    note: "Playfair Display is refined and high-contrast for premium storytelling.",
  },
  {
    id: "source-sans-pro",
    family: "Source Sans Pro, sans-serif",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
    mood: ["practical"],
    style: ["modern"],
    era: "modern",
    useCase: ["body"],
    googleFontsId: "Source Sans Pro",
    isPro: false,
    pairsWith: ["playfair-display"],
    note: "Source Sans Pro stays elegant and readable across dense content.",
  },
];

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

type SortableSwatchProps = {
  color: Color;
  previousColor?: Color;
};

function SortableSwatch({ color, previousColor }: SortableSwatchProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: color.id });

  const contrast = previousColor ? getContrastInfo(previousColor.hex, color.hex) : null;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full max-w-[220px] rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-neutral-800">{color.name}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{color.hex.toUpperCase()}</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-neutral-200 bg-neutral-50 p-2 text-neutral-500"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${color.name}`}
        >
          ⋮⋮
        </button>
      </div>
      <div className="mt-3 h-16 rounded-xl border border-black/5" style={{ backgroundColor: color.hex }} />
      {contrast && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-neutral-500">Pair contrast</span>
          <span className={`rounded-full px-2.5 py-1 font-medium ${contrast.pass ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {contrast.label} · {contrast.ratio.toFixed(1)}:1
          </span>
        </div>
      )}
    </div>
  );
}

export function PreviewLab() {
  const {
    selectedColors,
    activeView,
    setActiveView,
    reorderColors,
    headingFont,
    bodyFont,
    setHeadingFont,
    setBodyFont,
  } = usePreviewLabStore();
  const router = useRouter();
  const stageStudioImport = useStudioImportStore((s) => s.stage);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderColors(String(active.id), String(over.id));
    }
  };

  const backgroundColor = selectedColors[0]?.hex ?? "#f8fafc";
  const accentColor = selectedColors[1]?.hex ?? "#111827";
  const surfaceColor = selectedColors[2]?.hex ?? "#ffffff";
  const textColor = selectedColors[3]?.hex ?? "#0f172a";
  const bodyTextColor = getReadableTextColor(backgroundColor);

  return (
    <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Preview Lab</p>
          <h2 className="mt-1 text-xl font-semibold text-neutral-900">Compare color stories in three ways</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            stageStudioImport({
              colors: selectedColors.map((color) => ({ hex: color.hex })),
              primaryFont: headingFont?.family,
              secondaryFont: bodyFont?.family,
            });
            router.push("/studio");
          }}
          className="rounded-full border border-neutral-200 bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Send to Studio
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { key: "swatches", label: "Swatches" },
          { key: "mockup", label: "Mockup" },
          { key: "fontOnColor", label: "Font on Color" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveView(tab.key as "swatches" | "mockup" | "fontOnColor")}
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${activeView === tab.key ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeView === "swatches" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <p>Drag the swatches to reorder the palette.</p>
            <p>{selectedColors.length} selected</p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selectedColors.map((color) => color.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex flex-wrap gap-3">
                {selectedColors.map((color, index) => (
                  <SortableSwatch key={color.id} color={color} previousColor={index > 0 ? selectedColors[index - 1] : undefined} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {activeView === "mockup" && (
        <div className="mt-6 rounded-[2rem] border border-neutral-200 p-6" style={{ backgroundColor: backgroundColor }}>
          <div className="rounded-[1.5rem] border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                  Mood mockup
                </p>
                <h3 className="mt-2 text-3xl font-semibold" style={{ color: textColor }}>
                  A palette that feels considered in context
                </h3>
                <p className="mt-3 text-sm leading-7" style={{ color: bodyTextColor }}>
                  This card shows how the colors behave as background, text, accent, and surface rather than as isolated swatches.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 p-4" style={{ backgroundColor: surfaceColor }}>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                  Status
                </p>
                <p className="mt-2 text-sm font-semibold" style={{ color: textColor }}>
                  Ready to review
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-3xl border border-neutral-200 p-5" style={{ backgroundColor: surfaceColor }}>
                <p className="text-sm font-medium" style={{ color: textColor }}>
                  Design brief
                </p>
                <p className="mt-2 text-sm leading-7" style={{ color: bodyTextColor }}>
                  Bold accents should anchor key moments, while the background and surface stay quiet enough for content to breathe.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" className="rounded-full px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: accentColor }}>
                    Launch experience
                  </button>
                  <button type="button" className="rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: accentColor, color: accentColor }}>
                    Explore details
                  </button>
                </div>
              </div>
              <div className="rounded-3xl border border-neutral-200 p-5" style={{ backgroundColor: surfaceColor }}>
                <label className="text-xs uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                  Input field
                </label>
                <input
                  className="mt-3 w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm outline-none"
                  placeholder="Describe the mood"
                  style={{ color: textColor }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === "fontOnColor" && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-neutral-600">
              <span className="mb-2 block font-medium text-neutral-700">Heading font</span>
              <select
                value={headingFont?.id ?? "inter"}
                onChange={(event) => {
                  const nextFont = fontOptions.find((font) => font.id === event.target.value);
                  if (nextFont) {
                    setHeadingFont(nextFont);
                  }
                }}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2"
              >
                {fontOptions.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.family}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-neutral-600">
              <span className="mb-2 block font-medium text-neutral-700">Body font</span>
              <select
                value={bodyFont?.id ?? "manrope"}
                onChange={(event) => {
                  const nextFont = fontOptions.find((font) => font.id === event.target.value);
                  if (nextFont) {
                    setBodyFont(nextFont);
                  }
                }}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2"
              >
                {fontOptions.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.family}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-[2rem] border border-neutral-200 p-6" style={{ backgroundColor: backgroundColor }}>
            <div className="rounded-[1.5rem] border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                Font on color
              </p>
              <h3
                className="mt-2 text-3xl font-semibold"
                style={{ color: textColor, fontFamily: headingFont?.family ?? "Inter, sans-serif" }}
              >
                A refined headline with the right backdrop
              </h3>
              <p
                className="mt-3 max-w-2xl text-sm leading-7"
                style={{ color: bodyTextColor, fontFamily: bodyFont?.family ?? "Manrope, sans-serif" }}
              >
                The same sample card now carries a real type pairing so you can judge if the mood, contrast, and rhythm feel coherent together.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="rounded-full px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: accentColor }}>
                  Save pair
                </button>
                <button type="button" className="rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: accentColor, color: accentColor }}>
                  Compare again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
