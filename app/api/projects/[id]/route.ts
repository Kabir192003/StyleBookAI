/**
 * /api/projects/[id] — get (GET), update (PUT), delete (DELETE) a single
 * project. Enforces that the requesting user owns the project by checking
 * user_id against the Clerk-resolved internal user id (belt-and-suspenders
 * alongside Supabase RLS).
 *
 * Owner: Kabir
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getOrCreateUserId } from "@/lib/db/getOrCreateUser";
import { ProjectUpdateSchema } from "@/lib/validation/project";
import { rowToProject, ProjectRow } from "@/lib/db/projectMapper";

async function loadOwnedProject(id: string, internalUserId: string): Promise<ProjectRow | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data || data.user_id !== internalUserId) return null;
  return data as ProjectRow;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const internalUserId = await getOrCreateUserId(userId);
  const row = await loadOwnedProject(params.id, internalUserId);
  if (!row) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project: rowToProject(row, userId) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const internalUserId = await getOrCreateUserId(userId);
  const existing = await loadOwnedProject(params.id, internalUserId);
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
    parsed.data.theme !== undefined ||
    parsed.data.aiReasoning !== undefined;

  if (touchesData) {
    updates.data = {
      colors: parsed.data.colors ?? existing.data.colors,
      fonts: parsed.data.fonts ?? existing.data.fonts,
      typeScale: parsed.data.typeScale ?? existing.data.typeScale,
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

  return NextResponse.json({ project: rowToProject(data as ProjectRow, userId) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const internalUserId = await getOrCreateUserId(userId);
  const existing = await loadOwnedProject(params.id, internalUserId);
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
