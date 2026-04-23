import { and, asc, eq, ne, or } from "drizzle-orm";
import Link from "next/link";
import { PrivateCloudChatCenter } from "@/components/dashboard/private-cloud-chat-center";
import { db } from "@/db";
import { privateCloudChatMessage, user } from "@/db/schema";
import type {
  PrivateCloudChatMessageItem,
  PrivateCloudChatParticipant,
} from "@/lib/private-cloud";
import { requireSession } from "@/lib/auth-session";

export default async function PrivateCloudChatPage() {
  const session = await requireSession("/login?next=/private-cloud/chat");

  const participantRows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(ne(user.id, session.user.id))
    .orderBy(asc(user.name), asc(user.email));

  const participants: PrivateCloudChatParticipant[] = participantRows.map(
    (participant) => ({
      id: participant.id,
      name: participant.name,
      email: participant.email,
    }),
  );

  const initialRecipientUserId = participants[0]?.id ?? null;

  const chatRows = initialRecipientUserId
    ? await db
        .select({
          id: privateCloudChatMessage.id,
          message: privateCloudChatMessage.message,
          sentByName: privateCloudChatMessage.sentByName,
          sentByUserId: privateCloudChatMessage.sentByUserId,
          recipientUserId: privateCloudChatMessage.recipientUserId,
          createdAt: privateCloudChatMessage.createdAt,
        })
        .from(privateCloudChatMessage)
        .where(
          or(
            and(
              eq(privateCloudChatMessage.sentByUserId, session.user.id),
              eq(privateCloudChatMessage.recipientUserId, initialRecipientUserId),
            ),
            and(
              eq(privateCloudChatMessage.sentByUserId, initialRecipientUserId),
              eq(privateCloudChatMessage.recipientUserId, session.user.id),
            ),
          ),
        )
        .orderBy(asc(privateCloudChatMessage.createdAt))
    : [];

  const initialChatMessages: PrivateCloudChatMessageItem[] = chatRows.map(
    (message) => ({
      id: message.id,
      message: message.message,
      sentByName: message.sentByName,
      sentByUserId: message.sentByUserId,
      recipientUserId: message.recipientUserId,
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
        <Link
          href="/private-cloud"
          className="rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 transition hover:border-[#bfab8f] hover:text-[#31433a]"
        >
          Private cloud
        </Link>
        <span>/</span>
        <span>Private chat</span>
      </div>

      <PrivateCloudChatCenter
        initialMessages={initialChatMessages}
        participants={participants}
        initialRecipientUserId={initialRecipientUserId}
        currentUserId={session.user.id}
      />
    </section>
  );
}
