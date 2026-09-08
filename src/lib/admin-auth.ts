import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/customer-auth";
import { normalizeKenyaPhone } from "@/lib/order-tracking";

export function createAdminToken(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }

  const payload = `admin:${Date.now()}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    return false;
  }

  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex === -1) {
    return false;
  }

  const payload = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);

  if (!payload.startsWith("admin:")) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch {
    return false;
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const [settings] = await db.select().from(adminSettings).limit(1);

  if (settings?.passwordHash) {
    return verifyPassword(password, settings.passwordHash);
  }

  const envPassword = process.env.ADMIN_PASSWORD;
  return Boolean(envPassword && password === envPassword);
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  const [existing] = await db.select().from(adminSettings).limit(1);

  if (existing) {
    await db
      .update(adminSettings)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(adminSettings.id, existing.id));
    return;
  }

  await db.insert(adminSettings).values({ passwordHash });
}

export function isAuthorizedAdminResetPhone(phone: string): boolean {
  const normalizedInput = normalizeKenyaPhone(phone);
  const configuredPhones = (process.env.ADMIN_RESET_PHONES || process.env.ADMIN_RESET_PHONE || "")
    .split(",")
    .map((entry) => normalizeKenyaPhone(entry.trim()))
    .filter(Boolean);

  if (configuredPhones.length === 0) {
    return false;
  }

  return configuredPhones.includes(normalizedInput);
}
