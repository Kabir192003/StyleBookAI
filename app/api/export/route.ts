/**
 * POST /api/export — generates a text code snippet (CSS vars / SCSS /
 * Tailwind config / W3C DTCG design tokens / Tokens Studio file /
 * readable JSON) for a project. Accepts either a saved
 * `projectId` (sign-in required, ownership enforced) or an inline
 * `project` payload for unsaved Studio drafts (no auth needed — exporting
 * a draft you haven't saved doesn't touch anyone's account). The PDF
 * style-guide export is entirely client-side (see
 * lib/export/pdfStyleGuide.ts, wired into Studio's ExportDrawer) — it
 * rasterizes rendered DOM with html-to-image, so it never touches this
 * route.
 *
 * Owner: Kabir
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { ProjectInputSchema } from "@/lib/validation/project";
import { ProjectRow } from "@/lib/db/projectMapper";
import {
  generateExport,
  ExportFormat,
  ExportableProject,
  EXPORT_FORMAT_META,
  exportFileName,
} from "@/lib/export/generators";

const InlineProjectSchema = ProjectInputSchema.pick({
  name: true,
  colors: true,
  fonts: true,
  typeScale: true,
  spacing: true,
  shadows: true,
  cornerRadius: true,
  designSystem: true,
});

const ExportRequestSchema = z
  .object({
    // "figma" and "json-readable" are additive — existing callers that send
    // one of the original four keep working unchanged.
    format: z.enum(["css", "scss", "tailwind", "json", "figma", "json-readable"]),
    projectId: z.string().optional(),
    project: InlineProjectSchema.optional(),
    // When true the route replies with the raw file body plus a
    // Content-Type and Content-Disposition, so the browser saves a
    // correctly-typed, correctly-named file. The default JSON envelope is
    // kept for the existing dashboard caller, which builds its own Blob.
    download: z.boolean().optional(),
  })
  .refine((data) => !!data.projectId || !!data.project, {
    message: "Either projectId or project is required",
  });

/**
 * One response shape for both the saved-project and inline-draft paths, so
 * the two can't drift. `filename` and `contentType` are returned alongside
 * the content because callers were otherwise inventing their own — the
 * dashboard hard-coded `text/plain` and a bare `.json` extension, which is
 * wrong for the DTCG token file (it wants `.tokens.json` for the Figma
 * plugins to recognise it as a token set).
 */
function respond(project: ExportableProject, format: ExportFormat, download: boolean) {
  const content = generateExport(project, format);
  const filename = exportFileName(project, format);
  const { contentType } = EXPORT_FORMAT_META[format];

  if (download) {
    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({ content, format, filename, contentType });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ExportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid export request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { format, projectId, project, download } = parsed.data;
  const exportFormat = format as ExportFormat;

  if (project) {
    return respond(project, exportFormat, download ?? false);
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load project for export:", error);
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }

  const row = data as ProjectRow | null;
  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return respond(
    {
      name: row.name,
      colors: row.data.colors,
      fonts: row.data.fonts,
      typeScale: row.data.typeScale,
      spacing: row.data.spacing,
      shadows: row.data.shadows,
      cornerRadius: row.data.cornerRadius,
      designSystem: row.data.designSystem,
    },
    exportFormat,
    download ?? false
  );
}
