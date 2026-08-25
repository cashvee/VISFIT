import { auth } from "@/auth";
import { db } from "@/db/client";
import { workoutSessions, workoutEntries, exercises } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const rows = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, session.user.id)))
    .limit(1);
  const s = rows[0];
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await db
    .select({
      entry: workoutEntries,
      exercise: exercises,
    })
    .from(workoutEntries)
    .leftJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
    .where(eq(workoutEntries.sessionId, id))
    .orderBy(workoutEntries.orderIdx);

  return NextResponse.json({ session: s, entries });
}

const PatchBody = z.object({
  endedAt: z.string().datetime().optional(),
  totalDurationSec: z.number().int().min(0).optional(),
  notes: z.string().nullable().optional(),
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
  const patch: Record<string, unknown> = { ...body.data };
  if (body.data.endedAt) patch.endedAt = new Date(body.data.endedAt);

  await db
    .update(workoutSessions)
    .set(patch)
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, session.user.id)));

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
  await db
    .delete(workoutSessions)
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}
