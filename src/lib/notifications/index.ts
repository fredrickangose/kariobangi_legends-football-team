import {
  getNotificationChannels,
  getOrderAdminPhones,
  getOrderTrackingUrl,
  isSmsConfigured,
  isWhatsAppLive,
  isWhatsAppLogMode,
} from "@/lib/notifications/config";
import { sendOrderSms } from "@/lib/notifications/sms";
import { sendOrderWhatsApp } from "@/lib/notifications/whatsapp";
import {
  getAdminCashOrderAlertMessage,
  getCashOrderPlacedMessage,
  getOrderStatusLabel,
  getPaymentConfirmedMessage,
  getOrderStatusMessage,
} from "@/lib/order-tracking";

export { getNotificationConfigSummary } from "@/lib/notifications/config";

export type OrderNotificationEvent =
  | "payment_confirmed"
  | "cash_order_placed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

function buildOrderMessage(
  orderId: number,
  event: OrderNotificationEvent,
  extras?: { totalAmount?: number }
): string {
  if (event === "payment_confirmed") {
    return getPaymentConfirmedMessage(orderId);
  }

  if (event === "cash_order_placed") {
    return getCashOrderPlacedMessage(orderId, extras?.totalAmount ?? 0);
  }

  return getOrderStatusMessage(orderId, event);
}

async function dispatchNotification(
  phoneNumber: string,
  message: string,
  templateValues?: {
    orderId: string;
    statusLabel: string;
    trackingUrl?: string | null;
  }
) {
  const channels = getNotificationChannels();
  const results = [];

  if (channels.includes("sms") && isSmsConfigured()) {
    results.push(await sendOrderSms(phoneNumber, message));
  }

  if (channels.includes("whatsapp")) {
    if (isWhatsAppLive()) {
      results.push(await sendOrderWhatsApp(phoneNumber, message, templateValues));
    } else if (isWhatsAppLogMode()) {
      results.push(
        await sendOrderWhatsApp(phoneNumber, message, templateValues, {
          logOnly: true,
        })
      );
    }
  }

  return results;
}

export async function notifyBuyerOrderUpdate(
  phoneNumber: string,
  orderId: number,
  event: OrderNotificationEvent = "processing",
  extras?: { totalAmount?: number }
) {
  const message = buildOrderMessage(orderId, event, extras);
  const statusLabel = getOrderStatusLabel(
    event === "payment_confirmed" || event === "cash_order_placed"
      ? "processing"
      : event
  );
  const trackingUrl = getOrderTrackingUrl(orderId);
  const channels = getNotificationChannels();
  const results = await dispatchNotification(phoneNumber, message, {
    orderId: String(orderId),
    statusLabel,
    trackingUrl,
  });

  if (results.length === 0) {
    const reason = channels.includes("whatsapp")
      ? "WhatsApp/SMS notifications are not live — add API keys and an approved WhatsApp template"
      : "No notification channels are configured";

    console.log(
      `[Order notification skipped — not configured] Order #${orderId} (${event}): ${message}`
    );

    return {
      sent: false,
      results,
      reason,
    };
  }

  const sent = results.some((result) => result.sent);
  const failureReasons = results
    .filter((result) => !result.sent)
    .map((result) => result.reason)
    .filter(Boolean);

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
    reason: sent
      ? undefined
      : failureReasons.join(" • ") ||
        (isWhatsAppLogMode()
          ? "WhatsApp is in log mode — message was printed in the server console only"
          : "Notification could not be delivered"),
  };
}

export async function notifyAdminOrderAlert(message: string) {
  const phones = getOrderAdminPhones();

  if (phones.length === 0) {
    console.log(`[Admin order alert skipped — no phones configured] ${message}`);
    return { sent: false, results: [], reason: "No admin alert phones configured" };
  }

  const allResults = [];

  for (const phone of phones) {
    const results = await dispatchNotification(phone, message);
    allResults.push(...results);
  }

  const sent = allResults.some((result) => result.sent);

  if (sent) {
    console.log(
      `[Admin order alert sent] via ${allResults
        .filter((result) => result.sent)
        .map((result) => result.channel)
        .join(", ")}`
    );
  } else {
    console.log(`[Admin order alert skipped — channels not live] ${message}`);
  }

  return { sent, results: allResults };
}

export async function notifyCashOrderPlaced(input: {
  orderId: number;
  phoneNumber: string;
  customerName: string;
  totalAmount: number;
  deliveryAddress?: string | null;
}) {
  const [buyerResult, adminResult] = await Promise.all([
    notifyBuyerOrderUpdate(input.phoneNumber, input.orderId, "cash_order_placed", {
      totalAmount: input.totalAmount,
    }),
    notifyAdminOrderAlert(
      getAdminCashOrderAlertMessage({
        orderId: input.orderId,
        customerName: input.customerName,
        totalAmount: input.totalAmount,
        phoneNumber: input.phoneNumber,
        deliveryAddress: input.deliveryAddress,
      })
    ),
  ]);

  return {
    buyer: buyerResult,
    admin: adminResult,
  };
}
