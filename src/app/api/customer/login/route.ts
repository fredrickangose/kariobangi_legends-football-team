import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createCustomerToken,
  normalizeCustomerPhone,
  verifyPassword,
} from "@/lib/customer-auth";
import { linkOrdersToCustomer } from "@/lib/link-customer-orders";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session-config";
import { isValidKenyaPhone } from "@/lib/order-tracking";

function getSessionSecret() {
  return process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
}

export async function POST(request: Request) {
  try {
    if (!getSessionSecret()) {
      console.error("CUSTOMER_SESSION_SECRET / ADMIN_SESSION_SECRET is not configured");

      return NextResponse.json(
        {
          success: false,
          error: "Account sign-in is not configured on the server yet.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");

    if (!phone || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number and password are required.",
        },
        { status: 400 }
      );
    }

    const phoneNumber = normalizeCustomerPhone(phone);

    if (!isValidKenyaPhone(phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid Kenyan phone number, e.g. 0712345678.",
        },
        { status: 400 }
      );
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phoneNumber, phoneNumber))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "No account found for this phone number.",
        },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, customer.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Incorrect password.",
        },
        { status: 401 }
      );
    }

    await linkOrdersToCustomer(customer.id, phoneNumber);

    const token = createCustomerToken(customer.id);

    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
      },
      message: "Signed in successfully.",
    });

    response.cookies.set("kariobangi_customer", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Customer login error:", error);

    const message =
      error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes('relation "customers" does not exist')) {
      return NextResponse.json(
        {
          success: false,
          error: "Account storage is not ready yet. Run npm run db:push, then try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to sign in right now.",
      },
      { status: 500 }
    );
  }
}
