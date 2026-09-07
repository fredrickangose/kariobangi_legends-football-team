import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
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
      console.error(
        "No order found for CheckoutRequestID:",
        checkoutRequestId
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received, but matching order was not found.",
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