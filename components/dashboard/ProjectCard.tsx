/**
 * ProjectCard — one saved project on /dashboard. Shows just enough of the
 * palette + font pairing to recognize the project at a glance; the full
 * system lives on /dashboard/[projectId].
 *
 * Owner: Amna
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Project } from "@/types";

function roleColor(project: Project, role: string, fallbackIndex: number) {
  const byRole = project.colors.find((c) => c.role === role);
  return byRole?.hex ?? project.colors[fallbackIndex]?.hex ?? "#E8E4E0";
}

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const bg = roleColor(project, "background", 0);
  const text = roleColor(project, "text", project.colors.length - 1);
  const swatches = project.colors.slice(0, 4);
  const editedAt = new Date(project.updatedAt);
  const plateNo = String(index + 1).padStart(2, "0");

  return (
    <Link href={`/dashboard/${project.id}`} className="block">
      <motion.article
        whileHover={{ y: -3 }}
        transition={{ duration: 0.15 }}
        className="relative overflow-visible rounded-2xl border border-black/[0.12] bg-[#F2EBE0] shadow-[0_10px_30px_-18px_rgba(20,17,12,0.35)] transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(20,17,12,0.45)]"
      >
        <div className="absolute -right-px -top-3 z-10 rounded bg-[#211E18] px-2 py-1 font-mono-plex text-[9px] font-bold text-[#F2EBE0]">
          NO. {plateNo}
        </div>

        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex min-h-[110px] flex-col justify-center gap-3 p-5"
            style={{ background: bg }}
          >
            <div
              className="text-2xl font-semibold"
              style={{ color: text, fontFamily: project.fonts.primary?.family }}
            >
              Aa
            </div>
            <div className="flex h-10 overflow-hidden rounded-md">
              {swatches.map((c, i) => (
                <div key={i} className="flex-1" style={{ background: c.hex }} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-[15px] font-semibold text-[#211E18]">{project.name}</h3>
              {project.aiGenerated && (
                <span className="shrink-0 rounded-full bg-[#222D52]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#222D52]">
                  AI
                </span>
              )}
            </div>
            <p className="text-xs text-[#6E675C]">
              {project.fonts.primary?.family} / {project.fonts.secondary?.family}
            </p>
            <p className="text-[11px] text-[#6E675C]">
              Edited {editedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
