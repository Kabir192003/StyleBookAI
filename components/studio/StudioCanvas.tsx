/**
 * StudioCanvas — the manual builder's color/font picker panel, embedded
 * in app/studio/page.tsx. Distinct from PreviewLab (which is the result
 * viewer) — this is the *input* side: pick colors, assign roles, pick
 * fonts, set the type scale.
 *
 * Owner: Qi
 *
 * TODO (Qi):
 * - Color picker: search/filter over allColors (reuse ColorGrid in a
 *   compact "pick" mode) + role assignment dropdown per pick
 * - Font picker: search/filter over font data once data/fonts/seed.ts
 *   exists
 * - Type scale control: base size input + named ratio select (minor
 *   third, major third, golden ratio, etc. — see types/theme.ts)
 * - Everything writes into store/studioStore.ts
 */

"use client";

import { useMemo, useState } from "react";
import { allColors } from "@/data/colors";
import { useStudioStore } from "@/store/studioStore";
import { Color } from "@/types/color";
import { Font } from "@/types/font";

const fontOptions: Font[] = [
  {
    id: "inter",
    family: "Inter",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
    mood: ["clean"],
    style: ["modern"],
    era: "modern",
    useCase: ["heading", "body"],
    googleFontsId: "Inter",
    isPro: false,
    pairsWith: ["manrope"],
    note: "Inter is crisp and editorial, ideal for headlines.",
  },
  {
    id: "manrope",
    family: "Manrope",
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
    mood: ["friendly"],
    style: ["modern"],
    era: "modern",
    useCase: ["body"],
    googleFontsId: "Manrope",
    isPro: false,
    pairsWith: ["inter"],
    note: "Manrope feels approachable and balanced for body text.",
  },
];

const roleOptions = ["primary", "secondary", "accent", "background", "surface", "text", "textMuted"];

const defaultTypeScale = {
  baseSize: 16,
  ratio: 1.25,
  ratioName: "Major Third",
  sizes: {
    xs: 10,
    sm: 12,
    base: 16,
    lg: 20,
    xl: 25,
    "2xl": 31,
    "3xl": 39,
    "4xl": 49,
    "5xl": 61,
    "6xl": 76,
  },
};

export function StudioCanvas() {
  const { colors, addColor, assignRole, removeColor, setPrimaryFont, setSecondaryFont, setTypeScale } = useStudioStore();
  const [query, setQuery] = useState("");
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  const filteredColors = useMemo(() => {
    const normalized = query.toLowerCase();
    return allColors.filter((color) => {
      return [color.name, color.hex, color.family, color.collection].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [query]);

  const selectedColor = allColors.find((color) => color.id === selectedColorId) ?? filteredColors[0];

  return (
    <div className="mt-6 grid gap-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Color picker</p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search colors"
            className="mt-3 w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {filteredColors.slice(0, 8).map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => {
                setSelectedColorId(color.id);
                addColor(color, "accent");
              }}
              className="rounded-2xl border border-neutral-200 p-3 text-left transition hover:border-neutral-400"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{color.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{color.hex}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-800">Picked colors</h3>
            <span className="text-sm text-neutral-500">{colors.length} selected</span>
          </div>
          {colors.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-neutral-200 p-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full border border-black/10" style={{ backgroundColor: entry.hex }} />
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{entry.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{entry.role ?? "accent"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={entry.role ?? "accent"}
                  onChange={(event) => assignRole(entry.id, event.target.value)}
                  className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => removeColor(entry.id)} className="text-sm text-neutral-500">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Type setup</p>
          <div className="mt-3 grid gap-3">
            <label className="text-sm text-neutral-600">
              <span className="mb-2 block font-medium">Base size</span>
              <input
                type="number"
                defaultValue={16}
                onBlur={(event) => setTypeScale({ ...defaultTypeScale, baseSize: Number(event.target.value) })}
                className="w-full rounded-2xl border border-neutral-200 px-3 py-2"
              />
            </label>
            <label className="text-sm text-neutral-600">
              <span className="mb-2 block font-medium">Ratio</span>
              <select
                defaultValue="1.25"
                onChange={(event) => setTypeScale({ ...defaultTypeScale, ratio: Number(event.target.value), ratioName: event.target.selectedOptions[0].text })}
                className="w-full rounded-2xl border border-neutral-200 px-3 py-2"
              >
                <option value="1.125">Minor Second</option>
                <option value="1.25">Major Third</option>
                <option value="1.333">Perfect Fourth</option>
                <option value="1.618">Golden Ratio</option>
              </select>
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Fonts</p>
          <div className="mt-3 grid gap-3">
            <label className="text-sm text-neutral-600">
              <span className="mb-2 block font-medium">Primary font</span>
              <select onChange={(event) => setPrimaryFont(fontOptions.find((font) => font.id === event.target.value) ?? fontOptions[0])} className="w-full rounded-2xl border border-neutral-200 px-3 py-2">
                {fontOptions.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.family}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-neutral-600">
              <span className="mb-2 block font-medium">Secondary font</span>
              <select onChange={(event) => setSecondaryFont(fontOptions.find((font) => font.id === event.target.value) ?? fontOptions[0])} className="w-full rounded-2xl border border-neutral-200 px-3 py-2">
                {fontOptions.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.family}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {selectedColor && (
          <div className="rounded-2xl border border-neutral-200 p-4">
            <p className="text-sm font-semibold text-neutral-800">Selected sample</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-black/10" style={{ backgroundColor: selectedColor.hex }} />
              <div>
                <p className="text-sm font-semibold text-neutral-800">{selectedColor.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{selectedColor.note}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
