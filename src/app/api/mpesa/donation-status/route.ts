import { NextResponse } from "next/server";
import { ensureDatabaseSchema } from "@/db";
import { authorizeDonationStatusAccess } from "@/lib/mpesa-route-auth";

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema();

    const { searchParams } = new URL(request.url);
    const donationId = Number(searchParams.get("donationId"));
    const phone = String(searchParams.get("phone") || "").trim();

    if (!donationId || donationId <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid donation ID is required." },
        { status: 400 }
      );
    }

    const access = await authorizeDonationStatusAccess({ donationId, phone });

    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const donation = access.donation;

    return NextResponse.json({
      success: true,
      donationId: donation.id,
      paymentStatus: donation.paymentStatus,
      mpesaReceiptNumber: donation.mpesaReceiptNumber,
      transactionDate: donation.transactionDate,
    });
  } catch (error) {
    console.error("M-Pesa donation status error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to check donation payment status.",
      },
      { status: 500 }
    );
  }
}
