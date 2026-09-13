import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureDatabaseSchema } from "@/db";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { createPendingOrder } from "@/lib/create-pending-order";
import type { CheckoutCartItem } from "@/lib/order-customization";
import { notifyCashOrderPlaced } from "@/lib/notifications";
import { validateAndPriceCheckoutCart } from "@/lib/validate-checkout-cart.server";

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();

    const body = await request.json();
    const phone = String(body.phone || "").trim();
    const name = String(body.name || "").trim();
    const deliveryAddress = String(body.deliveryAddress || "").trim();
    const cart = Array.isArray(body.cart) ? (body.cart as CheckoutCartItem[]) : [];

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Customer name is required." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Contact phone number is required." },
        { status: 400 }
      );
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        { success: false, error: "Delivery address is required." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please create an account or sign in before completing your purchase.",
        },
        { status: 401 }
      );
    }

    const pricedCart = await validateAndPriceCheckoutCart(cart);
    if (!pricedCart.ok) {
      return NextResponse.json(
        { success: false, error: pricedCart.error },
        { status: 400 }
      );
    }

    const { orderId, formattedPhone } = await createPendingOrder({
      customerId,
      customerName: name,
      phone,
      deliveryAddress,
      amount: pricedCart.totalAmount,
      paymentMethod: "cash",
      cart: pricedCart.cart,
    });

    void notifyCashOrderPlaced({
      orderId,
      phoneNumber: formattedPhone,
      customerName: name,
      totalAmount: pricedCart.totalAmount,
      deliveryAddress,
    }).catch((notificationError) => {
      console.error("Cash order notification failed:", notificationError);
    });

    return NextResponse.json({
      success: true,
      message:
        "Cash order placed successfully. Pay when your order is delivered or at pickup.",
      orderId,
    });
  } catch (error) {
    console.error("Cash checkout error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to place cash order.",
      },
      { status: 500 }
    );
  }
}
