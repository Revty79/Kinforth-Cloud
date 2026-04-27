"use client";

import { useMemo, useState } from "react";
import { LockKeyhole, Save, ShieldCheck, UserPlus } from "lucide-react";
import {
  familyRoles,
  formatBytesToGiB,
  getFamilyRoleLabel,
  gibToBytes,
  type AdminUserAccessItem,
  type FamilyRole,
} from "@/lib/user-access-client";

type AdminControlCenterProps = {
  initialUsers: AdminUserAccessItem[];
  currentUserId: string;
  currentUserRole: FamilyRole;
};

type UserDraftState = {
  role: FamilyRole;
  storageLimitGiBText: string;
};

type CreateUserDraftState = {
  name: string;
  username: string;
  email: string;
  password: string;
  role: FamilyRole;
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

function buildInitialDraft(user: AdminUserAccessItem): UserDraftState {
  return {
    role: user.role,
    storageLimitGiBText: formatBytesToGiB(user.privateStorageLimitBytes).toFixed(2),
  };
}

function isValidAdminUserAccessItem(value: unknown): value is AdminUserAccessItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    typeof row.userId === "string" &&
    typeof row.name === "string" &&
    typeof row.username === "string" &&
    typeof row.email === "string" &&
    typeof row.privateStorageLimitBytes === "number" &&
    typeof row.role === "string"
  );
}

