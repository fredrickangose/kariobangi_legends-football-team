import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { asc, and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accountMessages, customers } from "@/db/schema";
import { verifyAdminToken } from "@/lib/admin-auth";

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("kariobangi_admin");

  if (!verifyAdminToken(adminCookie?.value)) {
    return null;
  }

  return true;
}

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customerIdParam = searchParams.get("customerId");

    if (customerIdParam) {
      const customerId = Number(customerIdParam);

      if (!Number.isFinite(customerId) || customerId <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid fan account selected." },
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
          { success: false, error: "Fan account not found." },
          { status: 404 }
        );
      }

      const messages = await db
        .select()
        .from(accountMessages)
        .where(eq(accountMessages.customerId, customerId))
        .orderBy(asc(accountMessages.createdAt));

      await db
        .update(accountMessages)
        .set({ isReadByAdmin: true })
        .where(
          and(
            eq(accountMessages.customerId, customerId),
            eq(accountMessages.senderType, "customer")
          )
        );

      return NextResponse.json({
        success: true,
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber,
          email: customer.email,
        },
        messages,
      });
    }

    const allMessages = await db
      .select({
        id: accountMessages.id,
        customerId: accountMessages.customerId,
        senderType: accountMessages.senderType,
        message: accountMessages.message,
        isReadByCustomer: accountMessages.isReadByCustomer,
        isReadByAdmin: accountMessages.isReadByAdmin,
        createdAt: accountMessages.createdAt,
        fullName: customers.fullName,
        phoneNumber: customers.phoneNumber,
        email: customers.email,
      })
      .from(accountMessages)
      .innerJoin(customers, eq(customers.id, accountMessages.customerId))
      .orderBy(desc(accountMessages.createdAt));

    const threadMap = new Map<
      number,
      {
        customerId: number;
        fullName: string;
        phoneNumber: string;
        email: string | null;
        lastMessage: string;
        lastMessageAt: Date;
        unreadCount: number;
      }
    >();

    for (const entry of allMessages) {
      const existing = threadMap.get(entry.customerId);

      if (!existing) {
        threadMap.set(entry.customerId, {
          customerId: entry.customerId,
          fullName: entry.fullName,
          phoneNumber: entry.phoneNumber,
          email: entry.email,
          lastMessage: entry.message,
          lastMessageAt: entry.createdAt,
          unreadCount:
            entry.senderType === "customer" && !entry.isReadByAdmin ? 1 : 0,
        });
        continue;
      }

      if (entry.senderType === "customer" && !entry.isReadByAdmin) {
        existing.unreadCount += 1;
      }
    }

    const threads = Array.from(threadMap.values()).sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );

    return NextResponse.json({
      success: true,
      threads,
    });
  } catch (error) {
    console.error("Admin messages GET error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load fan messages." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const customerId = Number(body.customerId);
    const message = String(body.message || "").trim();

    if (!Number.isFinite(customerId) || customerId <= 0) {
      return NextResponse.json(
        { success: false, error: "Select a fan account to reply to." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Reply cannot be empty." },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Reply is too long (max 2000 characters)." },
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
        { success: false, error: "Fan account not found." },
        { status: 404 }
      );
    }

    const [created] = await db
      .insert(accountMessages)
      .values({
        customerId,
        senderType: "admin",
        message,
        isReadByCustomer: false,
        isReadByAdmin: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Reply sent to the fan account.",
      entry: created,
    });
  } catch (error) {
    console.error("Admin messages POST error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to send reply right now." },
      { status: 500 }
    );
  }
}
