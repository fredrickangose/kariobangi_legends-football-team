import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createCustomerToken,
  verifyCustomerToken,
} from "@/lib/customer-auth";
import {
  parseAdminSession,
  refreshAdminToken,
  verifyAdminToken,
} from "@/lib/admin-auth";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session-config";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );
    const adminRole = parseAdminSession(
      cookieStore.get("kariobangi_admin")?.value
    );

    return NextResponse.json({
      success: true,
      customer: {
        authenticated: Boolean(customerId),
        id: customerId,
      },
      admin: {
        authenticated: Boolean(adminRole),
        role: adminRole,
      },
    });
  } catch (error) {
    console.error("Session status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to read session status.",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const customerCookie = cookieStore.get("kariobangi_customer")?.value;
    const adminCookie = cookieStore.get("kariobangi_admin")?.value;

    const customerId = verifyCustomerToken(customerCookie);
    const adminValid = verifyAdminToken(adminCookie);

    if (!customerId && !adminValid) {
      return NextResponse.json(
        { success: false, error: "No active session." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      customer: { refreshed: Boolean(customerId) },
      admin: { refreshed: adminValid },
    });

    if (customerId) {
      response.cookies.set("kariobangi_customer", createCustomerToken(customerId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
    }

    if (adminValid) {
      const refreshedToken = refreshAdminToken(adminCookie);
      if (refreshedToken) {
        response.cookies.set("kariobangi_admin", refreshedToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE_SECONDS,
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Session heartbeat error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to refresh session." },
      { status: 500 }
    );
  }
}
