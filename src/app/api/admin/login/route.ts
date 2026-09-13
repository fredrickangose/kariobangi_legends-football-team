import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { createAdminToken, verifyAdminPassword } from "@/lib/admin-auth";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session-config";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const [settings] = await db.select().from(adminSettings).limit(1);
    const hasAdminAuth = Boolean(settings?.passwordHash || process.env.ADMIN_PASSWORD);

    if (!hasAdminAuth) {
      console.error("ADMIN_PASSWORD is not configured");

      return NextResponse.json(
        {
          success: false,
          error: "Admin authentication is not configured.",
        },
        { status: 500 }
      );
    }

    if (!process.env.ADMIN_SESSION_SECRET) {
      console.error("ADMIN_SESSION_SECRET is not configured");

      return NextResponse.json(
        {
          success: false,
          error: "Admin session security is not configured.",
        },
        { status: 500 }
      );
    }

    const passwordValid = await verifyAdminPassword(String(password || ""));

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Incorrect password.",
        },
        { status: 401 }
      );
    }

    const token = createAdminToken();

    const response = NextResponse.json({
      success: true,
      role: "admin",
      message: "Successfully authenticated as Admin Manager.",
    });

    response.cookies.set("kariobangi_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to authenticate.",
      },
      { status: 500 }
    );
  }
}
