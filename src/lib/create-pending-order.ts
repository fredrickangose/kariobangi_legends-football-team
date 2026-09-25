import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { formatMpesaPhone } from "@/lib/mpesa-stk";
import type { CheckoutCartItem } from "@/lib/order-customization";

export async function createPendingOrder(input: {
  customerId: number;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  note?: string;
  amount: number;
  paymentMethod: "mpesa" | "cash";
  cart: CheckoutCartItem[];
}) {
  const formattedPhone = formatMpesaPhone(input.phone);
  if (!formattedPhone) {
    throw new Error("Invalid phone number. Use a number such as 0712345678.");
  }

  const [order] = await db
    .insert(orders)
    .values({
      customerId: input.customerId,
      customerName: input.customerName,
      phoneNumber: formattedPhone,
      totalAmount: Math.round(input.amount),
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      deliveryAddress: input.deliveryAddress,
      orderNote: input.note?.trim() || null,
    })
    .returning({ id: orders.id });

  if (!order) {
    throw new Error("Unable to create customer order.");
  }

  const itemsToInsert = input.cart.map((item) => ({
    orderId: order.id,
    merchandiseId: Number(item.merchId),
    productName: String(item.name || ""),
    size: String(item.size || ""),
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.price) || 0,
    itemCustomization: item.itemCustomization?.trim() || null,
  }));

  await db.insert(orderItems).values(itemsToInsert);

  return {
    orderId: order.id,
    formattedPhone,
  };
}
