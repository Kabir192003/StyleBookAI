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
        className="relative overflow-visible rounded-2xl border border-app-border bg-app-surface shadow-app-md transition-shadow hover:shadow-app-lg"
      >
        <div className="absolute -right-px -top-3 z-10 rounded bg-app-heading px-2 py-1 font-mono text-[9px] font-bold text-pearl">
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
              <h3 className="truncate text-[15px] font-semibold text-app-text">{project.name}</h3>
              {project.aiGenerated && (
                <span className="shrink-0 rounded-full bg-app-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-app-accent">
                  AI
                </span>
              )}
            </div>
            <p className="text-xs text-app-text-muted">
              {project.fonts.primary?.family} / {project.fonts.secondary?.family}
            </p>
            <p className="text-[11px] text-app-text-muted">
              Edited {editedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
