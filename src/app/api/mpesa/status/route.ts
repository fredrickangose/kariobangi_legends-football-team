import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const orderId = Number(
      searchParams.get("orderId")
    );

    if (!orderId || orderId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid order ID is required.",
        },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        id: orders.id,
        paymentStatus: orders.paymentStatus,
        mpesaReceiptNumber:
          orders.mpesaReceiptNumber,
        transactionDate:
          orders.transactionDate,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const order = result[0];

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      mpesaReceiptNumber:
        order.mpesaReceiptNumber,
      transactionDate:
        order.transactionDate,
    });
  } catch (error) {
    console.error(
      "M-PESA order status error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to check payment status.",
      },
      { status: 500 }
    );
  }
}