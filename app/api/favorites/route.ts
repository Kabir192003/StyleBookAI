// item_id references the static data/ library's own id, not a DB row —
// colors/fonts/themes aren't stored in the database.
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { FavoriteItemSchema } from "@/lib/validation/favorite";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("favorites")
    .select("item_type, item_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list favorites:", error);
    return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 });
  }

  return NextResponse.json({
    favorites: (data ?? []).map((f) => ({ itemType: f.item_type, itemId: f.item_id })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = FavoriteItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid favorite" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("favorites").upsert(
    {
      user_id: user.id,
      item_type: parsed.data.itemType,
      item_id: parsed.data.itemId,
    },
    { onConflict: "user_id,item_type,item_id", ignoreDuplicates: true }
  );

  if (error) {
    console.error("Failed to add favorite:", error);
    return NextResponse.json({ error: "Failed to save favorite" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = FavoriteItemSchema.safeParse({
    itemType: searchParams.get("itemType"),
    itemId: searchParams.get("itemId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid favorite" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("item_type", parsed.data.itemType)
    .eq("item_id", parsed.data.itemId);

  if (error) {
    console.error("Failed to remove favorite:", error);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
