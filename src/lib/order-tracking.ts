export const ORDER_FULFILLMENT_STEPS = [
  {
    key: "processing",
    label: "Order Received",
    description: "Payment confirmed. Our team is preparing your merchandise.",
  },
  {
    key: "shipped",
    label: "Shipped / Dispatched",
    description: "Your order is on the way or ready for pickup.",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Your order has reached you. Thank you for supporting the Legends!",
  },
] as const;

import { getOrderTrackingUrl } from "@/lib/notifications/config";

export type OrderFulfillmentStatus =
  | (typeof ORDER_FULFILLMENT_STEPS)[number]["key"]
  | "cancelled";

export function normalizeKenyaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
}

export function isValidKenyaPhone(phone: string): boolean {
  const normalized = normalizeKenyaPhone(phone);
  return /^254[17]\d{8}$/.test(normalized);
}

export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return "Processing";
  }
}

export function getPaymentConfirmedMessage(orderId: number): string {
  const trackingUrl = getOrderTrackingUrl(orderId);
  const trackingText = trackingUrl
    ? `Track here: ${trackingUrl}`
    : "Track your order on our website shop page.";

  return `Kariobangi Legends FC: Payment received for order #${orderId}. We are preparing your merchandise. ${trackingText} Asante!`;
}

export function getOrderStatusMessage(orderId: number, status: string): string {
  const label = getOrderStatusLabel(status);
  const trackingUrl = getOrderTrackingUrl(orderId);
  const trackingText = trackingUrl
    ? `Track here: ${trackingUrl}`
    : "Track progress on our website shop page.";

  return `Kariobangi Legends FC: Your order #${orderId} is now ${label.toUpperCase()}. ${trackingText} Asante for your support!`;
}

export function getFulfillmentStepIndex(status: string): number {
  if (status === "cancelled") {
    return -1;
  }

  const index = ORDER_FULFILLMENT_STEPS.findIndex((step) => step.key === status);
  return index >= 0 ? index : 0;
}
