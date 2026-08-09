/**
 * POST /api/export — generates a text code snippet (CSS vars / SCSS /
 * Tailwind config / JSON) for a project. Accepts either a saved
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
import { generateExport, ExportFormat } from "@/lib/export/generators";

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
    format: z.enum(["css", "scss", "tailwind", "json"]),
    projectId: z.string().optional(),
    project: InlineProjectSchema.optional(),
  })
  .refine((data) => !!data.projectId || !!data.project, {
    message: "Either projectId or project is required",
  });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ExportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid export request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { format, projectId, project } = parsed.data;
  const exportFormat = format as ExportFormat;

  if (project) {
    const content = generateExport(project, exportFormat);
    return NextResponse.json({ content, format: exportFormat });
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

  const content = generateExport(
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
    exportFormat
  );

  return NextResponse.json({ content, format: exportFormat });
}
