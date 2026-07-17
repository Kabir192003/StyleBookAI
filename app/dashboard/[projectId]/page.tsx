/**
 * /dashboard/[projectId] — single saved project
 *
 * Owner: Amna
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 + §6 (AI reasoning must be surfaced
 * prominently, not collapsed, when the project is AI-generated).
 *
 * Fetches GET /api/projects/[id] client-side (Kabir's route, currently a
 * 501 stub — handled as a normal error state below, same reasoning as
 * dashboard/page.tsx). "Edit" hands off to Studio via
 * studioStore.loadFromProject(); "Export" calls /api/export; "Delete"
 * calls DELETE /api/projects/[id] behind an inline confirm.
 *
 * The mockup panel here is a small self-contained preview, NOT
 * components/studio/PreviewLab.tsx — that component is still Qi's TODO
 * stub as of this writing (it renders a placeholder, nothing real to
 * embed yet). Swap this panel for <PreviewLab project={project} /> once
 * that component actually renders the mockup/font-on-color views.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { useStudioStore } from "@/store/studioStore";
import { InfoNote } from "@/components/ui/InfoNote";
import { ContrastBadge } from "@/components/ui/ContrastBadge";
import type { Project } from "@/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; project: Project };

const EXPORT_FORMATS = [
  { label: "CSS variables", value: "css" },
  { label: "Tailwind config", value: "tailwind" },
  { label: "SCSS", value: "scss" },
  { label: "JSON", value: "json" },
  { label: "PDF style guide", value: "pdf" },
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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-app-text-muted">
          Scale preview
        </h3>
        <span className="font-mono text-[11px] text-app-text-muted">
          {ratioName} · {baseSize}px base
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map(([label, size]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <span
              className="truncate font-editorial-serif text-app-text"
              style={{ fontSize: Math.min(size, 40) }}
            >
              The quiet mind
            </span>
            <span className="shrink-0 font-mono text-[11px] text-app-text-muted">
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
    <div className="relative overflow-hidden rounded-lg border border-app-border-strong p-6" style={{ background: bg }}>
      <span className="absolute right-4 top-4 rounded bg-onyx px-2 py-1 font-mono text-[9px] font-bold text-pearl">
        LIVE
      </span>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: text, opacity: 0.6 }}>
        Live mockup
      </h3>
      <div className="rounded-xl p-6 shadow-sm" style={{ background: surface || "#fff" }}>
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
          className="w-full rounded-lg py-2.5 text-sm font-semibold"
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
  const loadFromProject = useStudioStore((s) => s.loadFromProject);

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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
        if (!cancelled) setState({ status: "ready", project: data.project });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Couldn't load this project.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.projectId]);

  function handleEdit(project: Project) {
    loadFromProject(project);
    router.push("/studio");
  }

  async function handleExport(format: string) {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.projectId, format }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export isn't available yet.");
      }
      // TODO: once the route returns real content, trigger the download
      // here (file-saver is already a dependency for exactly this).
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
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center gap-2 text-sm text-app-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading project…
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-app-text-secondary hover:text-app-text">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to My Projects
        </Link>
        <div className="rounded-2xl border border-app-danger/30 bg-app-danger-soft px-6 py-10 text-center text-sm text-app-danger">
          {state.message}
        </div>
      </main>
    );
  }

  const { project } = state;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-app-text-secondary hover:text-app-text">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to My Projects
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-app-text-muted">Plate No. 01</p>
          <h1 className="font-editorial-serif text-3xl font-semibold text-app-heading">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-app-text-secondary">
            Created {new Date(project.createdAt).toLocaleDateString()} · Edited{" "}
            {new Date(project.updatedAt).toLocaleDateString()} ·{" "}
            {project.aiGenerated ? "AI-generated" : "Built manually"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleEdit(project)}
            className="rounded-lg bg-gold-foil px-4 py-2 text-sm font-semibold text-onyx transition-all hover:brightness-105"
          >
            Edit in Studio
          </button>

          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg border border-app-border-strong bg-app-surface px-4 py-2 text-sm font-semibold text-app-text transition-colors hover:bg-app-surface-hover disabled:opacity-50"
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
                  className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-app-border-strong bg-app-surface p-1.5 shadow-lg"
                >
                  {EXPORT_FORMATS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => handleExport(f.value)}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-app-text hover:bg-app-surface-hover"
                    >
                      {f.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 rounded-lg border border-app-danger/30 bg-app-danger-soft px-4 py-2 text-sm font-semibold text-app-danger transition-colors hover:bg-app-danger hover:text-pearl"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-app-danger/30 bg-app-danger-soft px-3 py-1.5 text-sm text-app-danger">
              Delete this project?
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-app-danger px-2.5 py-1 text-xs font-semibold text-pearl disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-xs font-medium text-app-text-muted hover:text-app-text"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {exportError && (
        <p className="mb-4 text-xs text-app-danger">{exportError}</p>
      )}
      {deleteError && (
        <p className="mb-4 text-xs text-app-danger">{deleteError}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-lg border border-app-border-strong bg-app-surface p-6">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gold-foil" aria-hidden="true" />
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-app-text-muted">
              Palette
            </h3>
            <div className="flex flex-wrap gap-4">
              {project.colors.map((c) => (
                <div key={c.id + (c.role ?? "")} className="flex flex-col gap-1.5">
                  <div
                    className="h-14 w-20 rounded-lg border border-app-border-strong"
                    style={{ background: c.hex }}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium capitalize text-app-text">
                      {c.role ?? c.name}
                    </span>
                    <InfoNote note={c.note} />
                  </div>
                  <span className="font-mono text-[11px] text-app-text-muted">{c.hex}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-app-border" />

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-app-text-muted">
              Typography
            </h3>
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="mb-1 flex items-center gap-1">
                  <span className="font-mono text-[10px] text-app-text-muted">HEADING</span>
                  {project.fonts.primary && <InfoNote note={project.fonts.primary.note} />}
                </div>
                <div className="font-editorial-serif text-lg font-semibold text-app-text">
                  {project.fonts.primary?.family}
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1">
                  <span className="font-mono text-[10px] text-app-text-muted">BODY</span>
                  {project.fonts.secondary && <InfoNote note={project.fonts.secondary.note} />}
                </div>
                <div className="text-lg text-app-text">{project.fonts.secondary?.family}</div>
              </div>
            </div>
          </div>

          <div className="h-px bg-app-border" />

          <ScalePreview project={project} />

          {project.aiGenerated && project.aiReasoning && (
            <>
              <div className="h-px bg-app-border" />
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-app-text-muted">
                  Why this system — AI reasoning
                </h3>
                <div className="flex flex-col gap-3 text-sm leading-relaxed text-app-text-secondary">
                  <p><span className="font-semibold text-app-text">Palette. </span>{project.aiReasoning.palette}</p>
                  <p><span className="font-semibold text-app-text">Fonts. </span>{project.aiReasoning.fonts}</p>
                  <p><span className="font-semibold text-app-text">Type scale. </span>{project.aiReasoning.typeScale}</p>
                  <p className="font-editorial-serif italic text-app-text">{project.aiReasoning.overall}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <LiveMockup project={project} />
      </div>
    </main>
  );
}
