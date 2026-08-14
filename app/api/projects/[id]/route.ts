/**
 * /api/projects/[id] — get (GET), update (PUT), delete (DELETE) a single
 * project. Enforces that the requesting user owns the project by checking
 * user_id against the signed-in user's id (belt-and-suspenders alongside
 * Supabase RLS).
 *
 * Owner: Kabir
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { ProjectUpdateSchema } from "@/lib/validation/project";
import { mergeProjectData, rowToProject, ProjectRow } from "@/lib/db/projectMapper";

async function loadOwnedProject(id: string, ownerId: string): Promise<ProjectRow | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data || data.user_id !== ownerId) return null;
  return data as ProjectRow;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const row = await loadOwnedProject(params.id, user.id);
  if (!row) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project: rowToProject(row, user.id) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const existing = await loadOwnedProject(params.id, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = ProjectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.aiGenerated !== undefined) updates.ai_generated = parsed.data.aiGenerated;
  if (parsed.data.aiPrompt !== undefined) updates.ai_prompt = parsed.data.aiPrompt;

  // Any `data` key present means the JSONB column has to be rewritten. This
  // list is deliberately derived from the shape rather than hand-written per
  // field: the previous inline version omitted colorPrimitives,
  // studioPaletteLinks, so an update carrying them wrote
  // nothing (and, worse, the rewrite below dropped whatever the row already
  // held). Merging is now lib/db/projectMapper.ts's job, next to the two other
  // by-name copies of this allowlist.
  const DATA_KEYS = [
    "colors",
    "fonts",
    "typeScale",
    "spacing",
    "shadows",
    "cornerRadius",
    "moodboard",
    "designSystem",
    "colorPrimitives",
    "studioPaletteLinks",
    "context",
    "theme",
    "aiReasoning",
  ] as const;

  const touchesData = DATA_KEYS.some((key) => parsed.data[key] !== undefined);

  if (touchesData) {
    updates.data = mergeProjectData(existing.data, parsed.data);
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("projects")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }

  return NextResponse.json({ project: rowToProject(data as ProjectRow, user.id) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const existing = await loadOwnedProject(params.id, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("projects").delete().eq("id", params.id);
  if (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
