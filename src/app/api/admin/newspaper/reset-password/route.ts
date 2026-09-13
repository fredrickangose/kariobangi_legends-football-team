import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  updateNewspaperPassword,
  verifyAdminPassword,
  verifyFullAdminToken,
} from "@/lib/admin-auth";

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("kariobangi_admin");

    if (!verifyFullAdminToken(adminCookie?.value)) {
      return NextResponse.json(
        { success: false, error: "Only a signed-in club admin can reset the press password." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const adminPassword = String(body.adminPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!adminPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Enter your admin password and the new press password." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New press password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "New press passwords do not match." },
        { status: 400 }
      );
    }

    const adminValid = await verifyAdminPassword(adminPassword);

    if (!adminValid) {
      return NextResponse.json(
        { success: false, error: "Admin password is incorrect." },
        { status: 401 }
      );
    }

    await updateNewspaperPassword(newPassword);

    return NextResponse.json({
      success: true,
      message: "Newspaper / press password updated successfully.",
    });
  } catch (error) {
    console.error("Newspaper reset password error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to reset newspaper password right now." },
      { status: 500 }
    );
  }
}
