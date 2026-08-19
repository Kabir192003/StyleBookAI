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
  | { status: "unauthorized" }
  | { status: "ready"; projects: Project[] };

type Filter = "all" | "ai" | "manual";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.12] bg-[#F2EBE0]">
      <div className="h-[110px] animate-pulse bg-black/[0.04]" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-2/3 animate-pulse rounded bg-black/[0.06]" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-black/[0.06]" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-black/[0.18] py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-dashed border-[#8A8477] font-editorial-serif text-2xl font-bold text-[#6E675C]">
        Aa
      </div>
      <div>
        <p className="mb-1 font-mono-plex text-[11px] uppercase tracking-[0.18em] text-[#222D52]">Plate 00 · Empty</p>
        <h2 className="font-editorial-serif text-xl font-bold tracking-tight text-[#211E18]">
          No projects yet
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-[#6E675C]">
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
      if (res.status === 401) {
        setState({ status: "unauthorized" });
        return;
      }
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
    <main id="main" className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 font-mono-plex text-[11px] uppercase tracking-[0.18em] text-[#6E675C]">Dashboard · Vol. 01</p>
            <h1 className="font-editorial-serif text-3xl font-bold tracking-tight text-[#211E18]">
              My Projects
            </h1>
            <p className="mt-1 text-sm text-[#6E675C]">
              {state.status === "ready"
                ? `${projects.length} saved project${projects.length === 1 ? "" : "s"}, newest first`
                : state.status === "unauthorized"
                  ? "Sign in to see your projects"
                  : "Loading your saved projects…"}
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
                    ? "bg-[#211E18] text-[#F2EBE0]"
                    : "border border-black/[0.18] bg-[#F2EBE0] text-[#6E675C] hover:bg-black/[0.04]"
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
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#B3261E]/30 bg-[#B3261E]/10 py-16 text-center">
            <p className="text-sm text-[#B3261E]">{state.message}</p>
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-full border border-black/[0.14] bg-[#F2EBE0] px-3 py-1.5 text-xs font-semibold text-[#211E18] hover:bg-black/[0.04]"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {state.status === "unauthorized" && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-black/[0.18] py-20 text-center">
            <h2 className="font-editorial-serif text-xl font-bold tracking-tight text-[#211E18]">
              Sign in to see your projects
            </h2>
            <p className="mx-auto max-w-sm text-sm text-[#6E675C]">
              Saved projects live on your account — sign in or create one to
              get started.
            </p>
            <div className="flex gap-3">
              <Link href="/sign-in" className={buttonVariants({ variant: "primary" })}>
                Sign in
              </Link>
              <Link href="/sign-up" className={buttonVariants({ variant: "ghost" })}>
                Create account
              </Link>
            </div>
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
      </div>
    </main>
  );
}
