export const MEMBER_SHOP_DISCOUNT_PERCENT = 10;

export const MEMBERSHIP_PLANS = [
  {
    id: "youth",
    name: "Youth Fan",
    price: 500,
    blurb: "For young supporters. Digital card and 10% shop perk for one year.",
  },
  {
    id: "official",
    name: "Official Fan",
    price: 1500,
    blurb: "Full supporter membership. Digital card and 10% off shop kits for one year.",
  },
] as const;

export type MembershipPlanId = (typeof MEMBERSHIP_PLANS)[number]["id"];

export type FanMembership = {
  id: number;
  planId: MembershipPlanId;
  planName: string;
  amount: number;
  expiresAt: string;
  mpesaReceiptNumber: string | null;
};

export function getMembershipPlan(planId: string) {
  return MEMBERSHIP_PLANS.find((plan) => plan.id === planId) ?? null;
}

export function applyMemberUnitPrice(price: number) {
  return Math.round(price * (1 - MEMBER_SHOP_DISCOUNT_PERCENT / 100));
}

export function isMembershipActive(expiresAt: string | Date | null | undefined) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

export function formatMembershipExpiry(expiresAt: string | Date) {
  return new Date(expiresAt).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type AdminMembershipStatus =
  | "active"
  | "expired"
  | "pending"
  | "failed"
  | "revoked";

export function getAdminMembershipStatus(
  paymentStatus: string,
  expiresAt: string | Date
): AdminMembershipStatus {
  if (paymentStatus === "revoked") return "revoked";
  if (paymentStatus === "pending") return "pending";
  if (paymentStatus === "failed") return "failed";
  if (paymentStatus === "paid" && isMembershipActive(expiresAt)) return "active";
  if (paymentStatus === "paid") return "expired";
  return "failed";
}
