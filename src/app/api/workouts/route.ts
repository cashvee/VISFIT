import { auth } from "@/auth";
import { db } from "@/db/client";
import { workoutSessions, workoutEntries } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const EntrySchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(200).nullable().optional(),
  weightKg: z.number().min(0).nullable().optional(),
  durationSec: z.number().int().min(1).nullable().optional(),
});

const PostBody = z.object({
  entries: z.array(EntrySchema).min(1).max(20),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = PostBody.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body", details: body.error.format() }, { status: 400 });
  }

  const [ws] = await db
    .insert(workoutSessions)
    .values({ userId: session.user.id, startedAt: new Date() })
    .returning();

  await db.insert(workoutEntries).values(
    body.data.entries.map((e, i) => ({
      sessionId: ws.id,
      exerciseId: e.exerciseId,
      sets: e.sets,
      reps: e.reps ?? null,
      weightKg: e.weightKg ?? null,
      durationSec: e.durationSec ?? null,
      orderIdx: i,
    })),
  );

  return NextResponse.json({ session: ws }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, session.user.id))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(50);
  return NextResponse.json({ sessions: rows });
}
