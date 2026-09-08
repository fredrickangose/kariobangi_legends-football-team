import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyCustomerToken } from "@/lib/customer-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    if (!customerId) {
      return NextResponse.json({
        success: true,
        authenticated: false,
      });
    }

    const [customer] = await db
      .select({
        id: customers.id,
        fullName: customers.fullName,
        phoneNumber: customers.phoneNumber,
        email: customers.email,
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({
        success: true,
        authenticated: false,
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      customer,
    });
  } catch (error) {
    console.error("Customer session error:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Unable to verify account session.",
      },
      { status: 500 }
    );
  }
}
