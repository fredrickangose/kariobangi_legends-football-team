import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { createAdminToken, verifyAdminPassword } from "@/lib/admin-auth";
import { ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/session-config";
import {
  clearFailedAttempts,
  getClientIp,
  isRateLimited,
  recordFailedAttempt,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    if (await isRateLimited("admin_login", clientIp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many attempts. Please wait 15 minutes and try again.",
        },
        { status: 429 }
      );
    }

    const { password } = await request.json();
    const [settings] = await db.select().from(adminSettings).limit(1);
    const hasAdminAuth = Boolean(settings?.passwordHash || process.env.ADMIN_PASSWORD);

    if (!hasAdminAuth) {
      console.error("ADMIN_PASSWORD is not configured");

      return NextResponse.json(
        {
          success: false,
          error: "Sign in is not available right now.",
        },
        { status: 500 }
      );
    }

    if (!process.env.ADMIN_SESSION_SECRET) {
      console.error("ADMIN_SESSION_SECRET is not configured");

      return NextResponse.json(
        {
          success: false,
          error: "Sign in is not available right now.",
        },
        { status: 500 }
      );
    }

    const passwordValid = await verifyAdminPassword(String(password || ""));

    if (!passwordValid) {
      await recordFailedAttempt("admin_login", clientIp);

      return NextResponse.json(
        {
          success: false,
          error: "Incorrect password.",
        },
        { status: 401 }
      );
    }

    await clearFailedAttempts("admin_login", clientIp);

    const token = createAdminToken();

    const response = NextResponse.json({
      success: true,
      role: "admin",
      message: "Signed in successfully.",
    });

    response.cookies.set("kariobangi_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
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
