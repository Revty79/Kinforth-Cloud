"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Clock3, MessageCircle, SendHorizontal, Trash2, UserRound } from "lucide-react";
import type {
  PrivateCloudChatMessageItem,
  PrivateCloudChatParticipant,
} from "@/lib/private-cloud";

type PrivateCloudChatCenterProps = {
  initialMessages: PrivateCloudChatMessageItem[];
  participants: PrivateCloudChatParticipant[];
  initialRecipientUserId: string | null;
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

function sortMessages(messages: PrivateCloudChatMessageItem[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function isPrivateCloudChatMessageItem(value: unknown): value is PrivateCloudChatMessageItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.message === "string" &&
    typeof row.sentByName === "string" &&
    typeof row.sentByUserId === "string" &&
    typeof row.recipientUserId === "string" &&
    typeof row.createdAt === "string"
  );
}

export function PrivateCloudChatCenter({
  initialMessages,
  participants,
  initialRecipientUserId,
  currentUserId,
}: PrivateCloudChatCenterProps) {
  const [selectedRecipientUserId, setSelectedRecipientUserId] = useState<
    string | null
  >(initialRecipientUserId);
  const [messages, setMessages] = useState<PrivateCloudChatMessageItem[]>(() =>
    sortMessages(initialMessages),
  );
  const [messageInput, setMessageInput] = useState("");
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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

  const selectedRecipient = useMemo(
    () =>
      participants.find((participant) => participant.id === selectedRecipientUserId) ??
      null,
    [participants, selectedRecipientUserId],
  );
  const visibleMessages = selectedRecipient ? messages : [];

  useEffect(() => {
    if (!selectedRecipientUserId) {
      return;
    }

    let isActive = true;

    const loadConversation = async () => {
      setChatError(null);
      setIsLoadingThread(true);

      try {
        const response = await fetch(
          `/api/private-cloud/chat?withUserId=${encodeURIComponent(selectedRecipientUserId)}`,
          {
            method: "GET",
          },
        );

        const payload = await parseJson(response);
        if (!response.ok) {
          if (isActive) {
            setChatError(parseApiError(payload));
          }
          return;
        }

        const rows =
          payload &&
          typeof payload === "object" &&
          "messages" in payload &&
          Array.isArray(payload.messages)
            ? payload.messages
            : [];

        const parsedMessages = rows.filter(isPrivateCloudChatMessageItem);

        if (isActive) {
          setMessages(sortMessages(parsedMessages));
        }
      } catch {
        if (isActive) {
          setChatError("Could not load this conversation right now.");
        }
      } finally {
        if (isActive) {
          setIsLoadingThread(false);
        }
      }
    };

    void loadConversation();

    return () => {
      isActive = false;
    };
  }, [selectedRecipientUserId]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRecipientUserId) {
      setChatError("Choose someone to message first.");
      return;
    }

    setChatError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/private-cloud/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageInput,
          recipientUserId: selectedRecipientUserId,
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
        isPrivateCloudChatMessageItem(payload.message)
          ? payload.message
          : null;

      if (!message || typeof message.id !== "string") {
        setChatError("Message was sent, but response data was invalid.");
        return;
      }

      setMessages((previous) => sortMessages([...previous, message]));
      setMessageInput("");
    } catch {
      setChatError("Could not send this message right now.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    setChatError(null);
    setPendingDeleteId(messageId);

    try {
      const response = await fetch(`/api/private-cloud/chat/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await parseJson(response);
        setChatError(parseApiError(payload));
        return;
      }

      setMessages((previous) =>
        previous.filter((message) => message.id !== messageId),
      );
    } catch {
      setChatError("Could not remove this message right now.");
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <article className="fc-card rounded-xl border border-[#d6c8b2] p-5 sm:p-6">
      <div>
        <p className="fc-pill">
          <MessageCircle className="h-4 w-4 text-sage" />
          Private communication
        </p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-[#23362f]">
          Private chat
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 fc-text-muted">
          Send direct private messages by choosing a recipient from your family
          accounts.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4e5f56]">
            <SendHorizontal className="h-4 w-4 text-accent" />
            New message
          </p>
          <form className="mt-3 space-y-2" onSubmit={handleSend}>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                Send to
              </span>
              <div className="mt-1 flex items-center gap-2 rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5">
                <UserRound className="h-4 w-4 text-[#63746b]" />
                <select
                  value={selectedRecipientUserId ?? ""}
                  onChange={(event) =>
                    setSelectedRecipientUserId(event.target.value || null)
                  }
                  className="w-full bg-transparent py-2 text-sm text-[#2f4038] outline-none"
                  disabled={participants.length === 0}
                >
                  {participants.length === 0 ? (
                    <option value="">No other users available</option>
                  ) : null}
                  {participants.length > 0 ? (
                    <option value="">Choose a person</option>
                  ) : null}
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name} ({participant.email})
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                Message
              </span>
              <textarea
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder={
                  selectedRecipient
                    ? `Message ${selectedRecipient.name}...`
                    : "Choose a recipient to start messaging"
                }
                rows={3}
                className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                required
                disabled={!selectedRecipientUserId}
              />
            </label>

            <button
              type="submit"
              disabled={isSending || !selectedRecipientUserId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#a08062] bg-[#b86642] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#9d5737] disabled:opacity-70"
            >
              <SendHorizontal className="h-4 w-4" />
              {isSending ? "Sending..." : "Send message"}
            </button>
          </form>
          {chatError ? (
            <p className="mt-2 text-xs font-semibold text-[#8f4325]">{chatError}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5b6b63]">
            {selectedRecipient
              ? `Chat with ${selectedRecipient.name}`
              : "Chat thread"}
          </p>

          {isLoadingThread ? (
            <p className="mt-3 rounded-lg border border-dashed border-[#d4c4ae] bg-[#fff8ef] px-3 py-2 text-sm fc-text-muted">
              Loading conversation...
            </p>
          ) : null}

          {!isLoadingThread && visibleMessages.length > 0 ? (
            <div className="mt-3 max-h-[38rem] space-y-2 overflow-y-auto pr-1">
              {visibleMessages.map((message) => {
                const isOwner = message.sentByUserId === currentUserId;
                const isPendingDelete = pendingDeleteId === message.id;

                return (
                  <article
                    key={message.id}
                    className="rounded-lg border border-[#d6c5ac] bg-[#fff6e9] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#66766e]">
                        {isOwner ? "You" : message.sentByName}
                      </p>
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(message.id)}
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
          ) : null}

          {!isLoadingThread && visibleMessages.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-[#d4c4ae] bg-[#fff8ef] px-3 py-2 text-sm fc-text-muted">
              {selectedRecipient
                ? "No messages yet. Start the conversation."
                : "Choose a recipient to view messages."}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
