import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminSettings, pressAccounts } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/customer-auth";
import { normalizeKenyaPhone } from "@/lib/order-tracking";

export type AdminRole = "admin" | "news_editor";

const NEWSPAPER_USERNAME = "newspaper";

export function createAdminToken(role: AdminRole = "admin"): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }

  const payload = `${role}:${Date.now()}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

export function parseAdminSession(token: string | undefined): AdminRole | null {
  if (!token) {
    return null;
  }

  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    return null;
  }

  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex === -1) {
    return null;
  }

  const payload = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);
  const rolePrefix = payload.split(":")[0];

  if (rolePrefix !== "admin" && rolePrefix !== "news_editor") {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(providedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );

    return valid ? (rolePrefix as AdminRole) : null;
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string | undefined): boolean {
  return parseAdminSession(token) !== null;
}

export function verifyFullAdminToken(token: string | undefined): boolean {
  return parseAdminSession(token) === "admin";
}

export function verifyNewsEditorToken(token: string | undefined): boolean {
  const role = parseAdminSession(token);
  return role === "admin" || role === "news_editor";
}

export function refreshAdminToken(token: string | undefined): string | null {
  const role = parseAdminSession(token);
  if (!role) {
    return null;
  }

  return createAdminToken(role);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const [settings] = await db.select().from(adminSettings).limit(1);

  if (settings?.passwordHash) {
    return verifyPassword(password, settings.passwordHash);
  }

  const envPassword = process.env.ADMIN_PASSWORD;
  return Boolean(envPassword && password === envPassword);
}

export async function verifyNewspaperLogin(
  username: string,
  password: string
): Promise<boolean> {
  const normalizedUsername = username.trim().toLowerCase();

  if (normalizedUsername !== NEWSPAPER_USERNAME) {
    return false;
  }

  const [account] = await db
    .select()
    .from(pressAccounts)
    .where(eq(pressAccounts.username, NEWSPAPER_USERNAME))
    .limit(1);

  if (account?.passwordHash) {
    return verifyPassword(password, account.passwordHash);
  }

  const configuredPassword = process.env.NEWSPAPER_PASSWORD || "Kariobangi2026!";
  return password === configuredPassword;
}

export async function ensurePressAccount(): Promise<void> {
  const [existing] = await db
    .select()
    .from(pressAccounts)
    .where(eq(pressAccounts.username, NEWSPAPER_USERNAME))
    .limit(1);

  if (existing) {
    return;
  }

  const password = process.env.NEWSPAPER_PASSWORD || "Kariobangi2026!";
  const passwordHash = await hashPassword(password);

  await db.insert(pressAccounts).values({
    username: NEWSPAPER_USERNAME,
    passwordHash,
    displayName: "Newspaper / Press",
  });
}

export async function updateNewspaperPassword(newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  const [existing] = await db
    .select()
    .from(pressAccounts)
    .where(eq(pressAccounts.username, NEWSPAPER_USERNAME))
    .limit(1);

  if (existing) {
    await db
      .update(pressAccounts)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(pressAccounts.id, existing.id));
    return;
  }

  await db.insert(pressAccounts).values({
    username: NEWSPAPER_USERNAME,
    passwordHash,
    displayName: "Newspaper / Press",
  });
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

export const NEWSPAPER_ACCOUNT_USERNAME = NEWSPAPER_USERNAME;
