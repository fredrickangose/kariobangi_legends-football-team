import { NextResponse } from "next/server";
import { db, ensureDatabaseSchema } from "@/db";
import { donations, memberships, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMembershipPlan } from "@/lib/membership";
import { notifyBuyerOrderUpdate, notifyMembershipConfirmed } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();

    const body = await request.json();

    console.log(
      "================ M-PESA CALLBACK ================"
    );
    console.log(JSON.stringify(body, null, 2));
    console.log(
      "=================================================="
    );

    const stkCallback =
      body?.Body?.stkCallback;

    if (!stkCallback) {
      console.error("Invalid M-PESA callback payload.");

      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: "Invalid callback payload",
      });
    }

    const resultCode = stkCallback.ResultCode;
    const resultDescription =
      stkCallback.ResultDesc || "";

    const checkoutRequestId =
      stkCallback.CheckoutRequestID;

    if (!checkoutRequestId) {
      console.error(
        "M-PESA callback does not contain CheckoutRequestID."
      );

      return NextResponse.json({
        ResultCode: 1,
        ResultDesc:
          "CheckoutRequestID is missing.",
      });
    }

    // --------------------------------------------------
    // FIND THE ORDER
    // --------------------------------------------------

    const existingOrders = await db
      .select()
      .from(orders)
      .where(
        eq(
          orders.checkoutRequestId,
          checkoutRequestId
        )
      )
      .limit(1);

    const order = existingOrders[0];

    if (!order) {
      const existingDonations = await db
        .select()
        .from(donations)
        .where(eq(donations.checkoutRequestId, checkoutRequestId))
        .limit(1);

      const donation = existingDonations[0];

      if (!donation) {
        const existingMemberships = await db
          .select()
          .from(memberships)
          .where(eq(memberships.checkoutRequestId, checkoutRequestId))
          .limit(1);

        const membership = existingMemberships[0];

        if (!membership) {
          console.error(
            "No order, donation, or membership found for CheckoutRequestID:",
            checkoutRequestId
          );

          return NextResponse.json({
            ResultCode: 0,
            ResultDesc:
              "Callback received, but matching payment record was not found.",
          });
        }

        console.log(
          "Matched M-PESA callback to membership:",
          membership.id
        );

        if (resultCode === 0) {
          const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
          const metadata: Record<string, unknown> = {};

          for (const item of callbackMetadata) {
            if (item?.Name) {
              metadata[item.Name] = item.Value;
            }
          }

          const receiptNumber =
            typeof metadata.MpesaReceiptNumber === "string"
              ? metadata.MpesaReceiptNumber
              : null;

          const transactionDate =
            metadata.TransactionDate != null
              ? String(metadata.TransactionDate)
              : null;

          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          await db
            .update(memberships)
            .set({
              paymentStatus: "paid",
              mpesaReceiptNumber: receiptNumber,
              transactionDate,
              expiresAt,
            })
            .where(eq(memberships.id, membership.id));

          const plan = getMembershipPlan(membership.planId);
          await notifyMembershipConfirmed(
            membership.phoneNumber,
            plan?.name ?? "Official Fan",
            expiresAt
          );

          return NextResponse.json({
            ResultCode: 0,
            ResultDesc: "Membership payment processed successfully.",
          });
        }

        await db
          .update(memberships)
          .set({ paymentStatus: "failed" })
          .where(eq(memberships.id, membership.id));

        return NextResponse.json({
          ResultCode: 0,
          ResultDesc: "Membership payment failure recorded successfully.",
        });
      }

      console.log(
        "Matched M-PESA callback to donation:",
        donation.id
      );

      if (resultCode === 0) {
        const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
        const metadata: Record<string, unknown> = {};

        for (const item of callbackMetadata) {
          if (item?.Name) {
            metadata[item.Name] = item.Value;
          }
        }

        const receiptNumber =
          typeof metadata.MpesaReceiptNumber === "string"
            ? metadata.MpesaReceiptNumber
            : null;

        const transactionDate =
          metadata.TransactionDate != null
            ? String(metadata.TransactionDate)
            : null;

        await db
          .update(donations)
          .set({
            paymentStatus: "paid",
            mpesaReceiptNumber: receiptNumber,
            transactionDate,
          })
          .where(eq(donations.id, donation.id));

        return NextResponse.json({
          ResultCode: 0,
          ResultDesc: "Donation payment processed successfully.",
        });
      }

      await db
        .update(donations)
        .set({ paymentStatus: "failed" })
        .where(eq(donations.id, donation.id));

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Donation payment failure recorded successfully.",
      });
    }

    console.log(
      "Matched M-PESA callback to order:",
      order.id
    );

    // --------------------------------------------------
    // PAYMENT SUCCESSFUL
    // --------------------------------------------------

    if (resultCode === 0) {
      console.log("✅ M-PESA PAYMENT SUCCESSFUL");
      console.log(
        "Description:",
        resultDescription
      );

      const callbackMetadata =
        stkCallback.CallbackMetadata?.Item || [];

      const metadata: Record<
        string,
        unknown
      > = {};

      for (const item of callbackMetadata) {
        if (item?.Name) {
          metadata[item.Name] = item.Value;
        }
      }

      console.log(
        "M-PESA transaction metadata:",
        metadata
      );

      const receiptNumber =
        typeof metadata.MpesaReceiptNumber ===
        "string"
          ? metadata.MpesaReceiptNumber
          : null;

      const transactionDate =
        metadata.TransactionDate != null
          ? String(metadata.TransactionDate)
          : null;

      await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          mpesaReceiptNumber:
            receiptNumber,
          transactionDate:
            transactionDate,
        })
        .where(
          eq(orders.id, order.id)
        );

      console.log(
        `✅ Order #${order.id} updated to PAID`
      );

      await notifyBuyerOrderUpdate(
        order.phoneNumber,
        order.id,
        "payment_confirmed"
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Payment processed successfully.",
      });
    }

    // --------------------------------------------------
    // PAYMENT FAILED / CANCELLED
    // --------------------------------------------------

    console.log(
      "❌ M-PESA PAYMENT FAILED/CANCELLED"
    );

    console.log(
      "Result Code:",
      resultCode
    );

    console.log(
      "Description:",
      resultDescription
    );

    await db
      .update(orders)
      .set({
        paymentStatus: "failed",
      })
      .where(
        eq(orders.id, order.id)
      );

    console.log(
      `❌ Order #${order.id} marked as FAILED`
    );

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc:
        "Payment failure recorded successfully.",
    });
  } catch (error) {
    console.error(
      "M-PESA callback error:",
      error
    );

    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc:
          "Callback processing failed",
      },
      { status: 500 }
    );
  }
}