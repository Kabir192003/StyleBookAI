/**
 * The playground's custom colour picker (docs/DESIGN_PLAYGROUND.md §3):
 * HEX, RGB and HSL entry plus the native OS picker, all four kept in sync.
 *
 * Conversion is `colord` throughout — the dependency PreviewLab already
 * uses. Nothing in this file does colour maths by hand, because two
 * converters in one codebase eventually disagree by a rounding step and the
 * symptom is a picker whose HSL fields drift every time you touch the RGB
 * ones.
 *
 * The invalid-input rule, which is the whole reason this is 200 lines and not
 * 40: a field being edited is **never** rewritten under the user's cursor.
 * `#22` on the way to `#222D52` is not a valid colour, and a picker that
 * reverts it — or worse, commits a garbage colour — is unusable. So each
 * field owns its own draft text, only a *valid* draft is committed, and the
 * other three representations resync from the commit. An invalid draft is
 * flagged inline and simply doesn't propagate.
 */
"use client";

import { useState } from "react";
import { colord } from "colord";

type Channels = { r: string; g: string; b: string; h: string; s: string; l: string };

function channelsFrom(hex: string): Channels {
  const c = colord(hex);
  const { r, g, b } = c.toRgb();
  const { h, s, l } = c.toHsl();
  return {
    r: String(r),
    g: String(g),
    b: String(b),
    h: String(Math.round(h)),
    s: String(Math.round(s)),
    l: String(Math.round(l)),
  };
}

/** Which group last accepted a keystroke — the one group we must not resync. */
type EditingGroup = "hex" | "rgb" | "hsl" | null;

const FIELD_CLASS =
  "w-full rounded border border-black/[0.16] bg-white px-2 py-1 font-mono-plex text-[11px] text-[#211E18] outline-none focus:border-[#222D52]";
const LEGEND_CLASS = "font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#8A8477]";

