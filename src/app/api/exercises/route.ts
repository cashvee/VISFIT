import { auth } from "@/auth";
import { db } from "@/db/client";
import { exercises } from "@/db/schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db.select().from(exercises).orderBy(exercises.category, exercises.nameEn);
  return NextResponse.json({ exercises: rows });
}
