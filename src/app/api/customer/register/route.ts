import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createCustomerToken,
  hashPassword,
  normalizeCustomerPhone,
} from "@/lib/customer-auth";
import { linkOrdersToCustomer } from "@/lib/link-customer-orders";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session-config";
import { clearAdminSessionCookie } from "@/lib/session-exclusive";
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
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!fullName || !phone || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, phone number, and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 6 characters.",
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

    const [existingCustomer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.phoneNumber, phoneNumber))
      .limit(1);

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this phone number already exists. Please sign in.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [customer] = await db
      .insert(customers)
      .values({
        fullName,
        phoneNumber,
        email: email || null,
        passwordHash,
      })
      .returning({
        id: customers.id,
        fullName: customers.fullName,
        phoneNumber: customers.phoneNumber,
        email: customers.email,
      });

    if (!customer) {
      throw new Error("Unable to create customer account.");
    }

    await linkOrdersToCustomer(customer.id, phoneNumber);

    const token = createCustomerToken(customer.id);

    const response = NextResponse.json({
      success: true,
      customer,
      message: "Account created successfully.",
    });

    response.cookies.set("kariobangi_customer", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    clearAdminSessionCookie(response);

    return response;
  } catch (error) {
    console.error("Customer register error:", error);

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
        error: "Unable to create account right now.",
      },
      { status: 500 }
    );
  }
}
