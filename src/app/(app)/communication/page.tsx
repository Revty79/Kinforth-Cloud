import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { FamilyCommunicationCenter } from "@/components/dashboard/family-communication-center";
import { db } from "@/db";
import { familyBillboardPost, familyChatMessage } from "@/db/schema";
import type {
  FamilyBillboardPostItem,
  FamilyChatMessageItem,
} from "@/lib/family-communication";
import { requireSession } from "@/lib/auth-session";

export default async function CommunicationPage() {
  const session = await requireSession("/login?next=/communication");

  const [billboardRows, chatRows] = await Promise.all([
    db
      .select({
        id: familyBillboardPost.id,
        title: familyBillboardPost.title,
        message: familyBillboardPost.message,
        createdByName: familyBillboardPost.createdByName,
        createdByUserId: familyBillboardPost.createdByUserId,
        createdAt: familyBillboardPost.createdAt,
      })
      .from(familyBillboardPost)
      .orderBy(desc(familyBillboardPost.createdAt)),
    db
      .select({
        id: familyChatMessage.id,
        message: familyChatMessage.message,
        sentByName: familyChatMessage.sentByName,
        sentByUserId: familyChatMessage.sentByUserId,
        createdAt: familyChatMessage.createdAt,
      })
      .from(familyChatMessage)
      .orderBy(asc(familyChatMessage.createdAt)),
  ]);

  const initialBillboardPosts: FamilyBillboardPostItem[] = billboardRows.map(
    (post) => ({
      id: post.id,
      title: post.title,
      message: post.message,
      createdByName: post.createdByName,
      createdByUserId: post.createdByUserId,
      createdAt: post.createdAt.toISOString(),
    }),
  );

  const initialChatMessages: FamilyChatMessageItem[] = chatRows.map(
    (message) => ({
      id: message.id,
      message: message.message,
      sentByName: message.sentByName,
      sentByUserId: message.sentByUserId,
      createdAt: message.createdAt.toISOString(),
    }),
  );

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
        <span>Communication center</span>
      </div>

      <FamilyCommunicationCenter
        initialBillboardPosts={initialBillboardPosts}
        initialChatMessages={initialChatMessages}
        currentUserId={session.user.id}
      />
    </section>
  );
}
