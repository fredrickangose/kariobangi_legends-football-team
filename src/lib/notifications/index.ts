import {
  getNotificationChannels,
  getOrderTrackingUrl,
  isSmsConfigured,
  isWhatsAppConfigured,
} from "@/lib/notifications/config";
import { sendOrderSms } from "@/lib/notifications/sms";
import { sendOrderWhatsApp } from "@/lib/notifications/whatsapp";
import {
  getOrderStatusLabel,
  getPaymentConfirmedMessage,
  getOrderStatusMessage,
} from "@/lib/order-tracking";

export { getNotificationConfigSummary } from "@/lib/notifications/config";

export type OrderNotificationEvent =
  | "payment_confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

function buildOrderMessage(
  orderId: number,
  event: OrderNotificationEvent
): string {
  if (event === "payment_confirmed") {
    return getPaymentConfirmedMessage(orderId);
  }

  return getOrderStatusMessage(orderId, event);
}

export async function notifyBuyerOrderUpdate(
  phoneNumber: string,
  orderId: number,
  event: OrderNotificationEvent = "processing"
) {
  const channels = getNotificationChannels();
  const message = buildOrderMessage(orderId, event);
  const statusLabel = getOrderStatusLabel(
    event === "payment_confirmed" ? "processing" : event
  );
  const trackingUrl = getOrderTrackingUrl(orderId);
  const results = [];

  if (channels.includes("sms") && isSmsConfigured()) {
    results.push(await sendOrderSms(phoneNumber, message));
  }

  if (channels.includes("whatsapp") && isWhatsAppConfigured()) {
    results.push(
      await sendOrderWhatsApp(phoneNumber, message, {
        orderId: String(orderId),
        statusLabel,
        trackingUrl,
      })
    );
  }

  if (results.length === 0) {
    const configuredChannels = [
      channels.includes("sms") && isSmsConfigured() ? "sms" : null,
      channels.includes("whatsapp") && isWhatsAppConfigured()
        ? "whatsapp"
        : null,
    ].filter(Boolean);

    if (configuredChannels.length === 0) {
      console.log(
        `[Order notification skipped — not configured] Order #${orderId} (${event}): ${message}`
      );
    }

    return {
      sent: false,
      results,
      reason: "No notification channels are configured",
    };
  }

  const sent = results.some((result) => result.sent);

  if (sent) {
    console.log(
      `[Order notification sent] Order #${orderId} (${event}) via ${results
        .filter((result) => result.sent)
        .map((result) => result.channel)
        .join(", ")}`
    );
  }

  return {
    sent,
    results,
  };
}
