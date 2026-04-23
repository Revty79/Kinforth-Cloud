import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { FamilyFilesHub } from "@/components/dashboard/family-files-hub";
import { db } from "@/db";
import { familyContact, familyFile } from "@/db/schema";
import type { FamilyContactItem } from "@/lib/family-contacts";
import type { FamilyFileItem } from "@/lib/family-files";
import { requireSession } from "@/lib/auth-session";

export default async function FilesPage() {
  await requireSession("/login?next=/files");

  const [fileRows, contactRows] = await Promise.all([
    db
      .select({
        id: familyFile.id,
        title: familyFile.title,
        originalName: familyFile.originalName,
        fileUrl: familyFile.fileUrl,
        mimeType: familyFile.mimeType,
        sizeBytes: familyFile.sizeBytes,
        category: familyFile.category,
        createdAt: familyFile.createdAt,
      })
      .from(familyFile)
      .orderBy(desc(familyFile.createdAt)),
    db
      .select({
        id: familyContact.id,
        fullName: familyContact.fullName,
        relation: familyContact.relation,
        phone: familyContact.phone,
        secondaryPhone: familyContact.secondaryPhone,
        email: familyContact.email,
        notes: familyContact.notes,
        createdAt: familyContact.createdAt,
      })
      .from(familyContact)
      .orderBy(asc(familyContact.fullName), asc(familyContact.createdAt)),
  ]);

  const initialFiles: FamilyFileItem[] = fileRows.map((file) => ({
    id: file.id,
    title: file.title,
    originalName: file.originalName,
    fileUrl: file.fileUrl,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    category: file.category as FamilyFileItem["category"],
    createdAt: file.createdAt.toISOString(),
  }));

  const initialContacts: FamilyContactItem[] = contactRows.map((contact) => ({
    id: contact.id,
    fullName: contact.fullName,
    relation: contact.relation ?? undefined,
    phone: contact.phone,
    secondaryPhone: contact.secondaryPhone ?? undefined,
    email: contact.email ?? undefined,
    notes: contact.notes ?? undefined,
    createdAt: contact.createdAt.toISOString(),
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#4e5f56]">
        <Link
          href="/dashboard"
          className="rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 transition hover:border-[#bfab8f] hover:text-[#31433a]"
        >
          Dashboard
        </Link>
        <span>/</span>
        <span>Family files</span>
      </div>

      <FamilyFilesHub
        initialFiles={initialFiles}
        initialContacts={initialContacts}
      />
    </section>
  );
}
