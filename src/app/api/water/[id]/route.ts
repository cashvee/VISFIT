import { auth } from "@/auth";
import { db } from "@/db/client";
import { waterLogs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
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
    .delete(waterLogs)
    .where(and(eq(waterLogs.id, id), eq(waterLogs.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}
