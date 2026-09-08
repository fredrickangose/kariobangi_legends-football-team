import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { customers } from "@/db/schema";
import {
  hashPassword,
  normalizeCustomerPhone,
  verifyCustomerToken,
  verifyPassword,
} from "@/lib/customer-auth";
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
        { success: false, error: "Phone number is required." },
        { status: 400 }
      );
    }

    if (!isValidKenyaPhone(phone)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid Kenyan phone number, e.g. 0712345678." },
        { status: 400 }
      );
    }

    const phoneNumber = normalizeCustomerPhone(phone);

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phoneNumber, phoneNumber))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "No account found for this phone number." },
        { status: 404 }
      );
    }

    if (!code || !newPassword) {
      const resetCode = generateResetCode();

      await storeResetCode({
        accountType: "customer",
        phoneNumber,
        customerId: customer.id,
        code: resetCode,
      });

      const smsResult = await sendOrderSms(
        phoneNumber,
        `Kariobangi Legends password reset code: ${resetCode}. Expires in 15 minutes.`
      );

      if (!smsResult.sent) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to send reset code by SMS right now. Check your phone number or try again later.",
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
      accountType: "customer",
      phoneNumber,
      code,
    });

    if (!codeValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset code." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await db
      .update(customers)
      .set({ passwordHash })
      .where(eq(customers.id, customer.id));

    await consumeResetCode({
      accountType: "customer",
      phoneNumber,
      code,
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can sign in now.",
    });
  } catch (error) {
    console.error("Customer reset password error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to reset password right now." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Please sign in to change your password." },
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

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    const currentValid = await verifyPassword(
      currentPassword,
      customer.passwordHash
    );

    if (!currentValid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await db
      .update(customers)
      .set({ passwordHash })
      .where(eq(customers.id, customer.id));

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Customer change password error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to change password right now." },
      { status: 500 }
    );
  }
}
