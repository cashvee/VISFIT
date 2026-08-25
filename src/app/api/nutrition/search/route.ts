import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchUsdaFoods } from "@/lib/usda";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ results: [], source: "USDA FoodData Central" });
  }

  const results = await searchUsdaFoods(q);
  return NextResponse.json({ results, source: "USDA FoodData Central" });
}
