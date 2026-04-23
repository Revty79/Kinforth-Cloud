import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PrivateCloudFilesHub } from "@/components/dashboard/private-cloud-files-hub";
import { db } from "@/db";
import { privateCloudFile } from "@/db/schema";
import type { PrivateCloudFileItem } from "@/lib/private-cloud";
import { requireSession } from "@/lib/auth-session";
import { getUserPrivateStorageLimitBytes } from "@/lib/user-access";

export default async function PrivateCloudFilesPage() {
  const session = await requireSession("/login?next=/private-cloud/files");
  const storageLimitBytes = await getUserPrivateStorageLimitBytes(session.user.id);

  const fileRows = await db
    .select({
      id: privateCloudFile.id,
      title: privateCloudFile.title,
      originalName: privateCloudFile.originalName,
      fileUrl: privateCloudFile.fileUrl,
      mimeType: privateCloudFile.mimeType,
      sizeBytes: privateCloudFile.sizeBytes,
      category: privateCloudFile.category,
      createdAt: privateCloudFile.createdAt,
    })
    .from(privateCloudFile)
    .where(eq(privateCloudFile.ownerUserId, session.user.id))
    .orderBy(desc(privateCloudFile.createdAt));

  const initialFiles: PrivateCloudFileItem[] = fileRows.map((file) => ({
    id: file.id,
    title: file.title,
    originalName: file.originalName,
    fileUrl: file.fileUrl,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    category: file.category as PrivateCloudFileItem["category"],
    createdAt: file.createdAt.toISOString(),
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
        <Link
          href="/private-cloud"
          className="rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 transition hover:border-[#bfab8f] hover:text-[#31433a]"
        >
          Private cloud
        </Link>
        <span>/</span>
        <span>Private files</span>
      </div>

      <PrivateCloudFilesHub
        initialFiles={initialFiles}
        storageLimitBytes={storageLimitBytes}
      />
    </section>
  );
}
