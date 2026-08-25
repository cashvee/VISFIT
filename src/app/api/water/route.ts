import { auth } from "@/auth";
import { db } from "@/db/client";
import { waterLogs, users } from "@/db/schema";
import { and, eq, gte, lt, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfLocalDay, endOfLocalDay } from "@/lib/utils";

export const runtime = "nodejs";

async function getDailyTotal(userId: string, date: Date) {
  const from = startOfLocalDay(date).getTime();
  const to = endOfLocalDay(date).getTime();
  const rows = await db
    .select()
    .from(waterLogs)
    .where(
      and(
        eq(waterLogs.userId, userId),
        gte(waterLogs.loggedAt, new Date(from)),
        lt(waterLogs.loggedAt, new Date(to)),
      ),
    )
    .orderBy(desc(waterLogs.loggedAt));

  const totalMl = rows.reduce((s, r) => s + r.amountMl, 0);
  return { totalMl, rows };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date");
  const date = dateStr ? new Date(dateStr + "T00:00:00") : new Date();

  const { totalMl, rows } = await getDailyTotal(session.user.id, date);

  const u = await db
    .select({ waterTargetMl: users.waterTargetMl })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const targetMl = u[0]?.waterTargetMl ?? 2500;

  return NextResponse.json({ totalMl, targetMl, rows });
}

const PostBody = z.object({
  amountMl: z.number().int().min(1).max(5000),
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
    .insert(waterLogs)
    .values({ userId: session.user.id, amountMl: body.data.amountMl })
    .returning();

  const { totalMl } = await getDailyTotal(session.user.id, new Date());
  return NextResponse.json({ row, totalMl });
}
