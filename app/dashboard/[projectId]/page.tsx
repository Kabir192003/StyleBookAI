/**
 * /dashboard/[projectId] — single saved project
 *
 * Owner: Amna
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 + §6 (AI reasoning must be surfaced
 * prominently, not collapsed, when the project is AI-generated).
 *
 * Fetches GET /api/projects/[id] client-side — Kabir's backend is real
 * (Supabase-backed), gated behind the username/password auth in lib/auth/
 * (see CLAUDE.md). A 401 here means the session lapsed mid-visit, not a
 * real 404 — handled as its own "unauthorized" state with a sign-in CTA,
 * not lumped into the generic error state.
 *
 * "Edit in Studio": StudioBuilder (components/studio/StudioBuilder.tsx)
 * hydrates its local state from useAIResultStore (store/aiResultStore.ts),
 * the same bridge /studio/ai uses to hand off a generated result — not
 * from store/studioStore.ts, which nothing reads. A saved Project is
 * already an AIGeneratedProject plus id/userId/timestamps (types/ai.ts),
 * so populating that store with everything but those three fields (plus
 * `setSavedProjectId(id)`, so Studio's Save button updates this row
 * instead of creating a duplicate) and routing to /studio is the real
 * integration.
 *
 * "Export": POST /api/export, which now returns real generated text
 * (see lib/export/generators.ts) for css/scss/tailwind/json — no PDF,
 * that's client-side via html-to-image per the route's own comment, not
 * built here. Downloads the returned content with file-saver (already a
 * dependency for exactly this).
 *
 * "Delete": DELETE /api/projects/[id] behind an inline confirm.
 *
 * The mockup panel is a small self-contained preview, not
 * components/studio/PreviewLab.tsx — that component takes no project
 * prop and reads from usePreviewLabStore directly, built for Studio's
 * own active-editing session rather than as an embeddable read-only
 * viewer for an arbitrary saved project. Wiring this read-only page into
 * a store it doesn't otherwise touch felt like more risk than value, so
 * it stays a lightweight local component.
 *
 * Styling adapted to the site's cream/ink/navy editorial system instead
 * of the separate glass/dark design system this was originally built
 * against, to stay visually consistent with Studio/browse/SiteHeader.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { saveAs } from "file-saver";
import { useAIResultStore } from "@/store";
import { InfoNote } from "@/components/ui/InfoNote";
import { ContrastBadge } from "@/components/ui/ContrastBadge";
import { buttonVariants } from "@/components/ui/Button";
import type { Project } from "@/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "unauthorized" }
  | { status: "ready"; project: Project };

const EXPORT_FORMATS = [
  { label: "CSS variables", value: "css", ext: "css" },
  { label: "Tailwind config", value: "tailwind", ext: "js" },
  { label: "SCSS", value: "scss", ext: "scss" },
  { label: "JSON", value: "json", ext: "json" },
] as const;

function roleColor(project: Project, role: string, fallbackIndex = 0) {
  return (
    project.colors.find((c) => c.role === role)?.hex ??
    project.colors[fallbackIndex]?.hex ??
    "#E8E4E0"
  );
}

function ScalePreview({ project }: { project: Project }) {
  const { sizes, ratioName, baseSize } = project.typeScale;
  const rows: Array<[string, number]> = [
    ["Display", sizes["5xl"]],
    ["Heading 1", sizes["4xl"]],
    ["Heading 2", sizes["3xl"]],
    ["Heading 3", sizes["2xl"]],
    ["Body", sizes.base],
  ];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono-plex text-xs font-semibold uppercase tracking-wider text-[#8A8477]">
          Scale preview
        </h3>
        <span className="font-mono-plex text-[11px] text-[#8A8477]">
          {ratioName} · {baseSize}px base
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map(([label, size]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <span
              className="truncate font-editorial-serif text-[#211E18]"
              style={{ fontSize: Math.min(size, 40) }}
            >
              The quiet mind
            </span>
            <span className="shrink-0 font-mono-plex text-[11px] text-[#8A8477]">
              {label} · {Math.round(size)}px
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveMockup({ project }: { project: Project }) {
  const bg = roleColor(project, "background", 0);
  const surface = roleColor(project, "surface", 0);
  const text = roleColor(project, "text", project.colors.length - 1);
  const primary = roleColor(project, "primary", 0);
  const heading = project.fonts.primary?.family;
  const body = project.fonts.secondary?.family;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/[0.12] p-6" style={{ background: bg }}>
      <span className="absolute right-4 top-4 rounded bg-[#211E18] px-2 py-1 font-mono-plex text-[9px] font-bold text-[#F2EBE0]">
        LIVE
      </span>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: text, opacity: 0.6 }}>
        Live mockup
      </h3>
      <div className="rounded-xl p-6 shadow-[0_4px_14px_rgba(24,28,45,0.07)]" style={{ background: surface || "#fff" }}>
        <h4 className="mb-2 text-2xl font-semibold" style={{ color: text, fontFamily: heading }}>
          Your headline goes here
        </h4>
        <p className="mb-4 text-sm leading-relaxed" style={{ color: text, opacity: 0.75, fontFamily: body }}>
          This is how body copy reads against this background — enough text
          to judge whether the pairing holds up in real use.
        </p>
        <div
          className="mb-3 rounded-lg border px-3 py-2.5 text-sm"
          style={{ borderColor: text, opacity: 0.5, color: text }}
        >
          Input field
        </div>
        <button
          className="w-full rounded-full py-2.5 text-sm font-semibold"
          style={{ background: primary, color: bg }}
        >
          Primary action
        </button>
      </div>
      <div className="mt-4">
        <ContrastBadge foreground={text} background={bg} />
      </div>
    </div>
  );
}

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const setAIResult = useAIResultStore((s) => s.setResult);
  const setSavedProjectId = useAIResultStore((s) => s.setSavedProjectId);

  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${params.projectId}`);
        if (res.status === 401) {
          if (!cancelled) setState({ status: "unauthorized" });
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
        if (!cancelled) setState({ status: "ready", project: data.project });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Couldn't load this project.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.projectId]);

  function handleEdit(project: Project) {
    const { id, userId, createdAt, updatedAt, ...aiGeneratedShape } = project;
    setAIResult(project.aiPrompt ?? "", Boolean(project.designSystem), aiGeneratedShape);
    setSavedProjectId(id);
    router.push("/studio");
  }

  async function handleExport(format: (typeof EXPORT_FORMATS)[number]) {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.projectId, format: format.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed.");
      const project = state.status === "ready" ? state.project : null;
      const filename = `${(project?.name ?? "stylebook").toLowerCase().replace(/\s+/g, "-")}.${format.ext}`;
      saveAs(new Blob([data.content], { type: "text/plain;charset=utf-8" }), filename);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't delete this project.");
      }
      router.push("/dashboard");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete this project.");
      setDeleting(false);
    }
  }

  if (state.status === "loading") {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] px-6 py-12 sm:px-12">
        <div className="mx-auto flex max-w-6xl items-center gap-2 text-sm text-[#8A8477]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading project…
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] px-6 py-12 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#6E675C] hover:text-[#211E18]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to My Projects
          </Link>
          <div className="rounded-2xl border border-[#B3261E]/30 bg-[#B3261E]/10 px-6 py-10 text-center text-sm text-[#B3261E]">
            {state.message}
          </div>
        </div>
      </main>
    );
  }

  if (state.status === "unauthorized") {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] px-6 py-12 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#6E675C] hover:text-[#211E18]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to My Projects
          </Link>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-black/[0.18] py-20 text-center">
            <h2 className="font-editorial-serif text-xl font-bold tracking-tight text-[#211E18]">
              Sign in to see this project
            </h2>
            <p className="mx-auto max-w-sm text-sm text-[#6E675C]">
              Your session&rsquo;s expired or you&rsquo;re signed out — sign back in to pick up where you left off.
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
        </div>
      </main>
    );
  }

  const { project } = state;

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] px-6 py-10 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#6E675C] hover:text-[#211E18]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to My Projects
        </Link>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 font-mono-plex text-[11px] uppercase tracking-[0.18em] text-[#222D52]">Plate No. 01</p>
            <h1 className="font-editorial-serif text-3xl font-bold tracking-tight text-[#211E18]">
              {project.name}
            </h1>
            <p className="mt-1 text-sm text-[#6E675C]">
              Created {new Date(project.createdAt).toLocaleDateString()} · Edited{" "}
              {new Date(project.updatedAt).toLocaleDateString()} ·{" "}
              {project.aiGenerated ? "AI-generated" : "Built manually"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => handleEdit(project)} className={buttonVariants({ variant: "primary" })}>
              Edit in Studio
            </button>

            <div className="relative">
              <button
                onClick={() => setExportOpen((v) => !v)}
                disabled={exporting}
                className={buttonVariants({ variant: "ghost" }) + " flex items-center gap-1.5 disabled:opacity-50"}
              >
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Export
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <AnimatePresence>
                {exportOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-black/[0.12] bg-[#F2EBE0] p-1.5 shadow-[0_20px_50px_-20px_rgba(20,17,12,0.4)]"
                  >
                    {EXPORT_FORMATS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => handleExport(f)}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#211E18] hover:bg-black/[0.05]"
                      >
                        {f.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!confirmingDelete ? (
              <button onClick={() => setConfirmingDelete(true)} className={buttonVariants({ variant: "destructive" }) + " flex items-center gap-1.5"}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-[#B3261E]/30 bg-[#B3261E]/10 px-3 py-1.5 text-sm text-[#B3261E]">
                Delete this project?
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-full bg-[#B3261E] px-2.5 py-1 text-xs font-semibold text-[#F2EBE0] disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs font-medium text-[#8A8477] hover:text-[#211E18]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {exportError && <p className="mb-4 text-xs text-[#B3261E]">{exportError}</p>}
        {deleteError && <p className="mb-4 text-xs text-[#B3261E]">{deleteError}</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6 shadow-[0_10px_30px_-18px_rgba(20,17,12,0.35)]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-[#222D52]" aria-hidden="true" />
            <div>
              <h3 className="mb-3 font-mono-plex text-xs font-semibold uppercase tracking-wider text-[#8A8477]">
                Palette
              </h3>
              <div className="flex flex-wrap gap-4">
                {project.colors.map((c) => (
                  <div key={c.id + (c.role ?? "")} className="flex flex-col gap-1.5">
                    <div className="h-14 w-20 rounded-lg border border-black/[0.12]" style={{ background: c.hex }} />
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium capitalize text-[#211E18]">
                        {c.role ?? c.name}
                      </span>
                      <InfoNote note={c.note} />
                    </div>
                    <span className="font-mono-plex text-[11px] text-[#8A8477]">{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-black/[0.1]" />

            <div>
              <h3 className="mb-3 font-mono-plex text-xs font-semibold uppercase tracking-wider text-[#8A8477]">
                Typography
              </h3>
              <div className="flex flex-wrap gap-8">
                <div>
                  <div className="mb-1 flex items-center gap-1">
                    <span className="font-mono-plex text-[10px] text-[#8A8477]">HEADING</span>
                    {project.fonts.primary && <InfoNote note={project.fonts.primary.note} />}
                  </div>
                  <div className="font-editorial-serif text-lg font-semibold text-[#211E18]">
                    {project.fonts.primary?.family}
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1">
                    <span className="font-mono-plex text-[10px] text-[#8A8477]">BODY</span>
                    {project.fonts.secondary && <InfoNote note={project.fonts.secondary.note} />}
                  </div>
                  <div className="text-lg text-[#211E18]">{project.fonts.secondary?.family}</div>
                </div>
              </div>
            </div>

            <div className="h-px bg-black/[0.1]" />

            <ScalePreview project={project} />

            {project.aiGenerated && project.aiReasoning && (
              <>
                <div className="h-px bg-black/[0.1]" />
                <div>
                  <h3 className="mb-3 font-mono-plex text-xs font-semibold uppercase tracking-wider text-[#8A8477]">
                    Why this system — AI reasoning
                  </h3>
                  <div className="flex flex-col gap-3 text-sm leading-relaxed text-[#6E675C]">
                    <p><span className="font-semibold text-[#211E18]">Palette. </span>{project.aiReasoning.palette}</p>
                    <p><span className="font-semibold text-[#211E18]">Fonts. </span>{project.aiReasoning.fonts}</p>
                    <p><span className="font-semibold text-[#211E18]">Type scale. </span>{project.aiReasoning.typeScale}</p>
                    <p className="font-editorial-serif italic text-[#211E18]">{project.aiReasoning.overall}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <LiveMockup project={project} />
        </div>
      </div>
    </main>
  );
}