export function AdminControlCenter({
  initialUsers,
  currentUserId,
  currentUserRole,
}: AdminControlCenterProps) {
  const canAssignAdmin = currentUserRole === "admin";
  const assignableRoles = useMemo(
    () =>
      (canAssignAdmin
        ? [...familyRoles]
        : familyRoles.filter((role) => role !== "admin")) as FamilyRole[],
    [canAssignAdmin],
  );

  const [users, setUsers] = useState<AdminUserAccessItem[]>(initialUsers);
  const [drafts, setDrafts] = useState<Record<string, UserDraftState>>(() =>
    Object.fromEntries(
      initialUsers.map((user) => [user.userId, buildInitialDraft(user)]),
    ),
  );
  const [createDraft, setCreateDraft] = useState<CreateUserDraftState>({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "family_member",
  });
  const [pendingSaveUserId, setPendingSaveUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        `${a.name} ${a.username}`.localeCompare(
          `${b.name} ${b.username}`,
          undefined,
          { sensitivity: "base" },
        ),
      ),
    [users],
  );

  const handleSaveUser = async (userId: string) => {
    const draft = drafts[userId];
    if (!draft) {
      return;
    }

    const storageLimitGiB = Number(draft.storageLimitGiBText);
    if (!Number.isFinite(storageLimitGiB) || storageLimitGiB <= 0) {
      setPanelError("Storage limit must be a positive number of GB.");
      return;
    }

    const privateStorageLimitBytes = gibToBytes(storageLimitGiB);

    setPanelError(null);
    setPendingSaveUserId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: draft.role,
          privateStorageLimitBytes,
        }),
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        setPanelError(parseApiError(payload));
        return;
      }

      const updatedUser =
        payload &&
        typeof payload === "object" &&
        "user" in payload &&
        isValidAdminUserAccessItem(payload.user)
          ? payload.user
          : null;

      if (!updatedUser) {
        setPanelError("User was updated, but response data was invalid.");
        return;
      }

      setUsers((previous) =>
        previous.map((user) =>
          user.userId === updatedUser.userId ? updatedUser : user,
        ),
      );
      setDrafts((previous) => ({
        ...previous,
        [updatedUser.userId]: buildInitialDraft(updatedUser),
      }));
    } catch {
      setPanelError("Could not update this user right now.");
    } finally {
      setPendingSaveUserId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!createDraft.name.trim() || !createDraft.username.trim()) {
      setPanelError("Name and username are required.");
      return;
    }

    if (!createDraft.password || createDraft.password.length < 8) {
      setPanelError("Password must be at least 8 characters.");
      return;
    }

    setPanelError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: createDraft.name,
          username: createDraft.username,
          email: createDraft.email,
          password: createDraft.password,
          role: createDraft.role,
        }),
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        setPanelError(parseApiError(payload));
        return;
      }

      const createdUser =
        payload &&
        typeof payload === "object" &&
        "user" in payload &&
        isValidAdminUserAccessItem(payload.user)
          ? payload.user
          : null;

      if (!createdUser) {
        setPanelError("Account was created, but response data was invalid.");
        return;
      }

      setUsers((previous) => [...previous, createdUser]);
      setDrafts((previous) => ({
        ...previous,
        [createdUser.userId]: buildInitialDraft(createdUser),
      }));
      setCreateDraft({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "family_member",
      });
    } catch {
      setPanelError("Could not create this account right now.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <article className="fc-card rounded-xl border border-[#d6c8b2] p-5 sm:p-6">
      <div>
        <p className="fc-pill">
          <ShieldCheck className="h-4 w-4 text-sage" />
          Family manager controls
        </p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-[#23362f]">
          Family administration
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 fc-text-muted">
          Create family accounts, assign roles, and set private cloud storage
          quotas.
        </p>
      </div>

      {panelError ? (
        <p className="mt-4 rounded-md border border-[#d6bca7] bg-[#fff3e8] px-3 py-2 text-xs font-semibold text-[#8f4325]">
          {panelError}
        </p>
      ) : null}

      <section className="mt-5 rounded-lg border border-[#d6c5ac] bg-[#fff6e9] p-4">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#50625a]">
          <UserPlus className="h-3.5 w-3.5" />
          Add family account
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
              Full name
            </span>
            <input
              type="text"
              value={createDraft.name}
              onChange={(event) =>
                setCreateDraft((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              placeholder="Jordan Lee"
              className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
              Username
            </span>
            <input
              type="text"
              value={createDraft.username}
              onChange={(event) =>
                setCreateDraft((previous) => ({
                  ...previous,
                  username: event.target.value,
                }))
              }
              placeholder="jordan_lee"
              className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
              Email (optional)
            </span>
            <input
              type="email"
              value={createDraft.email}
              onChange={(event) =>
                setCreateDraft((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
              placeholder="you@family.com"
              className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
              Temporary password
            </span>
            <input
              type="password"
              minLength={8}
              value={createDraft.password}
              onChange={(event) =>
                setCreateDraft((previous) => ({
                  ...previous,
                  password: event.target.value,
                }))
              }
              placeholder="At least 8 characters"
              className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
            />
          </label>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,16rem)_auto] sm:items-end">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
              Role
            </span>
            <select
              value={createDraft.role}
              onChange={(event) =>
                setCreateDraft((previous) => ({
                  ...previous,
                  role: event.target.value as FamilyRole,
                }))
              }
              className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
            >
              {assignableRoles.map((role) => (
                <option key={`create-${role}`} value={role}>
                  {getFamilyRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleCreateUser}
            disabled={isCreating}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-[#a08062] bg-[#b86642] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#9d5737] disabled:opacity-70"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {isCreating ? "Creating..." : "Create account"}
          </button>
        </div>
      </section>

      <div className="mt-5 space-y-3">
        {sortedUsers.map((user) => {
          const draft = drafts[user.userId] ?? buildInitialDraft(user);
          const isCurrentUser = user.userId === currentUserId;
          const isSaving = pendingSaveUserId === user.userId;
          const usernameLabel = user.username ? `@${user.username}` : "";
          const showContactLabel =
            !usernameLabel ||
            user.email.toLowerCase() !== usernameLabel.toLowerCase();
          const managerLockedFromAdminUser =
            currentUserRole !== "admin" && user.role === "admin";
          const roleOptions =
            currentUserRole === "admin"
              ? familyRoles
              : draft.role === "admin"
                ? familyRoles
                : assignableRoles;

          return (
            <article
              key={user.userId}
              className="rounded-lg border border-[#d6c5ac] bg-[#fff6e9] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#2f4138]">{user.name}</p>
                  {usernameLabel ? (
                    <p className="text-xs text-[#5e6f67]">{usernameLabel}</p>
                  ) : null}
                  {showContactLabel ? (
                    <p className="text-xs text-[#5e6f67]">{user.email}</p>
                  ) : null}
                </div>
                <p className="inline-flex items-center gap-1 rounded-full border border-[#d0bca2] bg-[#f3e4d1] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#50625a]">
                  <LockKeyhole className="h-3 w-3" />
                  {isCurrentUser ? "You" : "User"}
                </p>
              </div>

              {managerLockedFromAdminUser ? (
                <p className="mt-3 text-xs font-semibold text-[#8f4325]">
                  Only admins can modify admin accounts.
                </p>
              ) : null}

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                    Role
                  </span>
                  <select
                    value={draft.role}
                    onChange={(event) => {
                      const role = event.target.value as FamilyRole;
                      setDrafts((previous) => ({
                        ...previous,
                        [user.userId]: {
                          ...draft,
                          role,
                        },
                      }));
                    }}
                    disabled={managerLockedFromAdminUser}
                    className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6] disabled:opacity-70"
                  >
                    {roleOptions.map((role) => (
                      <option
                        key={`${user.userId}-${role}`}
                        value={role}
                        disabled={currentUserRole !== "admin" && role === "admin"}
                      >
                        {getFamilyRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                    Private storage (GB)
                  </span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={draft.storageLimitGiBText}
                    onChange={(event) =>
                      setDrafts((previous) => ({
                        ...previous,
                        [user.userId]: {
                          ...draft,
                          storageLimitGiBText: event.target.value,
                        },
                      }))
                    }
                    disabled={managerLockedFromAdminUser}
                    className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6] disabled:opacity-70"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => handleSaveUser(user.userId)}
                disabled={isSaving || managerLockedFromAdminUser}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#a08062] bg-[#b86642] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#9d5737] disabled:opacity-70"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </article>
          );
        })}
      </div>
    </article>
  );
}
