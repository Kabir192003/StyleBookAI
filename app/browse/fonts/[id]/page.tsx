/**
 * /browse/fonts/[id] — Font Detail
 *
 * A large live specimen (own proof-text input, same idea as FontGrid's),
 * full metadata, and resolved "pairs well with" links — the detail-page
 * counterpart to /browse/colors/[id].
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allFonts } from "@/data/fonts";
import { GoogleFontsLoader } from "@/components/fonts/GoogleFontsLoader";
import { FavoriteButton } from "@/components/browse/FavoriteButton";
import { ClipboardButton } from "@/components/clipboard/ClipboardButton";

const DEFAULT_PROOF_TEXT = "Style changes everything.";

function fontStack(family: string, category: string) {
  return `'${family}', ${category === "monospace" ? "monospace" : category === "serif" ? "serif" : "sans-serif"}`;
}

export default function FontDetailPage({ params }: { params: { id: string } }) {
  const [proofText, setProofText] = useState(DEFAULT_PROOF_TEXT);

  const font = allFonts.find((f) => f.id === params.id);
  if (!font) notFound();

  const pairings = font.pairsWith
    .map((id) => allFonts.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  const stack = fontStack(font.family, font.category);

  return (
    <main id="main" className="min-h-screen bg-[#F2EBE0] font-grotesk text-[#211E18]">
      <GoogleFontsLoader fonts={[font, ...pairings]} />

      <section className="border-b border-black/[0.18] px-6 pb-11 pt-10 sm:px-12 sm:pt-14">
        <div className="flex items-center justify-between font-mono-plex text-[11px] uppercase tracking-[0.22em] text-[#6E675C]">
          <Link href="/browse/fonts" className="hover:underline">
            ← Back to fonts
          </Link>
          <div className="flex items-center gap-1 text-[#6E675C]">
            <ClipboardButton target={{ type: "font", item: { id: font.id, family: font.family, category: font.category } }} />
            <FavoriteButton type="font" id={font.id} />
          </div>
        </div>
        <h1
          className="mt-7 overflow-hidden text-ellipsis text-[clamp(2.75rem,9.5vw,7rem)] font-normal leading-[0.98] tracking-tight"
          style={{ fontFamily: stack }}
        >
          {font.family}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-3 font-mono-plex text-[10px] uppercase tracking-[0.16em] text-[#6E675C]">
          <span className="rounded-full border border-black/[0.14] px-3 py-1">{font.category}</span>
          <span className="rounded-full border border-black/[0.14] px-3 py-1">{font.era}</span>
          {font.useCase.map((u) => (
            <span key={u} className="rounded-full border border-black/[0.14] px-3 py-1">
              {u}
            </span>
          ))}
        </div>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[#555046]">{font.note}</p>
      </section>

      <div className="flex items-baseline gap-7 border-b border-black/[0.18] px-6 py-6 sm:px-12">
        <span className="whitespace-nowrap font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#6E675C]">
          Proof text
        </span>
        <input
          value={proofText}
          onChange={(e) => setProofText(e.target.value)}
          placeholder="Type a line to proof…"
          className="min-w-[200px] flex-1 border-b border-black/[0.35] bg-transparent font-editorial-serif text-xl italic text-[#211E18] outline-none placeholder:text-[#6E675C]"
        />
      </div>

      <section className="border-b border-black/[0.18] px-6 py-14 sm:px-12">
        <div
          className="overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,6vw,4.5rem)] leading-[1.12] tracking-tight text-[#211E18]"
          style={{ fontFamily: stack }}
        >
          {proofText || DEFAULT_PROOF_TEXT}
        </div>
        <p className="mt-6 whitespace-nowrap text-[18px] text-[#6E675C]" style={{ fontFamily: stack }}>
          AaBbCcDdEeFf 0123456789
        </p>
      </section>

      <section className="grid gap-px border-b border-black/[0.14] bg-black/[0.14] sm:grid-cols-3">
        {[
          { label: "Variants", value: font.variants.join(", ") },
          { label: "Mood", value: font.mood.join(", ") },
          { label: "Style", value: font.style.join(", ") },
        ].map((row) => (
          <div key={row.label} className="bg-[#F2EBE0] px-6 py-6 sm:px-10">
            <p className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#6E675C]">{row.label}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#211E18]">{row.value}</p>
          </div>
        ))}
      </section>

      {pairings.length > 0 && (
        <section className="px-6 py-12 sm:px-12">
          <p className="font-mono-plex text-[11px] uppercase tracking-[0.2em] text-[#6E675C]">Pairs well with</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {pairings.map((p) => (
              <Link
                key={p.id}
                href={`/browse/fonts/${p.id}`}
                className="rounded-2xl border border-black/[0.14] px-5 py-6 transition-colors hover:bg-[#EBE2D2]"
              >
                <span
                  className="block text-2xl tracking-tight text-[#211E18]"
                  style={{ fontFamily: fontStack(p.family, p.category) }}
                >
                  {p.family}
                </span>
                <span className="mt-1 block font-mono-plex text-[10px] uppercase tracking-[0.16em] text-[#6E675C]">
                  {p.category}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
