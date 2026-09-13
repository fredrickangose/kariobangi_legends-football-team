import { NextResponse } from "next/server";
import {
  createAdminToken,
  verifyNewspaperLogin,
} from "@/lib/admin-auth";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session-config";

export async function POST(request: Request) {
  try {
    if (!process.env.ADMIN_SESSION_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin session security is not configured.",
        },
        { status: 500 }
      );
    }

    const { username, password } = await request.json();
    const passwordValid = await verifyNewspaperLogin(
      String(username || ""),
      String(password || "")
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Incorrect newspaper username or password.",
        },
        { status: 401 }
      );
    }

    const token = createAdminToken("news_editor");
    const response = NextResponse.json({
      success: true,
      role: "news_editor",
      message: "Successfully authenticated as Newspaper / Press account.",
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
    console.error("Newspaper login error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to authenticate newspaper account.",
      },
      { status: 500 }
    );
  }
}
