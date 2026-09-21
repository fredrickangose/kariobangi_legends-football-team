import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

export type RateLimitScope =
  | "admin_login"
  | "customer_login"
  | "newspaper_login"
  | "password_reset";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/** Returns true when the identifier has too many recent failed attempts. */
export async function isRateLimited(
  scope: RateLimitScope,
  identifier: string
): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.createdAt, windowStart));

  const recentAttempts = await db
    .select({ id: loginAttempts.id })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.scope, scope),
        eq(loginAttempts.identifier, identifier),
        gt(loginAttempts.createdAt, windowStart)
      )
    );

  return recentAttempts.length >= MAX_ATTEMPTS;
}

export async function recordFailedAttempt(
  scope: RateLimitScope,
  identifier: string
): Promise<void> {
  await db.insert(loginAttempts).values({ scope, identifier });
}

export async function clearFailedAttempts(
  scope: RateLimitScope,
  identifier: string
): Promise<void> {
  await db
    .delete(loginAttempts)
    .where(
      and(
        eq(loginAttempts.scope, scope),
        eq(loginAttempts.identifier, identifier)
      )
    );
}
