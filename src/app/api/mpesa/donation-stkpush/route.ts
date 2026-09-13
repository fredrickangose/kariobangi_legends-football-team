import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureDatabaseSchema } from "@/db";
import { donations } from "@/db/schema";
import { initiateMpesaStkPush } from "@/lib/mpesa-stk";

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();

    const body = await request.json();
    const phone = String(body.phone || "").trim();
    const amount = Number(body.amount);
    const donorName = String(body.donorName || "").trim();
    const purpose = String(body.purpose || "").trim();
    const message = String(body.message || "").trim();
    const currency = String(body.currency || "KES")
      .trim()
      .toUpperCase();

    if (!donorName) {
      return NextResponse.json(
        { success: false, error: "Donor name is required." },
        { status: 400 }
      );
    }

    if (!purpose) {
      return NextResponse.json(
        { success: false, error: "Donation purpose is required." },
        { status: 400 }
      );
    }

    if (currency !== "KES") {
      return NextResponse.json(
        {
          success: false,
          error: "M-Pesa STK Push is only available for KES donations.",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "M-Pesa phone number is required." },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid donation amount is required." },
        { status: 400 }
      );
    }

    const [donation] = await db
      .insert(donations)
      .values({
        donorName,
        amount: Math.round(amount),
        currency: "KES",
        message,
        purpose,
        phoneNumber: null,
        paymentMethod: "mpesa",
        paymentStatus: "pending",
        createdAt: new Date(),
      })
      .returning({ id: donations.id });

    if (!donation) {
      throw new Error("Unable to create donation record.");
    }

    try {
      const stk = await initiateMpesaStkPush({
        phone,
        amount,
        accountReference: `DON-${donation.id}`,
        transactionDesc: `Kariobangi Legends donation - ${donorName}`,
      });

      await db
        .update(donations)
        .set({
          phoneNumber: stk.formattedPhone,
          merchantRequestId: stk.merchantRequestId,
          checkoutRequestId: stk.checkoutRequestId,
        })
        .where(eq(donations.id, donation.id));

      return NextResponse.json({
        success: true,
        message:
          "M-Pesa payment request sent successfully. Please check your phone.",
        donationId: donation.id,
      });
    } catch (stkError) {
      await db
        .update(donations)
        .set({ paymentStatus: "failed" })
        .where(eq(donations.id, donation.id));

      throw stkError;
    }
  } catch (error) {
    console.error("M-Pesa donation STK Push error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected M-Pesa donation payment error.",
      },
      { status: 500 }
    );
  }
}
