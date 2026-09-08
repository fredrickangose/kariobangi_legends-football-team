import crypto from "crypto";
import { promisify } from "util";
import { normalizeKenyaPhone } from "@/lib/order-tracking";

const scryptAsync = promisify(crypto.scrypt);

export interface CustomerSession {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const derived = (await scryptAsync(password, salt, 64)) as Buffer;

  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), derived);
  } catch {
    return false;
  }
}

export function createCustomerToken(customerId: number): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("CUSTOMER_SESSION_SECRET is not configured.");
  }

  const payload = `customer:${customerId}:${Date.now()}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

export function verifyCustomerToken(token: string | undefined): number | null {
  if (!token) {
    return null;
  }

  const secret = process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    return null;
  }

  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex === -1) {
    return null;
  }

  const payload = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);

  if (!payload.startsWith("customer:")) {
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

    if (!valid) {
      return null;
    }
  } catch {
    return null;
  }

  const parts = payload.split(":");
  const customerId = Number(parts[1]);

  return Number.isInteger(customerId) && customerId > 0 ? customerId : null;
}

export function normalizeCustomerPhone(phone: string): string {
  return normalizeKenyaPhone(phone);
}
