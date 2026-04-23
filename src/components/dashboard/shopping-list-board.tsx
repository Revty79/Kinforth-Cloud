"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ListChecks, ShoppingBasket, Trash2 } from "lucide-react";
import {
  shoppingListBuckets,
  type FamilyShoppingItem,
  type ShoppingListBucket,
} from "@/lib/shopping-list";

type ShoppingListBoardProps = {
  initialItems: FamilyShoppingItem[];
};

type BucketFormState = Record<ShoppingListBucket, string>;
type BucketLoadingState = Record<ShoppingListBucket, boolean>;

const bucketContent: Record<
  ShoppingListBucket,
  { title: string; helper: string; placeholder: string }
> = {
  needs: {
    title: "Needs",
    helper: "Must-have groceries and household essentials.",
    placeholder: "Milk, eggs, paper towels...",
  },
  wants: {
    title: "Wants",
    helper: "Nice-to-have items, treats, and extras.",
    placeholder: "Ice cream, chips, sparkling water...",
  },
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

function sortItems(items: FamilyShoppingItem[]) {
  return [...items].sort((a, b) => {
    if (a.bucket !== b.bucket) {
      return a.bucket.localeCompare(b.bucket);
    }

    if (a.isChecked !== b.isChecked) {
      return Number(a.isChecked) - Number(b.isChecked);
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function isFamilyShoppingItem(value: unknown): value is FamilyShoppingItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;
  const checkedAtValue = row.checkedAt;
  const checkedByUserIdValue = row.checkedByUserId;

  return (
    typeof row.id === "string" &&
    typeof row.label === "string" &&
    (row.bucket === "needs" || row.bucket === "wants") &&
    typeof row.isChecked === "boolean" &&
    typeof row.createdByName === "string" &&
    typeof row.createdByUserId === "string" &&
    (typeof checkedByUserIdValue === "string" || checkedByUserIdValue === null) &&
    (typeof checkedAtValue === "string" || checkedAtValue === null) &&
    typeof row.createdAt === "string" &&
    typeof row.updatedAt === "string"
  );
}

export function ShoppingListBoard({ initialItems }: ShoppingListBoardProps) {
  const [items, setItems] = useState<FamilyShoppingItem[]>(() =>
    sortItems(initialItems),
  );
  const [draftByBucket, setDraftByBucket] = useState<BucketFormState>({
    needs: "",
    wants: "",
  });
  const [isAddingByBucket, setIsAddingByBucket] = useState<BucketLoadingState>({
    needs: false,
    wants: false,
  });
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeletingPickedUp, setIsDeletingPickedUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    [],
  );

  const remainingCount = useMemo(
    () => items.filter((item) => !item.isChecked).length,
    [items],
  );

  const pickedUpCount = items.length - remainingCount;

  const handleAddItem = async (
    event: FormEvent<HTMLFormElement>,
    bucket: ShoppingListBucket,
  ) => {
    event.preventDefault();
    setError(null);
    setIsAddingByBucket((previous) => ({ ...previous, [bucket]: true }));

    try {
      const response = await fetch("/api/shopping-list/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: draftByBucket[bucket],
          bucket,
        }),
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        setError(parseApiError(payload));
        return;
      }

      const item =
        payload &&
        typeof payload === "object" &&
        "item" in payload &&
        isFamilyShoppingItem(payload.item)
          ? payload.item
          : null;

      if (!item) {
        setError("Item was added, but response data was invalid.");
        return;
      }

      setItems((previous) => sortItems([item, ...previous]));
      setDraftByBucket((previous) => ({ ...previous, [bucket]: "" }));
    } catch {
      setError("Could not add item right now.");
    } finally {
      setIsAddingByBucket((previous) => ({ ...previous, [bucket]: false }));
    }
  };

  const handleToggleItem = async (itemId: string, isChecked: boolean) => {
    setError(null);
    setPendingToggleId(itemId);

    try {
      const response = await fetch(`/api/shopping-list/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isChecked,
        }),
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        setError(parseApiError(payload));
        return;
      }

      const updatedItem =
        payload &&
        typeof payload === "object" &&
        "item" in payload &&
        isFamilyShoppingItem(payload.item)
          ? payload.item
          : null;

      if (!updatedItem) {
        setError("Item was updated, but response data was invalid.");
        return;
      }

      setItems((previous) =>
        sortItems(
          previous.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
        ),
      );
    } catch {
      setError("Could not update item right now.");
    } finally {
      setPendingToggleId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setError(null);
    setPendingDeleteId(itemId);

    try {
      const response = await fetch(`/api/shopping-list/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await parseJson(response);
        setError(parseApiError(payload));
        return;
      }

      setItems((previous) => previous.filter((item) => item.id !== itemId));
    } catch {
      setError("Could not remove item right now.");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleDeletePickedUpItems = async () => {
    if (pickedUpCount === 0) {
      return;
    }

    setError(null);
    setIsDeletingPickedUp(true);

    try {
      const response = await fetch("/api/shopping-list/items", {
        method: "DELETE",
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        setError(parseApiError(payload));
        return;
      }

      setItems((previous) => previous.filter((item) => !item.isChecked));
    } catch {
      setError("Could not delete picked up items right now.");
    } finally {
      setIsDeletingPickedUp(false);
    }
  };

  return (
    <article className="fc-card rounded-xl border border-[#d6c8b2] p-5 sm:p-6">
      <div>
        <p className="fc-pill">
          <ShoppingBasket className="h-4 w-4 text-sage" />
          Shared grocery planning
        </p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-[#23362f]">
          Family shopping list
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 fc-text-muted">
          Add items quickly, split them into needs and wants, and check them off
          when they are picked up.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#4f6158]">
        <span className="rounded-full border border-[#d2c3ad] bg-[#f5ead9] px-3 py-1">
          Remaining: {remainingCount}
        </span>
        <span className="rounded-full border border-[#d2c3ad] bg-[#f5ead9] px-3 py-1">
          Picked up: {pickedUpCount}
        </span>
        <button
          type="button"
          onClick={handleDeletePickedUpItems}
          disabled={pickedUpCount === 0 || isDeletingPickedUp}
          className="inline-flex items-center gap-1 rounded-full border border-[#d2b7a1] bg-[#fff3e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a4730] transition hover:border-[#bf967a] hover:text-[#5f3422] disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isDeletingPickedUp ? "Deleting..." : "Delete picked up items"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-[#d9b6a1] bg-[#fff0e7] px-3 py-2 text-xs font-semibold text-[#8f4325]">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {shoppingListBuckets.map((bucket) => {
          const content = bucketContent[bucket];
          const bucketItems = items.filter((item) => item.bucket === bucket);

          return (
            <section
              key={bucket}
              className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-2xl tracking-tight text-[#243730]">
                    {content.title}
                  </h3>
                  <p className="mt-1 text-sm fc-text-muted">{content.helper}</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-[#d2c3ad] bg-[#f4e9d8] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#5d6d64]">
                  {bucketItems.length} item{bucketItems.length === 1 ? "" : "s"}
                </span>
              </div>

              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={(event) => handleAddItem(event, bucket)}
              >
                <input
                  value={draftByBucket[bucket]}
                  onChange={(event) =>
                    setDraftByBucket((previous) => ({
                      ...previous,
                      [bucket]: event.target.value,
                    }))
                  }
                  placeholder={content.placeholder}
                  className="w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  required
                />
                <button
                  type="submit"
                  disabled={isAddingByBucket[bucket]}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#a08062] bg-[#b86642] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#9d5737] disabled:opacity-70"
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  {isAddingByBucket[bucket] ? "Adding..." : "Add"}
                </button>
              </form>

              {bucketItems.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {bucketItems.map((item) => {
                    const inputId = `shopping-item-${item.id}`;
                    const isBusy =
                      pendingToggleId === item.id ||
                      pendingDeleteId === item.id ||
                      isDeletingPickedUp;

                    return (
                      <article
                        key={item.id}
                        className={`rounded-lg border p-3 ${
                          item.isChecked
                            ? "border-[#d6cfbf] bg-[#f5f5ef]"
                            : "border-[#d6c5ac] bg-[#fff6e9]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <label
                            htmlFor={inputId}
                            className="flex min-w-0 grow items-start gap-2"
                          >
                            <input
                              id={inputId}
                              type="checkbox"
                              checked={item.isChecked}
                              onChange={(event) =>
                                handleToggleItem(item.id, event.target.checked)
                              }
                              disabled={isBusy}
                              className="mt-0.5 h-4 w-4 accent-[#5a7a67]"
                            />
                            <span
                              className={`text-sm leading-6 ${
                                item.isChecked
                                  ? "text-[#62726a] line-through"
                                  : "text-[#2f4138]"
                              }`}
                            >
                              {item.label}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-md border border-[#d2b7a1] bg-[#fff3e8] px-2 py-1 text-[11px] font-semibold text-[#7a4730] transition hover:border-[#bf967a] hover:text-[#5f3422] disabled:opacity-70"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>

                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b726d]">
                          Added by {item.createdByName}
                          {item.isChecked && item.checkedAt
                            ? ` | Picked up ${dateTimeFormatter.format(
                                new Date(item.checkedAt),
                              )}`
                            : ""}
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 rounded-lg border border-dashed border-[#d4c4ae] bg-[#fff8ef] px-3 py-2 text-sm fc-text-muted">
                  No {content.title.toLowerCase()} yet. Add the first item.
                </p>
              )}
            </section>
          );
        })}
      </div>

      {pickedUpCount > 0 ? (
        <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#5f6d64]">
          <CheckCircle2 className="h-4 w-4 text-[#5a7a67]" />
          Delete picked up items to quickly clear checked entries.
        </p>
      ) : null}
    </article>
  );
}

