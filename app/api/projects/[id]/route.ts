/**
 * /api/projects/[id] — get (GET), update (PUT), delete (DELETE) a single
 * project. Owned by the tech lead. Must enforce that the requesting user
 * owns the project (Clerk id match + Supabase RLS belt-and-suspenders).
 *
 * TODO: implement all three handlers against Supabase.
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: `Not implemented yet for project ${params.id}.` },
    { status: 501 }
  );
}

export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: `Not implemented yet for project ${params.id}.` },
    { status: 501 }
  );
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: `Not implemented yet for project ${params.id}.` },
    { status: 501 }
  );
}
