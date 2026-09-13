import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureDatabaseSchema } from "@/db";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { findActivePaidMembership } from "@/lib/membership-server";

export async function GET() {
  try {
    await ensureDatabaseSchema();

    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    if (!customerId) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        membership: null,
      });
    }

    const membership = await findActivePaidMembership(customerId);

    return NextResponse.json({
      success: true,
      authenticated: true,
      membership,
    });
  } catch (error) {
    console.error("Customer membership error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to load membership.",
      },
      { status: 500 }
    );
  }
}
