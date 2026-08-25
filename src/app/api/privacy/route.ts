import { auth } from "@/auth";
import { db } from "@/db/client";
import { friendPrivacy } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(friendPrivacy)
    .where(eq(friendPrivacy.userId, session.user.id))
    .limit(1);
  const p = rows[0] ?? {
    userId: session.user.id,
    shareWeeklySummary: true,
    shareWeight: false,
    shareMeals: false,
    shareWater: false,
  };
  return NextResponse.json({ privacy: p });
}

const PatchBody = z.object({
  shareWeeklySummary: z.boolean().optional(),
  shareWeight: z.boolean().optional(),
  shareMeals: z.boolean().optional(),
  shareWater: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await db
    .insert(friendPrivacy)
    .values({
      userId: session.user.id,
      shareWeeklySummary: body.data.shareWeeklySummary ?? true,
      shareWeight: body.data.shareWeight ?? false,
      shareMeals: body.data.shareMeals ?? false,
      shareWater: body.data.shareWater ?? false,
    })
    .onConflictDoUpdate({
      target: friendPrivacy.userId,
      set: body.data,
    });
  return NextResponse.json({ ok: true });
}
