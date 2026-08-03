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
import { rowToProject, ProjectRow } from "@/lib/db/projectMapper";

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

  const touchesData =
    parsed.data.colors !== undefined ||
    parsed.data.fonts !== undefined ||
    parsed.data.typeScale !== undefined ||
    parsed.data.spacing !== undefined ||
    parsed.data.shadows !== undefined ||
    parsed.data.cornerRadius !== undefined ||
    parsed.data.moodboard !== undefined ||
    parsed.data.designSystem !== undefined ||
    parsed.data.context !== undefined ||
    parsed.data.theme !== undefined ||
    parsed.data.aiReasoning !== undefined;

  if (touchesData) {
    updates.data = {
      colors: parsed.data.colors ?? existing.data.colors,
      fonts: parsed.data.fonts ?? existing.data.fonts,
      typeScale: parsed.data.typeScale ?? existing.data.typeScale,
      spacing: parsed.data.spacing ?? existing.data.spacing,
      shadows: parsed.data.shadows ?? existing.data.shadows,
      cornerRadius: parsed.data.cornerRadius ?? existing.data.cornerRadius,
      moodboard: parsed.data.moodboard ?? existing.data.moodboard,
      designSystem: parsed.data.designSystem ?? existing.data.designSystem,
      context: parsed.data.context ?? existing.data.context,
      theme: parsed.data.theme ?? existing.data.theme,
      aiReasoning: parsed.data.aiReasoning ?? existing.data.aiReasoning,
    };
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
