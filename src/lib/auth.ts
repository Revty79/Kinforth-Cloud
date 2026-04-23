import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db";
import * as schema from "../db/schema";
import { sendPasswordResetEmail } from "./email";

const configuredBaseUrl = process.env.BETTER_AUTH_URL?.trim() || undefined;
const baseUrl =
  configuredBaseUrl ||
  (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");
const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  "family-cloud-dev-secret-change-in-production";

function parseTrustedOrigins(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function firstHeaderValue(headers: Headers, name: string) {
  const raw = headers.get(name);
  if (!raw) {
    return undefined;
  }

  const first = raw.split(",")[0]?.trim();
  return first || undefined;
}

function collectRequestOrigins(request: Request | undefined) {
  const origins: string[] = [];

  if (!request) {
    return origins;
  }

  try {
    const origin = new URL(request.url).origin;
    if (origin.startsWith("http://") || origin.startsWith("https://")) {
      origins.push(origin);
    }
  } catch {
    // Ignore malformed request URLs.
  }

  const forwardedHost = firstHeaderValue(request.headers, "x-forwarded-host");
  const host = firstHeaderValue(request.headers, "host");
  const resolvedHost = forwardedHost ?? host;

  if (!resolvedHost) {
    return origins;
  }

  const forwardedProto = firstHeaderValue(request.headers, "x-forwarded-proto");
  if (forwardedProto) {
    origins.push(`${forwardedProto}://${resolvedHost}`);
  } else {
    origins.push(`http://${resolvedHost}`);
    origins.push(`https://${resolvedHost}`);
  }

  return origins;
}

const staticTrustedOrigins = Array.from(
  new Set([
    ...(baseUrl ? [baseUrl] : []),
    ...parseTrustedOrigins(process.env.BETTER_AUTH_TRUSTED_ORIGINS),
    ...parseTrustedOrigins(process.env.NEXT_PUBLIC_BETTER_AUTH_URL),
    ...parseTrustedOrigins(process.env.NEXT_PUBLIC_AUTH_URL),
  ]),
);

export const auth = betterAuth({
  appName: "Family Cloud",
  ...(baseUrl ? { baseURL: baseUrl } : {}),
  secret: authSecret,
  trustedOrigins: async (request) =>
    Array.from(
      new Set([...staticTrustedOrigins, ...collectRequestOrigins(request)]),
    ),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        url,
        name: user.name,
      });
    },
    onPasswordReset: async ({ user }) => {
      console.info(
        `[Family Cloud Auth] Password reset completed for ${user.email}.`,
      );
    },
  },
  plugins: [nextCookies()],
});
