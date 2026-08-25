import { auth } from "@/auth";
import { deleteMeal, getMealItems } from "@/db/queries";
import { db } from "@/db/client";
import { meals } from "@/db/schema";
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
    .from(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, session.user.id)))
    .limit(1);
  const meal = rows[0];
  if (!meal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = await getMealItems(id);
  return NextResponse.json({ meal, items });
}

const PatchBody = z.object({
  rawText: z.string().min(2).max(2000).optional(),
  eatenAt: z.string().datetime().optional(),
  totalCalories: z.number().min(0).optional(),
  proteinG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
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
    return NextResponse.json({ error: "Invalid body", details: body.error.format() }, { status: 400 });
  }
  const patch: Record<string, unknown> = { ...body.data };
  if (body.data.eatenAt) patch.eatenAt = new Date(body.data.eatenAt);

  await db
    .update(meals)
    .set(patch)
    .where(and(eq(meals.id, id), eq(meals.userId, session.user.id)));

  const updated = await db
    .select()
    .from(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, session.user.id)))
    .limit(1);

  if (!updated[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ meal: updated[0] });
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
  await deleteMeal(session.user.id, id);
  return NextResponse.json({ ok: true });
}
