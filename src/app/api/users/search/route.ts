import { auth } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { like, and, ne, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      image: users.image,
    })
    .from(users)
    .where(
      and(
        isNotNull(users.username),
        like(users.username, `${q}%`),
        ne(users.id, session.user.id),
      ),
    )
    .limit(10);
  return NextResponse.json({ users: rows });
}
