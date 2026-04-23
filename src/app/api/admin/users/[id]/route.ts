import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyUserAccessProfile, user } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import {
  countAdmins,
  ensureUserAccessProfile,
  getUserRole,
  isFamilyRole,
} from "@/lib/user-access";
import {
  maxPrivateStorageLimitBytes,
  minPrivateStorageLimitBytes,
} from "@/lib/user-access-client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateUserAccessBody = {
  role?: unknown;
  privateStorageLimitBytes?: unknown;
};

function parseStorageLimitBytes(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed);
    }
  }

  return null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorRole = await getUserRole(session.user.id);
  if (actorRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: UpdateUserAccessBody;
  try {
    payload = (await request.json()) as UpdateUserAccessBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const params = await context.params;
  const targetUserId = params.id;

  const [targetUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1);

  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const currentProfile = await ensureUserAccessProfile(targetUserId);

  const nextRole =
    typeof payload.role === "string" && isFamilyRole(payload.role)
      ? payload.role
      : currentProfile.role;

  if (
    typeof payload.role !== "undefined" &&
    (typeof payload.role !== "string" || !isFamilyRole(payload.role))
  ) {
    return NextResponse.json({ error: "Role is invalid." }, { status: 400 });
  }

  const nextStorageLimitBytes =
    typeof payload.privateStorageLimitBytes !== "undefined"
      ? parseStorageLimitBytes(payload.privateStorageLimitBytes)
      : currentProfile.privateStorageLimitBytes;

  if (nextStorageLimitBytes === null) {
    return NextResponse.json(
      { error: "Storage limit must be a number of bytes." },
      { status: 400 },
    );
  }

  if (
    nextStorageLimitBytes < minPrivateStorageLimitBytes ||
    nextStorageLimitBytes > maxPrivateStorageLimitBytes
  ) {
    return NextResponse.json(
      {
        error: `Storage limit must be between ${minPrivateStorageLimitBytes} and ${maxPrivateStorageLimitBytes} bytes.`,
      },
      { status: 400 },
    );
  }

  if (currentProfile.role === "admin" && nextRole !== "admin") {
    const adminTotal = await countAdmins();
    if (adminTotal <= 1) {
      return NextResponse.json(
        { error: "At least one admin is required." },
        { status: 400 },
      );
    }
  }

  await db
    .update(familyUserAccessProfile)
    .set({
      role: nextRole,
      privateStorageLimitBytes: nextStorageLimitBytes,
    })
    .where(eq(familyUserAccessProfile.userId, targetUserId));

  const [updated] = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: familyUserAccessProfile.role,
      privateStorageLimitBytes: familyUserAccessProfile.privateStorageLimitBytes,
    })
    .from(user)
    .innerJoin(
      familyUserAccessProfile,
      and(
        eq(familyUserAccessProfile.userId, user.id),
        eq(user.id, targetUserId),
      ),
    )
    .limit(1);

  if (!updated || !isFamilyRole(updated.role)) {
    return NextResponse.json(
      { error: "Could not load updated user access." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    user: {
      userId: updated.userId,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      privateStorageLimitBytes: Number(updated.privateStorageLimitBytes),
    },
  });
}
