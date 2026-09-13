import { normalizeKenyaPhone } from "@/lib/order-tracking";

export type NotificationChannel = "sms" | "whatsapp";

/** Club WhatsApp Business number for order updates (0796230743). */
export const DEFAULT_WHATSAPP_BUSINESS_PHONE = "254796230743";

export function getNotificationChannels(): NotificationChannel[] {
  const raw = process.env.ORDER_NOTIFICATION_CHANNELS || "sms,whatsapp";

  return raw
    .split(",")
    .map((channel) => channel.trim().toLowerCase())
    .filter(
      (channel): channel is NotificationChannel =>
        channel === "sms" || channel === "whatsapp"
    );
}

function normalizeSiteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace(/\/$/, "");
  }

  return `https://${url.replace(/\/$/, "")}`;
}

export function getSiteBaseUrl(): string | null {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_URL;

  if (explicit) {
    return normalizeSiteUrl(explicit);
  }

  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  if (callbackUrl) {
    try {
      return new URL(callbackUrl).origin;
    } catch {
      return null;
    }
  }

  return null;
}

export function getOrderTrackingUrl(orderId: number): string | null {
  const baseUrl = getSiteBaseUrl();

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/?order=${orderId}`;
}

export function getWhatsAppBusinessPhone(): string {
  const raw =
    process.env.WHATSAPP_BUSINESS_PHONE || DEFAULT_WHATSAPP_BUSINESS_PHONE;

  return normalizeKenyaPhone(raw);
}

export function formatKenyaPhoneForDisplay(phone: string): string {
  const normalized = normalizeKenyaPhone(phone);

  if (normalized.startsWith("254") && normalized.length === 12) {
    return `0${normalized.slice(3)}`;
  }

  return phone;
}

export function getWhatsAppBusinessPhoneDisplay(): string {
  return formatKenyaPhoneForDisplay(getWhatsAppBusinessPhone());
}

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.AFRICAS_TALKING_API_KEY && process.env.AFRICAS_TALKING_USERNAME
  );
}

export function isMetaWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

export function isAfricasTalkingWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.AFRICAS_TALKING_API_KEY &&
      process.env.AFRICAS_TALKING_USERNAME &&
      getWhatsAppBusinessPhone()
  );
}

export function isWhatsAppLogMode(): boolean {
  return process.env.WHATSAPP_NOTIFY_MODE === "log";
}

export function isWhatsAppConfigured(): boolean {
  return (
    isMetaWhatsAppConfigured() ||
    isAfricasTalkingWhatsAppConfigured() ||
    (isWhatsAppLogMode() && Boolean(getWhatsAppBusinessPhone()))
  );
}

export function getWhatsAppProvider():
  | "meta"
  | "africas_talking"
  | "log"
  | null {
  if (isMetaWhatsAppConfigured()) {
    return "meta";
  }

  if (isAfricasTalkingWhatsAppConfigured()) {
    return "africas_talking";
  }

  if (isWhatsAppLogMode() && getWhatsAppBusinessPhone()) {
    return "log";
  }

  return null;
}

export function getNotificationConfigSummary() {
  const channels = getNotificationChannels();
  const whatsappProvider = getWhatsAppProvider();

  return {
    channels,
    sms: isSmsConfigured(),
    whatsapp: isWhatsAppConfigured(),
    whatsappPhone: getWhatsAppBusinessPhoneDisplay(),
    whatsappProvider,
    trackingUrlConfigured: Boolean(getSiteBaseUrl()),
  };
}
