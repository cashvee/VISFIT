import { auth } from "@/auth";
import { createActivity, getActivities } from "@/db/queries";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await getActivities(session.user.id);
  return NextResponse.json({ rows });
}

const PostBody = z.object({
  type: z.enum(["running", "cycling", "walking", "other"]),
  distanceKm: z.number().min(0).max(1000),
  durationSec: z.number().int().min(0).max(24 * 60 * 60),
  startedAt: z.string().datetime().optional(),
  routeData: z.string().max(100000).nullable().optional(),
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

  const paceSecPerKm =
    body.data.distanceKm > 0 ? Math.round(body.data.durationSec / body.data.distanceKm) : null;

  const row = await createActivity({
    userId: session.user.id,
    type: body.data.type,
    distanceKm: body.data.distanceKm,
    durationSec: body.data.durationSec,
    paceSecPerKm,
    startedAt: body.data.startedAt ? new Date(body.data.startedAt) : new Date(),
    routeData: body.data.routeData ?? null,
  });

  return NextResponse.json({ row }, { status: 201 });
}
