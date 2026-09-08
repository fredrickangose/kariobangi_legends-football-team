import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

export async function linkOrdersToCustomer(
  customerId: number,
  phoneNumber: string
) {
  const localPhone = phoneNumber.startsWith("254")
    ? `0${phoneNumber.slice(3)}`
    : phoneNumber;

  await db
    .update(orders)
    .set({ customerId })
    .where(
      and(
        or(
          eq(orders.phoneNumber, phoneNumber),
          eq(orders.phoneNumber, localPhone)
        ),
        isNull(orders.customerId)
      )
    );
}

export function getPhoneLookupVariants(phoneNumber: string): string[] {
  const localPhone = phoneNumber.startsWith("254")
    ? `0${phoneNumber.slice(3)}`
    : phoneNumber;

  return phoneNumber === localPhone
    ? [phoneNumber]
    : [phoneNumber, localPhone];
}
