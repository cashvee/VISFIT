import { auth } from "@/auth";
import { db } from "@/db/client";
import { weightLogs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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
    .from(weightLogs)
    .where(eq(weightLogs.userId, session.user.id))
    .orderBy(desc(weightLogs.loggedAt))
    .limit(200);
  return NextResponse.json({ rows });
}

const PostBody = z.object({
  weightKg: z.number().min(20).max(400),
  loggedAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = PostBody.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const [row] = await db
    .insert(weightLogs)
    .values({
      userId: session.user.id,
      weightKg: body.data.weightKg,
      loggedAt: body.data.loggedAt ? new Date(body.data.loggedAt) : new Date(),
    })
    .returning();

  // Sync users.weightKg to latest entry
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

  return NextResponse.json({ row });
}
