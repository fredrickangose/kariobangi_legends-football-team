import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import {
  getMembershipPlan,
  isMembershipActive,
  type FanMembership,
  type MembershipPlanId,
} from "@/lib/membership";

export async function findActivePaidMembership(
  customerId: number
): Promise<FanMembership | null> {
  const rows = await db
    .select()
    .from(memberships)
    .where(
      and(eq(memberships.customerId, customerId), eq(memberships.paymentStatus, "paid"))
    )
    .orderBy(desc(memberships.expiresAt), desc(memberships.id))
    .limit(8);

  const active = rows.find((row) => isMembershipActive(row.expiresAt));
  if (!active) return null;

  const plan = getMembershipPlan(active.planId);

  return {
    id: active.id,
    planId: (plan?.id ?? active.planId) as MembershipPlanId,
    planName: plan?.name ?? "Official Fan",
    amount: active.amount,
    expiresAt: active.expiresAt.toISOString(),
    mpesaReceiptNumber: active.mpesaReceiptNumber,
  };
}
