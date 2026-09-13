import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parseAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const role = parseAdminSession(cookieStore.get("kariobangi_admin")?.value);

    return NextResponse.json({
      success: true,
      authenticated: Boolean(role),
      role,
    });
  } catch (error) {
    console.error("Admin session error:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        role: null,
        error: "Unable to verify admin session.",
      },
      { status: 500 }
    );
  }
}
