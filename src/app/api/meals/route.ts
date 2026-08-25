import { auth } from "@/auth";
import { createMealWithItems, getMealItems, getMealsBetween } from "@/db/queries";
import { startOfLocalDay, endOfLocalDay } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const MealItemInput = z.object({
  name: z.string().min(1).max(120),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  calories: z.number().min(0).default(0),
  proteinG: z.number().min(0).default(0),
  carbsG: z.number().min(0).default(0),
  fatG: z.number().min(0).default(0),
  externalFoodId: z.string().nullable().optional(),
});

const PostBody = z.object({
  rawText: z.string().min(2).max(2000),
  eatenAt: z.string().datetime(),
  items: z.array(MealItemInput).default([]),
  totalCalories: z.number().min(0).default(0),
  proteinG: z.number().min(0).default(0),
  carbsG: z.number().min(0).default(0),
  fatG: z.number().min(0).default(0),
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

  const created = await createMealWithItems(
    {
      userId: session.user.id,
      eatenAt: new Date(body.data.eatenAt),
      rawText: body.data.rawText,
      totalCalories: body.data.totalCalories,
      proteinG: body.data.proteinG,
      carbsG: body.data.carbsG,
      fatG: body.data.fatG,
    },
    body.data.items.map((it) => ({
      name: it.name,
      quantity: it.quantity ?? null,
      unit: it.unit ?? null,
      calories: it.calories,
      proteinG: it.proteinG,
      carbsG: it.carbsG,
      fatG: it.fatG,
      externalFoodId: it.externalFoodId ?? null,
    })),
  );

  const items = await getMealItems(created.id);
  return NextResponse.json({ meal: created, items }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date"); // YYYY-MM-DD (local)
  const date = dateStr ? new Date(dateStr + "T00:00:00") : new Date();

  const from = startOfLocalDay(date).getTime();
  const to = endOfLocalDay(date).getTime();

  const meals = await getMealsBetween(session.user.id, from, to);
  return NextResponse.json({ meals });
}

export const runtime = "nodejs";
