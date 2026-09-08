import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = verifyAdminToken(
      cookieStore.get("kariobangi_admin")?.value
    );

    return NextResponse.json({
      success: true,
      authenticated,
    });
  } catch (error) {
    console.error("Admin session error:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Unable to verify admin session.",
      },
      { status: 500 }
    );
  }
}
