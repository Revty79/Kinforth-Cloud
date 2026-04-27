import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyUserAccessProfile, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  buildAuthEmailForAccount,
  getUserContactLabel,
  isLikelyEmailIdentifier,
  isValidAuthUsername,
  normalizeAuthUsername,
  normalizeOptionalAuthEmail,
} from "@/lib/auth-identifiers";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { getSession } from "@/lib/auth-session";
import {
  canManageFamilyAccess,
  isFamilyRole,
  type FamilyRole,
} from "@/lib/user-access-client";
import {
  ensureUserAccessProfile,
  getUserRole,
  listAdminUserAccessItems,
} from "@/lib/user-access";

type CreateManagedUserBody = {
  name?: unknown;
  username?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
};

function toOptionalTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized;
}

function parseNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await getUserRole(session.user.id);
  if (!canManageFamilyAccess(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await listAdminUserAccessItems();

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorRole = await getUserRole(session.user.id);
  if (!canManageFamilyAccess(actorRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: CreateManagedUserBody;
  try {
    payload = (await request.json()) as CreateManagedUserBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = toOptionalTrimmedString(payload.name);
  if (!name || name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Name must be 2-80 characters." },
      { status: 400 },
    );
  }

  const rawUsername = toOptionalTrimmedString(payload.username);
  if (!rawUsername) {
    return NextResponse.json(
      { error: "Username is required." },
      { status: 400 },
    );
  }

  const username = normalizeAuthUsername(rawUsername);
  if (!isValidAuthUsername(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-30 characters and use letters, numbers, periods, or underscores.",
      },
      { status: 400 },
    );
  }

  const password =
    typeof payload.password === "string" ? payload.password : "";
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const optionalEmail = normalizeOptionalAuthEmail(
    typeof payload.email === "string" ? payload.email : "",
  );

  if (optionalEmail && !isLikelyEmailIdentifier(optionalEmail)) {
    return NextResponse.json(
      { error: "Email format looks invalid." },
      { status: 400 },
    );
  }

  if (
    typeof payload.role !== "undefined" &&
    (typeof payload.role !== "string" || !isFamilyRole(payload.role))
  ) {
    return NextResponse.json({ error: "Role is invalid." }, { status: 400 });
  }

  const desiredRole: FamilyRole =
    typeof payload.role === "string" ? payload.role : "family_member";

  if (actorRole !== "admin" && desiredRole === "admin") {
    return NextResponse.json(
      { error: "Only admins can assign the admin role." },
      { status: 403 },
    );
  }

  let email: string;
  try {
    email = buildAuthEmailForAccount({
      username,
      email: optionalEmail,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getAuthErrorMessage(error, "Could not prepare account email.") },
      { status: 400 },
    );
  }

  let createdUserId: string | null = null;

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name,
        username,
        email,
        password,
      },
    });

    const userPayload =
      result && typeof result === "object" && "user" in result
        ? result.user
        : null;

    if (
      userPayload &&
      typeof userPayload === "object" &&
      "id" in userPayload &&
      typeof userPayload.id === "string"
    ) {
      createdUserId = userPayload.id;
    }
  } catch (error) {
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 400;

    return NextResponse.json(
      {
        error: getAuthErrorMessage(
          error,
          "Could not create that account. Check email and username uniqueness.",
        ),
      },
      { status },
    );
  }

  if (!createdUserId) {
    return NextResponse.json(
      { error: "Account was created, but user data was missing." },
      { status: 500 },
    );
  }

  await ensureUserAccessProfile(createdUserId);

  if (desiredRole !== "family_member") {
    await db
      .update(familyUserAccessProfile)
      .set({
        role: desiredRole,
      })
      .where(eq(familyUserAccessProfile.userId, createdUserId));
  }

  const [created] = await db
    .select({
      userId: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: familyUserAccessProfile.role,
      privateStorageLimitBytes: familyUserAccessProfile.privateStorageLimitBytes,
    })
    .from(user)
    .innerJoin(
      familyUserAccessProfile,
      eq(familyUserAccessProfile.userId, user.id),
    )
    .where(eq(user.id, createdUserId))
    .limit(1);

  if (!created || !isFamilyRole(created.role)) {
    return NextResponse.json(
      { error: "Could not load newly-created account." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    user: {
      userId: created.userId,
      name: created.name,
      username: normalizeAuthUsername(created.username ?? ""),
      email: getUserContactLabel({
        email: created.email,
        username: created.username,
      }),
      role: created.role,
      privateStorageLimitBytes: parseNumericValue(created.privateStorageLimitBytes),
    },
  });
}
