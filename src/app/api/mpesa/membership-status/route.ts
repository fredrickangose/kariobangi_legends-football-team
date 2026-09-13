import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, ensureDatabaseSchema } from "@/db";
import { memberships } from "@/db/schema";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { getPhoneLookupVariants } from "@/lib/link-customer-orders";
import { normalizeKenyaPhone } from "@/lib/order-tracking";

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema();

    const { searchParams } = new URL(request.url);
    const membershipId = Number(searchParams.get("membershipId"));
    const phone = String(searchParams.get("phone") || "").trim();

    if (!membershipId || membershipId <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid membership ID is required." },
        { status: 400 }
      );
    }

    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.id, membershipId))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Membership not found." },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    const normalizedStored = normalizeKenyaPhone(membership.phoneNumber);
    const normalizedProvided = normalizeKenyaPhone(phone);
    const phoneOk =
      Boolean(normalizedProvided) &&
      (normalizedStored === normalizedProvided ||
        getPhoneLookupVariants(membership.phoneNumber).includes(normalizedProvided || ""));

    if (customerId !== membership.customerId && !phoneOk) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to view this membership." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      membershipId: membership.id,
      paymentStatus: membership.paymentStatus,
      mpesaReceiptNumber: membership.mpesaReceiptNumber,
      expiresAt: membership.expiresAt,
    });
  } catch (error) {
    console.error("M-Pesa membership status error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to check membership payment status.",
      },
      { status: 500 }
    );
  }
}
