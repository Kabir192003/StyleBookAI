// Saving a project requires an account; browsing doesn't (see CLAUDE.md).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { ProjectInputSchema } from "@/lib/validation/project";
import { projectInputToRow, rowToProject, ProjectRow } from "@/lib/db/projectMapper";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to list projects:", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }

  const projects = (data as ProjectRow[]).map((row) => rowToProject(row, user.id));
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ProjectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("projects")
    .insert({ ...projectInputToRow(parsed.data), user_id: user.id })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }

  return NextResponse.json({ project: rowToProject(data as ProjectRow, user.id) }, { status: 201 });
}
