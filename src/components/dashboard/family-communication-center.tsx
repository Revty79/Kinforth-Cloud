"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Clock3,
  Megaphone,
  MessageCircle,
  Pin,
  SendHorizontal,
  Trash2,
} from "lucide-react";
import type {
  FamilyBillboardPostItem,
  FamilyChatMessageItem,
} from "@/lib/family-communication";

type FamilyCommunicationCenterProps = {
  initialBillboardPosts: FamilyBillboardPostItem[];
  initialChatMessages: FamilyChatMessageItem[];
  currentUserId: string;
};

function parseApiError(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Something went wrong. Please try again.";
}

async function parseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function sortBillboardPosts(posts: FamilyBillboardPostItem[]) {
  return [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function sortChatMessages(messages: FamilyChatMessageItem[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function FamilyCommunicationCenter({
  initialBillboardPosts,
  initialChatMessages,
  currentUserId,
}: FamilyCommunicationCenterProps) {
  const [billboardPosts, setBillboardPosts] = useState<FamilyBillboardPostItem[]>(
    () => sortBillboardPosts(initialBillboardPosts),
  );
  const [chatMessages, setChatMessages] = useState<FamilyChatMessageItem[]>(() =>
    sortChatMessages(initialChatMessages),
  );
  const [billboardTitle, setBillboardTitle] = useState("");
  const [billboardMessage, setBillboardMessage] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [pendingPostDeleteId, setPendingPostDeleteId] = useState<string | null>(
    null,
  );
  const [pendingChatDeleteId, setPendingChatDeleteId] = useState<string | null>(
    null,
  );
  const [billboardError, setBillboardError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    [],
  );

  const handleCreatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBillboardError(null);
    setIsSavingPost(true);

    try {
      const response = await fetch("/api/family-communication/billboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: billboardTitle,
          message: billboardMessage,
        }),
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        setBillboardError(parseApiError(payload));
        return;
      }

      const post =
        payload &&
        typeof payload === "object" &&
        "post" in payload &&
        payload.post &&
        typeof payload.post === "object"
          ? (payload.post as FamilyBillboardPostItem)
          : null;

      if (!post || typeof post.id !== "string") {
        setBillboardError("Post was saved, but response data was invalid.");
        return;
      }

      setBillboardPosts((previous) => sortBillboardPosts([post, ...previous]));
      setBillboardTitle("");
      setBillboardMessage("");
    } catch {
      setBillboardError("Could not post to the billboard right now.");
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setBillboardError(null);
    setPendingPostDeleteId(postId);

    try {
      const response = await fetch(`/api/family-communication/billboard/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await parseJson(response);
        setBillboardError(parseApiError(payload));
        return;
      }

      setBillboardPosts((previous) => previous.filter((post) => post.id !== postId));
    } catch {
      setBillboardError("Could not remove this post right now.");
    } finally {
      setPendingPostDeleteId(null);
    }
  };

  const handleSendChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChatError(null);
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/family-communication/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatMessage,
        }),
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        setChatError(parseApiError(payload));
        return;
      }

      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        payload.message &&
        typeof payload.message === "object"
          ? (payload.message as FamilyChatMessageItem)
          : null;

      if (!message || typeof message.id !== "string") {
        setChatError("Message was sent, but response data was invalid.");
        return;
      }

      setChatMessages((previous) => sortChatMessages([...previous, message]));
      setChatMessage("");
    } catch {
      setChatError("Could not send this message right now.");
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleDeleteChat = async (messageId: string) => {
    setChatError(null);
    setPendingChatDeleteId(messageId);

    try {
      const response = await fetch(`/api/family-communication/chat/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await parseJson(response);
        setChatError(parseApiError(payload));
        return;
      }

      setChatMessages((previous) =>
        previous.filter((message) => message.id !== messageId),
      );
    } catch {
      setChatError("Could not remove this message right now.");
    } finally {
      setPendingChatDeleteId(null);
    }
  };

  return (
    <article className="fc-card rounded-xl border border-[#d6c8b2] p-5 sm:p-6">
      <div>
        <p className="fc-pill">
          <Megaphone className="h-4 w-4 text-sage" />
          Shared communication
        </p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-[#23362f]">
          Family communication center
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 fc-text-muted">
          Post household updates to the family billboard and keep the day-to-day
          conversation flowing in family chat.
        </p>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="space-y-4">
          <div className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4 sm:p-5">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4e5f56]">
              <Pin className="h-4 w-4 text-accent" />
              Family billboard
            </p>
            <form className="mt-3 space-y-2" onSubmit={handleCreatePost}>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                  Headline
                </span>
                <input
                  value={billboardTitle}
                  onChange={(event) => setBillboardTitle(event.target.value)}
                  placeholder="Weekend plans"
                  className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                  Message
                </span>
                <textarea
                  value={billboardMessage}
                  onChange={(event) => setBillboardMessage(event.target.value)}
                  placeholder="Everyone bring a lawn chair. Potluck starts at 5."
                  rows={3}
                  className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isSavingPost}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#a08062] bg-[#b86642] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#9d5737] disabled:opacity-70"
              >
                <Megaphone className="h-4 w-4" />
                {isSavingPost ? "Posting..." : "Post to billboard"}
              </button>
            </form>

            {billboardError ? (
              <p className="mt-2 text-xs font-semibold text-[#8f4325]">
                {billboardError}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5b6b63]">
              Recent billboard posts
            </p>

            {billboardPosts.length > 0 ? (
              <div className="mt-3 space-y-3">
                {billboardPosts.map((post) => {
                  const isPendingDelete = pendingPostDeleteId === post.id;

                  return (
                    <article
                      key={post.id}
                      className="rounded-lg border border-[#d6c5ac] bg-[#fff6e9] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#2f4138]">
                            {post.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#66766e]">
                            {post.createdByName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          disabled={isPendingDelete}
                          className="inline-flex items-center gap-1 rounded-md border border-[#d2b7a1] bg-[#fff3e8] px-2 py-1 text-[11px] font-semibold text-[#7a4730] transition hover:border-[#bf967a] hover:text-[#5f3422] disabled:opacity-70"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {isPendingDelete ? "Removing..." : "Remove"}
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#34473e]">
                        {post.message}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b726d]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {dateTimeFormatter.format(new Date(post.createdAt))}
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-[#d4c4ae] bg-[#fff8ef] px-3 py-2 text-sm fc-text-muted">
                No billboard posts yet. Share the first family update.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4e5f56]">
              <MessageCircle className="h-4 w-4 text-accent" />
              Family chat
            </p>
            <form className="mt-3 space-y-2" onSubmit={handleSendChat}>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                  Message
                </span>
                <textarea
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  placeholder="Dinner is ready in 20."
                  rows={2}
                  className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isSendingChat}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#a08062] bg-[#b86642] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#9d5737] disabled:opacity-70"
              >
                <SendHorizontal className="h-4 w-4" />
                {isSendingChat ? "Sending..." : "Send message"}
              </button>
            </form>

            {chatError ? (
              <p className="mt-2 text-xs font-semibold text-[#8f4325]">{chatError}</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5b6b63]">
              Chat thread
            </p>

            {chatMessages.length > 0 ? (
              <div className="mt-3 max-h-[38rem] space-y-2 overflow-y-auto pr-1">
                {chatMessages.map((message) => {
                  const isOwner = message.sentByUserId === currentUserId;
                  const isPendingDelete = pendingChatDeleteId === message.id;

                  return (
                    <article
                      key={message.id}
                      className="rounded-lg border border-[#d6c5ac] bg-[#fff6e9] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#66766e]">
                          {message.sentByName}
                        </p>
                        {isOwner ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteChat(message.id)}
                            disabled={isPendingDelete}
                            className="inline-flex items-center gap-1 rounded-md border border-[#d2b7a1] bg-[#fff3e8] px-2 py-1 text-[11px] font-semibold text-[#7a4730] transition hover:border-[#bf967a] hover:text-[#5f3422] disabled:opacity-70"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {isPendingDelete ? "..." : "Remove"}
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#34473e]">
                        {message.message}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b726d]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {dateTimeFormatter.format(new Date(message.createdAt))}
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-[#d4c4ae] bg-[#fff8ef] px-3 py-2 text-sm fc-text-muted">
                No messages yet. Start the conversation.
              </p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
