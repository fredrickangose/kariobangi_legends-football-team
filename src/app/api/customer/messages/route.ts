import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { asc, and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accountMessages, customers } from "@/db/schema";
import { verifyCustomerToken } from "@/lib/customer-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Please sign in to view your messages." },
        { status: 401 }
      );
    }

    const messages = await db
      .select()
      .from(accountMessages)
      .where(eq(accountMessages.customerId, customerId))
      .orderBy(asc(accountMessages.createdAt));

    await db
      .update(accountMessages)
      .set({ isReadByCustomer: true })
      .where(
        and(
          eq(accountMessages.customerId, customerId),
          eq(accountMessages.senderType, "admin")
        )
      );

    return NextResponse.json({
      success: true,
      messages: messages.map((entry) => ({
        id: entry.id,
        senderType: entry.senderType,
        message: entry.message,
        createdAt: entry.createdAt,
        isReadByCustomer: entry.isReadByCustomer,
        isReadByAdmin: entry.isReadByAdmin,
      })),
    });
  } catch (error) {
    console.error("Customer messages GET error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load your messages." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Please sign in to send a message." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message cannot be empty." },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Message is too long (max 2000 characters)." },
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

    const [created] = await db
      .insert(accountMessages)
      .values({
        customerId,
        senderType: "customer",
        message,
        isReadByCustomer: true,
        isReadByAdmin: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Message sent to the club admin.",
      entry: created,
    });
  } catch (error) {
    console.error("Customer messages POST error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to send your message right now." },
      { status: 500 }
    );
  }
}
