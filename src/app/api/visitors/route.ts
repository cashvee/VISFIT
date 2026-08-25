import { incrementVisitorCount } from "@/db/queries";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const count = await incrementVisitorCount();
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } },
  );
}