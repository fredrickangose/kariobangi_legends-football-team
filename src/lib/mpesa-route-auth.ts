import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations, orders } from "@/db/schema";
import { verifyFullAdminToken } from "@/lib/admin-auth";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { getPhoneLookupVariants } from "@/lib/link-customer-orders";
import { normalizeKenyaPhone } from "@/lib/order-tracking";

function phonesMatch(storedPhone: string, providedPhone: string): boolean {
  const normalizedStored = normalizeKenyaPhone(storedPhone);
  const normalizedProvided = normalizeKenyaPhone(providedPhone);

  if (!normalizedStored || !normalizedProvided) {
    return false;
  }

  if (normalizedStored === normalizedProvided) {
    return true;
  }

  const variants = new Set([
    ...getPhoneLookupVariants(normalizedStored),
    ...getPhoneLookupVariants(storedPhone),
  ]);

  return variants.has(normalizedProvided) || variants.has(providedPhone);
}

export async function authorizeOrderStatusAccess(input: {
  orderId: number;
  phone?: string;
}) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, input.orderId))
    .limit(1);

  if (!order) {
    return {
      ok: false as const,
      status: 404,
      error: "Order not found.",
    };
  }

  const cookieStore = await cookies();
  const customerId = verifyCustomerToken(
    cookieStore.get("kariobangi_customer")?.value
  );
  const isAdmin = verifyFullAdminToken(
    cookieStore.get("kariobangi_admin")?.value
  );

  if (isAdmin) {
    return { ok: true as const, order };
  }

  if (customerId && order.customerId === customerId) {
    return { ok: true as const, order };
  }

  if (input.phone && phonesMatch(order.phoneNumber, input.phone)) {
    return { ok: true as const, order };
  }

  return {
    ok: false as const,
    status: 403,
    error: "You are not authorized to view this order status.",
  };
}

export async function authorizeDonationStatusAccess(input: {
  donationId: number;
  phone?: string;
}) {
  const [donation] = await db
    .select()
    .from(donations)
    .where(eq(donations.id, input.donationId))
    .limit(1);

  if (!donation) {
    return {
      ok: false as const,
      status: 404,
      error: "Donation not found.",
    };
  }

  const cookieStore = await cookies();
  const isAdmin = verifyFullAdminToken(
    cookieStore.get("kariobangi_admin")?.value
  );

  if (isAdmin) {
    return { ok: true as const, donation };
  }

  if (!input.phone) {
    return {
      ok: false as const,
      status: 403,
      error: "Phone number is required to check donation status.",
    };
  }

  if (!donation.phoneNumber) {
    return {
      ok: false as const,
      status: 403,
      error: "You are not authorized to view this donation status.",
    };
  }

  if (phonesMatch(donation.phoneNumber, input.phone)) {
    return { ok: true as const, donation };
  }

  return {
    ok: false as const,
    status: 403,
    error: "You are not authorized to view this donation status.",
  };
}
