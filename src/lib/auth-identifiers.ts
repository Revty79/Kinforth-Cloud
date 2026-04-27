const internalAuthEmailDomain = "accounts.kinforth.invalid";

export const minAuthUsernameLength = 3;
export const maxAuthUsernameLength = 30;

const authUsernamePattern = /^[a-zA-Z0-9_.]+$/;

export function normalizeAuthUsername(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeOptionalAuthEmail(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return normalized;
}

export function isLikelyEmailIdentifier(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidAuthUsername(value: string) {
  const normalized = normalizeAuthUsername(value);
  return (
    normalized.length >= minAuthUsernameLength &&
    normalized.length <= maxAuthUsernameLength &&
    authUsernamePattern.test(normalized)
  );
}

export function isInternalAuthEmail(email: string) {
  const normalized = normalizeOptionalAuthEmail(email);
  if (!normalized) {
    return false;
  }

  return normalized.endsWith(`@${internalAuthEmailDomain}`);
}

export function buildAuthEmailForAccount({
  username,
  email,
}: {
  username: string;
  email?: string | null | undefined;
}) {
  const normalizedUsername = normalizeAuthUsername(username);
  const normalizedEmail = normalizeOptionalAuthEmail(email);

  if (normalizedEmail) {
    if (isInternalAuthEmail(normalizedEmail)) {
      throw new Error("That email domain is reserved by Kinforth Cloud.");
    }
    return normalizedEmail;
  }

  return `${normalizedUsername}@${internalAuthEmailDomain}`;
}

export function getUserContactLabel(user: {
  email?: string | null;
  username?: string | null;
}) {
  const normalizedEmail = normalizeOptionalAuthEmail(user.email);
  if (normalizedEmail && !isInternalAuthEmail(normalizedEmail)) {
    return normalizedEmail;
  }

  const normalizedUsername =
    typeof user.username === "string" ? normalizeAuthUsername(user.username) : "";

  if (normalizedUsername) {
    return `@${normalizedUsername}`;
  }

  return "No email";
}

export function getUserDisplayName(
  user: {
    name?: string | null;
    email?: string | null;
    username?: string | null;
  },
  fallback = "Family member",
) {
  const normalizedName =
    typeof user.name === "string" ? user.name.trim() : "";
  if (normalizedName) {
    return normalizedName;
  }

  const contactLabel = getUserContactLabel(user);
  if (contactLabel === "No email") {
    return fallback;
  }

  return contactLabel;
}
