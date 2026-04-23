import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { familyUserAccessProfile, user } from "@/db/schema";
import {
  defaultPrivateStorageLimitBytes,
  isFamilyRole as isFamilyRoleValue,
  type AdminUserAccessItem,
  type FamilyRole,
  type FamilyUserAccessProfileItem,
} from "./user-access-client";

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

function normalizeRole(value: string): FamilyRole {
  if (isFamilyRoleValue(value)) {
    return value;
  }

  return "family_member";
}

export function isFamilyRole(value: string): value is FamilyRole {
  return isFamilyRoleValue(value);
}

export async function countAdmins() {
  const [row] = await db
    .select({ value: count() })
    .from(familyUserAccessProfile)
    .where(eq(familyUserAccessProfile.role, "admin"));

  return parseNumericValue(row?.value);
}

export async function ensureUserAccessProfile(
  userId: string,
): Promise<FamilyUserAccessProfileItem> {
  const [existing] = await db
    .select({
      userId: familyUserAccessProfile.userId,
      role: familyUserAccessProfile.role,
      privateStorageLimitBytes: familyUserAccessProfile.privateStorageLimitBytes,
    })
    .from(familyUserAccessProfile)
    .where(eq(familyUserAccessProfile.userId, userId))
    .limit(1);

  if (existing) {
    return {
      userId: existing.userId,
      role: normalizeRole(existing.role),
      privateStorageLimitBytes:
        parseNumericValue(existing.privateStorageLimitBytes) ||
        defaultPrivateStorageLimitBytes,
    };
  }

  const adminTotal = await countAdmins();
  const role: FamilyRole = adminTotal === 0 ? "admin" : "family_member";

  try {
    const [created] = await db
      .insert(familyUserAccessProfile)
      .values({
        userId,
        role,
        privateStorageLimitBytes: defaultPrivateStorageLimitBytes,
      })
      .returning({
        userId: familyUserAccessProfile.userId,
        role: familyUserAccessProfile.role,
        privateStorageLimitBytes: familyUserAccessProfile.privateStorageLimitBytes,
      });

    return {
      userId: created.userId,
      role: normalizeRole(created.role),
      privateStorageLimitBytes:
        parseNumericValue(created.privateStorageLimitBytes) ||
        defaultPrivateStorageLimitBytes,
    };
  } catch {
    const [afterRace] = await db
      .select({
        userId: familyUserAccessProfile.userId,
        role: familyUserAccessProfile.role,
        privateStorageLimitBytes: familyUserAccessProfile.privateStorageLimitBytes,
      })
      .from(familyUserAccessProfile)
      .where(eq(familyUserAccessProfile.userId, userId))
      .limit(1);

    if (!afterRace) {
      throw new Error("Could not create user access profile.");
    }

    return {
      userId: afterRace.userId,
      role: normalizeRole(afterRace.role),
      privateStorageLimitBytes:
        parseNumericValue(afterRace.privateStorageLimitBytes) ||
        defaultPrivateStorageLimitBytes,
    };
  }
}

export async function getUserRole(userId: string): Promise<FamilyRole> {
  const profile = await ensureUserAccessProfile(userId);
  return profile.role;
}

export async function getUserPrivateStorageLimitBytes(userId: string) {
  const profile = await ensureUserAccessProfile(userId);
  return profile.privateStorageLimitBytes;
}

export async function listAdminUserAccessItems(): Promise<AdminUserAccessItem[]> {
  const userRows = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .orderBy(asc(user.name), asc(user.email));

  await Promise.all(
    userRows.map((row) => ensureUserAccessProfile(row.userId)),
  );

  const rows = await db
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
      eq(familyUserAccessProfile.userId, user.id),
    )
    .orderBy(asc(user.name), asc(user.email));

  return rows.map((row) => ({
    userId: row.userId,
    name: row.name,
    email: row.email,
    role: normalizeRole(row.role),
    privateStorageLimitBytes:
      parseNumericValue(row.privateStorageLimitBytes) ||
      defaultPrivateStorageLimitBytes,
  }));
}
