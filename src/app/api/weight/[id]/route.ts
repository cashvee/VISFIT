import { auth } from "@/auth";
import { db } from "@/db/client";
import { weightLogs, users } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db
    .delete(weightLogs)
    .where(and(eq(weightLogs.id, id), eq(weightLogs.userId, session.user.id)));

  // Re-sync users.weightKg to latest remaining
  const latest = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, session.user.id))
    .orderBy(desc(weightLogs.loggedAt))
    .limit(1);
  if (latest[0]) {
    await db
      .update(users)
      .set({ weightKg: latest[0].weightKg, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));
  }
  return NextResponse.json({ ok: true });
}
