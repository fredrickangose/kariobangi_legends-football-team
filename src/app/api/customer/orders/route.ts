import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { customers, orderItems, orders } from "@/db/schema";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { getPhoneLookupVariants, linkOrdersToCustomer } from "@/lib/link-customer-orders";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Please sign in to view your orders.",
          orders: [],
        },
        { status: 401 }
      );
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Account not found.",
          orders: [],
        },
        { status: 404 }
      );
    }

    await linkOrdersToCustomer(customer.id, customer.phoneNumber);

    const phoneVariants = getPhoneLookupVariants(customer.phoneNumber);

    const orderList = await db
      .select()
      .from(orders)
      .where(
        or(
          eq(orders.customerId, customer.id),
          ...phoneVariants.map((phone) => eq(orders.phoneNumber, phone))
        )
      )
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      orderList.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items,
        };
      })
    );

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
      },
      orders: ordersWithItems,
    });
  } catch (error) {
    console.error("Customer orders API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load your orders.",
        orders: [],
      },
      { status: 500 }
    );
  }
}
