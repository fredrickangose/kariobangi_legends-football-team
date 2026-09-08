import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  isAuthorizedAdminResetPhone,
  updateAdminPassword,
  verifyAdminPassword,
  verifyAdminToken,
} from "@/lib/admin-auth";
import {
  consumeResetCode,
  generateResetCode,
  storeResetCode,
  verifyResetCode,
} from "@/lib/password-reset";
import { isValidKenyaPhone } from "@/lib/order-tracking";
import { sendOrderSms } from "@/lib/notifications/sms";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body.phone || "").trim();
    const code = String(body.code || "").trim();
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Enter the authorized manager phone number." },
        { status: 400 }
      );
    }

    if (!isValidKenyaPhone(phone)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid Kenyan phone number, e.g. 0712345678." },
        { status: 400 }
      );
    }

    if (!isAuthorizedAdminResetPhone(phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "This phone number is not authorized for admin password reset.",
        },
        { status: 403 }
      );
    }

    if (!code || !newPassword) {
      const resetCode = generateResetCode();

      await storeResetCode({
        accountType: "admin",
        phoneNumber: phone,
        code: resetCode,
      });

      const smsResult = await sendOrderSms(
        phone,
        `Kariobangi Legends admin reset code: ${resetCode}. Expires in 15 minutes.`
      );

      if (!smsResult.sent) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to send reset code by SMS right now. Check SMS settings or contact support.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Reset code sent to your phone.",
        step: "confirm",
      });
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "New passwords do not match." },
        { status: 400 }
      );
    }

    const codeValid = await verifyResetCode({
      accountType: "admin",
      phoneNumber: phone,
      code,
    });

    if (!codeValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset code." },
        { status: 400 }
      );
    }

    await updateAdminPassword(newPassword);
    await consumeResetCode({
      accountType: "admin",
      phoneNumber: phone,
      code,
    });

    return NextResponse.json({
      success: true,
      message: "Admin password updated successfully. You can sign in now.",
    });
  } catch (error) {
    console.error("Admin reset password error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to reset admin password right now." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("kariobangi_admin");

    if (!verifyAdminToken(adminCookie?.value)) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current and new passwords are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "New passwords do not match." },
        { status: 400 }
      );
    }

    const currentValid = await verifyAdminPassword(currentPassword);

    if (!currentValid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    await updateAdminPassword(newPassword);

    return NextResponse.json({
      success: true,
      message: "Admin password changed successfully.",
    });
  } catch (error) {
    console.error("Admin change password error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to change admin password right now." },
      { status: 500 }
    );
  }
}
