/**
 * POST /api/export — export a project as an image (html-to-image) and/or
 * a code snippet (CSS variables / Tailwind config). Owned by the tech
 * lead, but a good secondary task for whoever finishes their page first.
 *
 * TODO:
 * - Accept { projectId, format: "png" | "css" | "tailwind" }
 * - For "png": this likely needs to happen client-side (html-to-image
 *   renders a DOM node) rather than server-side — reconsider whether this
 *   route is even needed for that case vs. a client-only export button
 * - For "css"/"tailwind": generate the snippet server-side and return as
 *   text
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json(
    { error: "Not implemented yet — see TODOs in this file.", received: body },
    { status: 501 }
  );
}
