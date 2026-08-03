/**
 * /api/projects — list (GET) and create (POST) projects.
 *
 * Owner: Kabir
 *
 * Auth (Clerk) was removed — see CLAUDE.md — so every visitor currently
 * reads/writes the same shared anonymous workspace (getOrCreateAnonymousUserId).
 * Swap in a real per-account scope once username/password login exists.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getOrCreateAnonymousUserId } from "@/lib/db/getOrCreateUser";
import { ProjectInputSchema } from "@/lib/validation/project";
import { projectInputToRow, rowToProject, ProjectRow } from "@/lib/db/projectMapper";

export async function GET(_req: NextRequest) {
  const ownerId = await getOrCreateAnonymousUserId();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .eq("user_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to list projects:", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }

  const projects = (data as ProjectRow[]).map((row) => rowToProject(row, ownerId));
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ProjectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const ownerId = await getOrCreateAnonymousUserId();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("projects")
    .insert({ ...projectInputToRow(parsed.data), user_id: ownerId })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }

  return NextResponse.json({ project: rowToProject(data as ProjectRow, ownerId) }, { status: 201 });
}
