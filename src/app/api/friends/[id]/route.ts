import { auth } from "@/auth";
import { db } from "@/db/client";
import { friendships } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const PatchBody = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Only the addressee can accept/reject
  const existing = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.id, id), eq(friendships.addresseeId, session.user.id)))
    .limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.data.status === "rejected") {
    await db.delete(friendships).where(eq(friendships.id, id));
    return NextResponse.json({ ok: true });
  }

  await db
    .update(friendships)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(friendships.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  // Either side can delete
  await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.id, id),
        or(
          eq(friendships.requesterId, session.user.id),
          eq(friendships.addresseeId, session.user.id),
        ),
      ),
    );
  return NextResponse.json({ ok: true });
}
