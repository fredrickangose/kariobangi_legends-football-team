import crypto from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetCodes } from "@/db/schema";
import { normalizeKenyaPhone } from "@/lib/order-tracking";

const RESET_CODE_TTL_MS = 15 * 60 * 1000;

function getResetSecret() {
  return (
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "kariobangi-dev-reset-secret"
  );
}

function hashResetCode(code: string): string {
  return crypto.createHmac("sha256", getResetSecret()).update(code).digest("hex");
}

export function generateResetCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function storeResetCode(input: {
  accountType: "customer" | "admin";
  phoneNumber: string;
  code: string;
  customerId?: number | null;
}) {
  const phoneNumber = normalizeKenyaPhone(input.phoneNumber);
  const codeHash = hashResetCode(input.code);
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);

  await db
    .delete(passwordResetCodes)
    .where(
      and(
        eq(passwordResetCodes.accountType, input.accountType),
        eq(passwordResetCodes.phoneNumber, phoneNumber)
      )
    );

  await db.insert(passwordResetCodes).values({
    accountType: input.accountType,
    phoneNumber,
    customerId: input.customerId ?? null,
    codeHash,
    expiresAt,
  });
}

export async function verifyResetCode(input: {
  accountType: "customer" | "admin";
  phoneNumber: string;
  code: string;
}): Promise<boolean> {
  const phoneNumber = normalizeKenyaPhone(input.phoneNumber);
  const codeHash = hashResetCode(input.code);

  const [record] = await db
    .select()
    .from(passwordResetCodes)
    .where(
      and(
        eq(passwordResetCodes.accountType, input.accountType),
        eq(passwordResetCodes.phoneNumber, phoneNumber),
        eq(passwordResetCodes.codeHash, codeHash),
        gt(passwordResetCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  return Boolean(record);
}

export async function consumeResetCode(input: {
  accountType: "customer" | "admin";
  phoneNumber: string;
  code: string;
}) {
  const phoneNumber = normalizeKenyaPhone(input.phoneNumber);
  const codeHash = hashResetCode(input.code);

  await db
    .delete(passwordResetCodes)
    .where(
      and(
        eq(passwordResetCodes.accountType, input.accountType),
        eq(passwordResetCodes.phoneNumber, phoneNumber),
        eq(passwordResetCodes.codeHash, codeHash)
      )
    );
}