export function CustomColorPicker({
  initialHex = "#222D52",
  onAdd,
  onClose,
}: {
  initialHex?: string;
  /** Called with a normalised uppercase 6-digit hex. */
  onAdd: (hex: string) => void;
  onClose: () => void;
}) {
  const seed = colord(initialHex).isValid() ? colord(initialHex).toHex().toUpperCase() : "#222D52";
  const [hex, setHex] = useState(seed);
  const [hexDraft, setHexDraft] = useState(seed);
  const [channels, setChannels] = useState<Channels>(() => channelsFrom(seed));
  const [editing, setEditing] = useState<EditingGroup>(null);
  const [invalid, setInvalid] = useState<EditingGroup>(null);

  /** Accepts a valid colour and refreshes every group except the one being typed in. */
  function commit(nextHex: string, from: EditingGroup) {
    const normalised = colord(nextHex).alpha(1).toHex().toUpperCase();
    setHex(normalised);
    setInvalid(null);
    if (from !== "hex") setHexDraft(normalised);
    const next = channelsFrom(normalised);
    setChannels((current) => ({
      // The source group keeps the user's own digits: resyncing RGB from a
      // commit RGB itself produced would rewrite `07` to `7` mid-keystroke.
      r: from === "rgb" ? current.r : next.r,
      g: from === "rgb" ? current.g : next.g,
      b: from === "rgb" ? current.b : next.b,
      h: from === "hsl" ? current.h : next.h,
      s: from === "hsl" ? current.s : next.s,
      l: from === "hsl" ? current.l : next.l,
    }));
  }

  function onHexInput(value: string) {
    setEditing("hex");
    setHexDraft(value);
    // Typing `222D52` without the `#` is the single most common way a hex
    // arrives from a design tool's copy button, so accept both spellings.
    const candidate = value.trim().startsWith("#") ? value.trim() : `#${value.trim()}`;
    if (colord(candidate).isValid()) commit(candidate, "hex");
    else setInvalid("hex");
  }

  function onChannelInput(key: keyof Channels, value: string) {
    const group: EditingGroup = key === "r" || key === "g" || key === "b" ? "rgb" : "hsl";
    setEditing(group);
    const next = { ...channels, [key]: value };
    setChannels(next);

    const nums = {
      r: Number(next.r),
      g: Number(next.g),
      b: Number(next.b),
      h: Number(next.h),
      s: Number(next.s),
      l: Number(next.l),
    };
    const relevant = group === "rgb" ? ([nums.r, nums.g, nums.b] as const) : ([nums.h, nums.s, nums.l] as const);
    // An empty field mid-edit is not an error, it's a half-typed number —
    // flagging it would light the panel red on every backspace.
    const fields = group === "rgb" ? [next.r, next.g, next.b] : [next.h, next.s, next.l];
    if (fields.some((f) => f.trim() === "")) {
      setInvalid(null);
      return;
    }
    if (relevant.some((n) => !Number.isFinite(n))) {
      setInvalid(group);
      return;
    }

    const candidate =
      group === "rgb"
        ? colord({ r: clamp(nums.r, 0, 255), g: clamp(nums.g, 0, 255), b: clamp(nums.b, 0, 255) })
        : colord({ h: wrapHue(nums.h), s: clamp(nums.s, 0, 100), l: clamp(nums.l, 0, 100) });

    if (!candidate.isValid()) {
      setInvalid(group);
      return;
    }
    commit(candidate.toHex(), group);
  }

  return (
    <div className="rounded-xl border border-black/[0.12] bg-[#F7F2E9] p-3">
      <div className="flex items-stretch gap-3">
        <div className="flex flex-col gap-2">
          <div
            className="h-[68px] w-[68px] shrink-0 rounded-lg border border-black/[0.14]"
            style={{ backgroundColor: hex }}
            aria-label={`Current colour ${hex}`}
          />
          {/* The native picker is the only affordance here that lets someone
              *find* a colour rather than type one they already know. */}
          <label className="block cursor-pointer">
            <span className="sr-only">Pick visually</span>
            <input
              type="color"
              value={hex}
              onChange={(e) => {
                setEditing(null);
                commit(e.target.value, null);
              }}
              className="h-7 w-[68px] cursor-pointer rounded border border-black/[0.16] bg-white p-0.5"
            />
          </label>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <label className={LEGEND_CLASS} htmlFor="pg-hex">
              Hex
            </label>
            <input
              id="pg-hex"
              value={hexDraft}
              onChange={(e) => onHexInput(e.target.value)}
              spellCheck={false}
              className={`${FIELD_CLASS} mt-0.5 ${invalid === "hex" ? "border-[#B23B3B]" : ""}`}
              placeholder="#222D52"
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(["r", "g", "b"] as const).map((key) => (
              <div key={key}>
                <label className={LEGEND_CLASS} htmlFor={`pg-${key}`}>
                  {key.toUpperCase()}
                </label>
                <input
                  id={`pg-${key}`}
                  value={channels[key]}
                  inputMode="numeric"
                  onChange={(e) => onChannelInput(key, e.target.value)}
                  className={`${FIELD_CLASS} mt-0.5 ${invalid === "rgb" ? "border-[#B23B3B]" : ""}`}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(["h", "s", "l"] as const).map((key) => (
              <div key={key}>
                <label className={LEGEND_CLASS} htmlFor={`pg-${key}`}>
                  {key.toUpperCase()}
                  {key === "s" || key === "l" ? " %" : "°"}
                </label>
                <input
                  id={`pg-${key}`}
                  value={channels[key]}
                  inputMode="numeric"
                  onChange={(e) => onChannelInput(key, e.target.value)}
                  className={`${FIELD_CLASS} mt-0.5 ${invalid === "hsl" ? "border-[#B23B3B]" : ""}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {invalid && (
        <p className="mt-2 text-[11px] text-[#B23B3B]">
          {invalid === "hex"
            ? "That isn't a colour yet — keep typing, or try #222D52."
            : "Numbers only. Values outside the range are clamped, not rejected."}
        </p>
      )}

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="font-mono-plex rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#6E675C] hover:text-[#211E18]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onAdd(hex);
            onClose();
          }}
          className="font-mono-plex rounded-full bg-[#222D52] px-3.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#F2EBE0]"
        >
          Add to tray
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {editing ? `Current colour ${hex}` : ""}
      </p>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// 370° is 10°, not an error — hue is the one channel where wrapping is the
// mathematically correct reading of an out-of-range value.
function wrapHue(n: number): number {
  return ((n % 360) + 360) % 360;
}
