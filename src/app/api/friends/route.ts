import { auth } from "@/auth";
import { db } from "@/db/client";
import { friendships, users } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Accepted friends (both directions)
  const acceptedRaw = await db
    .select({
      friendship: friendships,
      requester: {
        id: users.id,
        username: users.username,
        name: users.name,
        image: users.image,
      },
    })
    .from(friendships)
    .leftJoin(users, eq(friendships.requesterId, users.id))
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
      ),
    );

  // Need to also fetch the addressee user info to know the "other"
  const friends = await Promise.all(
    acceptedRaw.map(async (r) => {
      const otherId =
        r.friendship.requesterId === userId
          ? r.friendship.addresseeId
          : r.friendship.requesterId;
      const otherRows = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          image: users.image,
        })
        .from(users)
        .where(eq(users.id, otherId))
        .limit(1);
      return {
        friendshipId: r.friendship.id,
        user: otherRows[0],
        since: r.friendship.updatedAt,
      };
    }),
  );

  // Incoming requests (addressee = me, status = pending)
  const incomingRaw = await db
    .select({
      friendship: friendships,
      user: {
        id: users.id,
        username: users.username,
        name: users.name,
        image: users.image,
      },
    })
    .from(friendships)
    .leftJoin(users, eq(friendships.requesterId, users.id))
    .where(
      and(eq(friendships.status, "pending"), eq(friendships.addresseeId, userId)),
    );

  // Outgoing requests (requester = me, status = pending)
  const outgoingRaw = await db
    .select({
      friendship: friendships,
      user: {
        id: users.id,
        username: users.username,
        name: users.name,
        image: users.image,
      },
    })
    .from(friendships)
    .leftJoin(users, eq(friendships.addresseeId, users.id))
    .where(
      and(eq(friendships.status, "pending"), eq(friendships.requesterId, userId)),
    );

  return NextResponse.json({
    friends,
    incoming: incomingRaw.map((r) => ({
      friendshipId: r.friendship.id,
      user: r.user,
    })),
    outgoing: outgoingRaw.map((r) => ({
      friendshipId: r.friendship.id,
      user: r.user,
    })),
  });
}

const PostBody = z.object({
  username: z.string().min(3).max(20),
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
  const username = body.data.username.toLowerCase();

  const target = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (!target[0]) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target[0].id === session.user.id) {
    return NextResponse.json({ error: "You can't send a request to yourself" }, { status: 400 });
  }

  // Check existing friendship in any direction
  const existing = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(
          eq(friendships.requesterId, session.user.id),
          eq(friendships.addresseeId, target[0].id),
        ),
        and(
          eq(friendships.requesterId, target[0].id),
          eq(friendships.addresseeId, session.user.id),
        ),
      ),
    )
    .limit(1);

  if (existing[0]) {
    if (existing[0].status === "accepted") {
      return NextResponse.json({ error: "You're already friends" }, { status: 400 });
    }
    if (existing[0].status === "pending") {
      return NextResponse.json({ error: "A pending request already exists" }, { status: 400 });
    }
  }

  const [row] = await db
    .insert(friendships)
    .values({
      requesterId: session.user.id,
      addresseeId: target[0].id,
      status: "pending",
    })
    .returning();

  return NextResponse.json({ friendship: row }, { status: 201 });
}
