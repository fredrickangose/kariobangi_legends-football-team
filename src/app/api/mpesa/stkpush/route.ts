import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { verifyCustomerToken } from "@/lib/customer-auth";

function getTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone = String(body.phone || "").trim();
    const amount = Number(body.amount);
    const name = String(body.name || "").trim();
    const cart = Array.isArray(body.cart) ? body.cart : [];

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer name is required.",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "M-PESA phone number is required.",
        },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid payment amount is required.",
        },
        { status: 400 }
      );
    }

    if (cart.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Your cart is empty.",
        },
        { status: 400 }
      );
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const environment =
      process.env.MPESA_ENVIRONMENT || "sandbox";

    if (
      !consumerKey ||
      !consumerSecret ||
      !shortcode ||
      !passkey
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "M-PESA environment variables are missing.",
        },
        { status: 500 }
      );
    }

    const baseUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    console.log("M-PESA environment:", environment);
    console.log("M-PESA base URL:", baseUrl);
    console.log("M-PESA shortcode:", shortcode);

    // --------------------------------------------------
    // 1. FORMAT PHONE NUMBER
    // --------------------------------------------------

    let formattedPhone = phone.replace(/\s+/g, "");

    if (formattedPhone.startsWith("+254")) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("254")) {
      // Already correctly formatted
    } else if (formattedPhone.startsWith("0")) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid M-PESA phone number. Use a number such as 0712345678.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. CREATE PENDING ORDER
    // --------------------------------------------------

    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    const [order] = await db
      .insert(orders)
      .values({
        customerId: customerId ?? null,
        customerName: name,
        phoneNumber: formattedPhone,
        totalAmount: Math.round(amount),
        paymentMethod: "mpesa",
        paymentStatus: "pending",
      })
      .returning({
        id: orders.id,
      });

    if (!order) {
      throw new Error("Unable to create customer order.");
    }

    console.log("Created pending order:", order.id);

    // --------------------------------------------------
    // 3. SAVE ORDER ITEMS
    // --------------------------------------------------

    const itemsToInsert = cart.map((item: any) => ({
      orderId: order.id,
      merchandiseId: Number(item.merchId),
      productName: String(item.name || ""),
      size: String(item.size || ""),
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.price) || 0,
    }));

    await db.insert(orderItems).values(itemsToInsert);

    console.log(
      "Saved order items for order:",
      order.id
    );

    // --------------------------------------------------
    // 4. GET M-PESA ACCESS TOKEN
    // --------------------------------------------------

    const credentials = Buffer.from(
      `${consumerKey}:${consumerSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const tokenText = await tokenResponse.text();

    console.log(
      "M-PESA token HTTP status:",
      tokenResponse.status
    );

    console.log(
      "M-PESA token content-type:",
      tokenResponse.headers.get("content-type")
    );

    console.log(
      "M-PESA token response:",
      tokenText
    );

    let tokenData: any;

    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Safaricom returned a non-JSON response while generating the access token.",
          status: tokenResponse.status,
        },
        { status: 502 }
      );
    }

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            tokenData.errorMessage ||
            tokenData.error_description ||
            "Unable to obtain M-PESA access token.",
          details: tokenData,
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 5. PREPARE STK PUSH
    // --------------------------------------------------

    const timestamp = getTimestamp();

    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString("base64");

    const callbackUrl =
      process.env.MPESA_CALLBACK_URL;

    if (!callbackUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "MPESA_CALLBACK_URL is missing from .env",
        },
        { status: 500 }
      );
    }

    console.log(
      "M-PESA callback URL:",
      callbackUrl
    );

    // --------------------------------------------------
    // 6. SEND STK PUSH
    // --------------------------------------------------

    const stkResponse = await fetch(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(amount),
          PartyA: formattedPhone,
          PartyB: shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: `KL-${order.id}`,
          TransactionDesc: name
            ? `Kariobangi Legends order - ${name}`
            : "Kariobangi Legends order",
        }),
      }
    );

    const stkText = await stkResponse.text();

    console.log(
      "M-PESA STK HTTP status:",
      stkResponse.status
    );

    console.log(
      "M-PESA STK content-type:",
      stkResponse.headers.get("content-type")
    );

    console.log(
      "M-PESA STK response:",
      stkText
    );

    let stkData: any;

    try {
      stkData = JSON.parse(stkText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Safaricom returned a non-JSON response for the STK Push request.",
          status: stkResponse.status,
          response: stkText.substring(0, 1000),
        },
        { status: 502 }
      );
    }

    // --------------------------------------------------
    // 7. HANDLE FAILED STK REQUEST
    // --------------------------------------------------

    if (
      !stkResponse.ok ||
      stkData.ResponseCode !== "0"
    ) {
      await db
        .update(orders)
        .set({
          paymentStatus: "failed",
        })
        .where(
          require("drizzle-orm").eq(
            orders.id,
            order.id
          )
        );

      return NextResponse.json(
        {
          success: false,
          error:
            stkData.errorMessage ||
            stkData.ResponseDescription ||
            "M-PESA STK Push could not be initiated.",
          details: stkData,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 8. SAVE M-PESA REQUEST IDs
    // --------------------------------------------------

    await db
      .update(orders)
      .set({
        merchantRequestId:
          stkData.MerchantRequestID || null,

        checkoutRequestId:
          stkData.CheckoutRequestID || null,
      })
      .where(
        require("drizzle-orm").eq(
          orders.id,
          order.id
        )
      );

    console.log(
      "M-PESA request IDs saved for order:",
      order.id
    );

    // --------------------------------------------------
    // 9. RETURN TO FRONTEND
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        "M-PESA payment request sent successfully. Please check your phone.",

      orderId: order.id,

      merchantRequestID:
        stkData.MerchantRequestID,

      checkoutRequestID:
        stkData.CheckoutRequestID,

      responseCode:
        stkData.ResponseCode,

      responseDescription:
        stkData.ResponseDescription,
    });
  } catch (error) {
    console.error(
      "M-PESA STK Push error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected M-PESA payment error.",
      },
      { status: 500 }
    );
  }
}