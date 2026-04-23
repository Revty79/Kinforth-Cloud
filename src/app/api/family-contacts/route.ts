import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyContact } from "@/db/schema";
import {
  isLikelyEmail,
  isLikelyPhoneNumber,
  type FamilyContactItem,
} from "@/lib/family-contacts";
import { getSession } from "@/lib/auth-session";

type CreateFamilyContactBody = {
  fullName?: unknown;
  relation?: unknown;
  phone?: unknown;
  secondaryPhone?: unknown;
  email?: unknown;
  notes?: unknown;
};

function cleanOptionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function toFamilyContactItem(
  row: typeof familyContact.$inferSelect,
): FamilyContactItem {
  return {
    id: row.id,
    fullName: row.fullName,
    relation: row.relation ?? undefined,
    phone: row.phone,
    secondaryPhone: row.secondaryPhone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(familyContact)
    .orderBy(asc(familyContact.fullName), asc(familyContact.createdAt));

  return NextResponse.json({
    contacts: rows.map(toFamilyContactItem),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateFamilyContactBody;
  try {
    payload = (await request.json()) as CreateFamilyContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = cleanOptionalString(payload.fullName, 100);
  const relation = cleanOptionalString(payload.relation, 80);
  const phone = cleanOptionalString(payload.phone, 40);
  const secondaryPhone = cleanOptionalString(payload.secondaryPhone, 40);
  const email = cleanOptionalString(payload.email, 120);
  const notes = cleanOptionalString(payload.notes, 500);

  if (!fullName) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!phone) {
    return NextResponse.json(
      { error: "Primary phone number is required." },
      { status: 400 },
    );
  }

  if (!isLikelyPhoneNumber(phone)) {
    return NextResponse.json(
      { error: "Primary phone format looks invalid." },
      { status: 400 },
    );
  }

  if (secondaryPhone && !isLikelyPhoneNumber(secondaryPhone)) {
    return NextResponse.json(
      { error: "Secondary phone format looks invalid." },
      { status: 400 },
    );
  }

  if (email && !isLikelyEmail(email)) {
    return NextResponse.json(
      { error: "Email format looks invalid." },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(familyContact)
    .values({
      id: crypto.randomUUID(),
      createdByUserId: session.user.id,
      fullName,
      relation,
      phone,
      secondaryPhone,
      email,
      notes,
    })
    .returning();

  return NextResponse.json({
    contact: toFamilyContactItem(created),
  });
}
