/**
 * /api/projects — list (GET) and create (POST) projects for the signed-in
 * Clerk user. Owned by the tech lead.
 *
 * TODO:
 * - GET: query Supabase `projects` table filtered by clerk user id (RLS
 *   should also enforce this — see lib/db/schema.sql)
 * - POST: validate body with zod against types/project.ts, insert row
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  // TODO: query Supabase for the current user's projects.
  return NextResponse.json({ projects: [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: validate `body` against the Project type and insert into Supabase.
  return NextResponse.json(
    { error: "Not implemented yet — see TODOs in this file." },
    { status: 501 }
  );
}
