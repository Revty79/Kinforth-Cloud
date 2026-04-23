export function getAuthErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
    if ("statusText" in error && typeof error.statusText === "string") {
      return error.statusText;
    }
  }

  return fallback;
}
