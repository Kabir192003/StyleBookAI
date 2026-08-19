import Link from "next/link";
import { notFound } from "next/navigation";
import { allColors } from "@/data/colors";
import { getContrastRatio, getWcagLevel } from "@/lib/colors/colorUtils";
import { FavoriteButton } from "@/components/browse/FavoriteButton";
import { ClipboardButton } from "@/components/clipboard/ClipboardButton";
import { CopyHexButton } from "@/components/colors/CopyHexButton";

function onColor(hex: string): string {
  return getContrastRatio(hex, "#F6F0E5") >= getContrastRatio(hex, "#191611") ? "#F6F0E5" : "#191611";
}

export default function ColorDetailPage({ params }: { params: { id: string } }) {
  const color = allColors.find((c) => c.id === params.id);
  if (!color) notFound();

  const overlay = onColor(color.hex);
  const onWhite = getContrastRatio(color.hex, "#FFFFFF");
  const onBlack = getContrastRatio(color.hex, "#000000");
  const related = allColors.filter((c) => c.family === color.family && c.id !== color.id).slice(0, 6);

  return (
    <main id="main" className="min-h-screen bg-[#F2EBE0] font-grotesk text-[#211E18]">
      <div
        className="flex min-h-[360px] flex-col justify-between px-6 py-10 sm:px-12 sm:py-14"
        style={{ backgroundColor: color.hex, color: overlay }}
      >
        <div className="flex items-center justify-between font-mono-plex text-[11px] uppercase tracking-[0.2em]">
          <Link href="/browse/colors" className="hover:underline">
            ← Back to colours
          </Link>
          <div className="flex items-center gap-1">
            <ClipboardButton target={{ type: "color", item: { id: color.id, hex: color.hex, name: color.name } }} style={{ color: overlay }} />
            <FavoriteButton type="color" id={color.id} style={{ color: overlay }} />
          </div>
        </div>
        <div>
          <span className="font-mono-plex text-[11px] uppercase tracking-[0.2em]">{color.family} · {color.mood[0]}</span>
          <h1 className="mt-3 font-editorial-serif text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.98] tracking-tight">
            {color.name}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono-plex text-sm tracking-[0.08em]">{color.hex}</span>
            <CopyHexButton hex={color.hex} className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em]" style={{ borderColor: overlay, color: overlay }} />
          </div>
        </div>
      </div>

      <section className="grid gap-px border-y border-black/[0.14] bg-black/[0.14] sm:grid-cols-3">
        {[
          { label: "HEX", value: color.hex },
          { label: "RGB", value: `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}` },
          { label: "HSL", value: `${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%` },
        ].map((row) => (
          <div key={row.label} className="bg-[#F2EBE0] px-6 py-6 sm:px-10">
            <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">{row.label}</p>
            <p className="mt-2 font-editorial-serif text-2xl tracking-tight">{row.value}</p>
          </div>
        ))}
      </section>

      <section className="px-6 py-12 sm:px-12">
        <p className="max-w-xl text-[15px] leading-relaxed text-[#555046]">{color.note}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[...color.mood, ...color.style].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/[0.14] px-3 py-1 font-mono-plex text-[10px] uppercase tracking-[0.14em] text-[#6E675C]"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="border-t border-black/[0.14] px-6 py-12 sm:px-12">
        <p className="font-mono-plex text-[11px] uppercase tracking-[0.2em] text-[#6E675C]">Accessibility</p>
        <h2 className="mt-2 font-editorial-serif text-2xl tracking-tight">Contrast against white &amp; black</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { label: "On white", bg: "#FFFFFF", fg: color.hex, ratio: onWhite },
            { label: "On black", bg: "#000000", fg: color.hex, ratio: onBlack },
          ].map((c) => (
            <div key={c.label} className="overflow-hidden rounded-2xl border border-black/[0.14]">
              <div className="flex items-center justify-center px-6 py-10 text-2xl font-editorial-serif" style={{ backgroundColor: c.bg, color: c.fg }}>
                Aa
              </div>
              <div className="flex items-center justify-between bg-[#F2EBE0] px-4 py-3 font-mono-plex text-[11px] uppercase tracking-[0.12em] text-[#6E675C]">
                <span>{c.label}</span>
                <span>
                  {c.ratio.toFixed(2)}:1 — {getWcagLevel(c.ratio)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-black/[0.14] px-6 py-12 sm:px-12">
          <p className="font-mono-plex text-[11px] uppercase tracking-[0.2em] text-[#6E675C]">More {color.family}</p>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {related.map((c) => (
              <Link key={c.id} href={`/browse/colors/${c.id}`} className="group">
                <div className="h-20 rounded-xl border border-black/[0.14]" style={{ backgroundColor: c.hex }} />
                <p className="mt-2 truncate text-[12px] text-[#6E675C] group-hover:text-[#211E18]">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
