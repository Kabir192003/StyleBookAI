/**
 * /dashboard — "My Projects"
 *
 * Owner: Amna
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 (Dashboard). Lists every project the
 * signed-in user (Clerk) has saved, newest first.
 *
 * Fetches GET /api/projects client-side. Kabir's backend is real now
 * (Supabase-backed, see app/api/projects/route.ts) — this was written
 * against that route's contract from the start, so no changes were
 * needed once it went live.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { buttonVariants } from "@/components/ui/Button";
import type { Project } from "@/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; projects: Project[] };

type Filter = "all" | "ai" | "manual";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
      <div className="h-[110px] animate-pulse bg-app-surface-hover" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-2/3 animate-pulse rounded bg-app-surface-hover" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-app-surface-hover" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-app-border-strong py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-dashed border-app-text-muted font-geometric-sans text-2xl font-bold text-app-text-muted">
        Aa
      </div>
      <div>
        <p className="app-eyebrow mb-1 justify-center">Plate 00 · Empty</p>
        <h2 className="font-geometric-sans text-xl font-bold tracking-tight text-app-heading">
          No projects yet
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-app-text-secondary">
          Build a color and type system by hand, or describe your brand and
          let AI draft the first plate for you.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/studio" className={buttonVariants({ variant: "primary" })}>
          Open Studio
        </Link>
        <Link href="/studio/ai" className={buttonVariants({ variant: "ghost" })}>
          Try AI Generate
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [filter, setFilter] = useState<Filter>("all");

  async function load() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      const projects: Project[] = data.projects ?? [];
      projects.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setState({ status: "ready", projects });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Couldn't load your projects.",
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const projects = state.status === "ready" ? state.projects : [];
  const filtered = projects.filter((p) => {
    if (filter === "ai") return p.aiGenerated;
    if (filter === "manual") return !p.aiGenerated;
    return true;
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="app-eyebrow mb-1">Dashboard · Vol. 01</p>
          <h1 className="font-geometric-sans text-3xl font-bold tracking-tight text-app-heading">
            My Projects
          </h1>
          <p className="mt-1 text-sm text-app-text-secondary">
            {state.status === "ready"
              ? `${projects.length} saved project${projects.length === 1 ? "" : "s"}, newest first`
              : "Loading your saved projects\u2026"}
          </p>
        </div>
        <Link href="/studio" className={buttonVariants({ variant: "primary" }) + " flex shrink-0 items-center gap-1.5"}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New project
        </Link>
      </div>

      {state.status === "ready" && projects.length > 0 && (
        <div className="mb-6 flex gap-2">
          {(["all", "ai", "manual"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f
                  ? "bg-app-heading text-pearl"
                  : "border border-app-border-strong bg-app-surface text-app-text-secondary hover:bg-app-surface-hover"
              }`}
            >
              {f === "all" ? "All projects" : f === "ai" ? "AI-generated" : "Manual"}
            </button>
          ))}
        </div>
      )}

      {state.status === "loading" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-app-danger/30 bg-app-danger-soft py-16 text-center">
          <p className="text-sm text-app-danger">{state.message}</p>
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs font-semibold text-app-text hover:bg-app-surface-hover"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {state.status === "ready" && projects.length === 0 && <EmptyState />}

      {state.status === "ready" && projects.length > 0 && (
        <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </motion.div>
      )}
    </main>
  );
}
