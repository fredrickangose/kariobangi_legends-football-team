import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, ensureDatabaseSchema } from "@/db";
import { customers, memberships } from "@/db/schema";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { getMembershipPlan } from "@/lib/membership";
import { findActivePaidMembership } from "@/lib/membership-server";
import { initiateMpesaStkPush } from "@/lib/mpesa-stk";

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();

    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Sign in or create a fan account before joining.",
        },
        { status: 401 }
      );
    }

    const existing = await findActivePaidMembership(customerId);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have an active membership. It is on your account card.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const plan = getMembershipPlan(String(body.planId || ""));
    const phone = String(body.phone || "").trim();

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Choose a membership plan." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "M-Pesa phone number is required." },
        { status: 400 }
      );
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Fan account not found." },
        { status: 404 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const [membership] = await db
      .insert(memberships)
      .values({
        customerId,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        planId: plan.id,
        amount: plan.price,
        paymentMethod: "mpesa",
        paymentStatus: "pending",
        expiresAt,
        createdAt: new Date(),
      })
      .returning({ id: memberships.id });

    if (!membership) {
      throw new Error("Unable to create membership record.");
    }

    try {
      const stk = await initiateMpesaStkPush({
        phone,
        amount: plan.price,
        accountReference: `MEM-${membership.id}`,
        transactionDesc: `Kariobangi Legends ${plan.name} membership`,
      });

      await db
        .update(memberships)
        .set({
          phoneNumber: stk.formattedPhone,
          merchantRequestId: stk.merchantRequestId,
          checkoutRequestId: stk.checkoutRequestId,
        })
        .where(eq(memberships.id, membership.id));

      return NextResponse.json({
        success: true,
        membershipId: membership.id,
        message: "M-Pesa payment request sent. Check your phone and enter your PIN.",
      });
    } catch (stkError) {
      await db
        .update(memberships)
        .set({ paymentStatus: "failed" })
        .where(eq(memberships.id, membership.id));
      throw stkError;
    }
  } catch (error) {
    console.error("M-Pesa membership STK Push error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to start membership payment.",
      },
      { status: 500 }
    );
  }
}
