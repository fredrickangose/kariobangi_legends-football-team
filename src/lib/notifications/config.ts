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

export function isAfricasTalkingSandbox(): boolean {
  if (process.env.AFRICAS_TALKING_ENVIRONMENT?.trim().toLowerCase() === "sandbox") {
    return true;
  }

  return process.env.AFRICAS_TALKING_USERNAME?.trim().toLowerCase() === "sandbox";
}

export function getAfricasTalkingApiBaseUrl(): string {
  return isAfricasTalkingSandbox()
    ? "https://api.sandbox.africastalking.com"
    : "https://api.africastalking.com";
}

/** Sandbox ignores custom alphanumeric IDs — omit or use your sandbox shortcode. */
export function getAfricasTalkingSenderId(): string | undefined {
  if (isAfricasTalkingSandbox()) {
    const sandboxSender = process.env.AFRICAS_TALKING_SANDBOX_SENDER_ID?.trim();
    return sandboxSender || undefined;
  }

  const senderId = process.env.AFRICAS_TALKING_SENDER_ID?.trim();
  return senderId || undefined;
}

export function isMetaWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

export function isMetaWhatsAppTemplateConfigured(): boolean {
  return Boolean(getMetaWhatsAppTemplateName());
}

/** Meta Cloud API is ready to send outbound order updates (token + phone id + template). */
export function isMetaWhatsAppLive(): boolean {
  return isMetaWhatsAppConfigured() && isMetaWhatsAppTemplateConfigured();
}

export function getMetaWhatsAppApiVersion(): string {
  return process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";
}

export type WhatsAppProviderPreference = "meta" | "africas_talking" | "auto";

export function getWhatsAppProviderPreference(): WhatsAppProviderPreference {
  const raw = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();

  if (raw === "meta" || raw === "africas_talking") {
    return raw;
  }

  return "auto";
}

export function shouldUseMetaWhatsApp(): boolean {
  const preference = getWhatsAppProviderPreference();

  if (preference === "meta") {
    return true;
  }

  if (preference === "africas_talking") {
    return false;
  }

  return isMetaWhatsAppConfigured();
}

export function shouldUseAfricasTalkingWhatsApp(): boolean {
  const preference = getWhatsAppProviderPreference();

  if (preference === "meta") {
    return false;
  }

  if (preference === "africas_talking") {
    return isAfricasTalkingWhatsAppConfigured();
  }

  return isAfricasTalkingWhatsAppConfigured() && !isMetaWhatsAppConfigured();
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

export function getMetaWhatsAppTemplateName(): string | null {
  const name = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
  return name || null;
}

export function getAfricasTalkingWhatsAppTemplateId(): string | null {
  const templateId = process.env.WHATSAPP_AT_TEMPLATE_ID?.trim();
  return templateId || null;
}

export function getAfricasTalkingWhatsAppTemplateHeader(): string {
  return (
    process.env.WHATSAPP_AT_TEMPLATE_HEADER?.trim() ||
    "Kariobangi Legends FC"
  );
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
  if (shouldUseMetaWhatsApp() && isMetaWhatsAppConfigured()) {
    return "meta";
  }

  if (shouldUseAfricasTalkingWhatsApp()) {
    return "africas_talking";
  }

  if (isWhatsAppLogMode() && getWhatsAppBusinessPhone()) {
    return "log";
  }

  return null;
}

export function getOrderAdminPhones(): string[] {
  const raw =
    process.env.ORDER_ADMIN_PHONES ||
    process.env.ADMIN_RESET_PHONES ||
    process.env.ADMIN_RESET_PHONE ||
    "";

  return raw
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean);
}

export function isSmsLive(): boolean {
  return isSmsConfigured();
}

export function isWhatsAppLive(): boolean {
  if (shouldUseMetaWhatsApp()) {
    return isMetaWhatsAppLive();
  }

  if (shouldUseAfricasTalkingWhatsApp()) {
    return isAfricasTalkingWhatsAppConfigured();
  }

  return isMetaWhatsAppLive() || isAfricasTalkingWhatsAppConfigured();
}

/** True when at least one buyer notification channel can send real messages. */
export function isBuyerNotificationsLive(): boolean {
  const channels = getNotificationChannels();

  return (
    (channels.includes("sms") && isSmsLive()) ||
    (channels.includes("whatsapp") && isWhatsAppLive())
  );
}

export function getNotificationConfigSummary() {
  const channels = getNotificationChannels();
  const whatsappProvider = getWhatsAppProvider();
  const smsLive = isSmsLive();
  const whatsappLive = isWhatsAppLive();
  const adminPhones = getOrderAdminPhones();

  return {
    channels,
    sms: isSmsConfigured(),
    smsLive,
    whatsapp: isWhatsAppConfigured(),
    whatsappLive,
    whatsappPhone: getWhatsAppBusinessPhoneDisplay(),
    whatsappProvider,
    whatsappProviderPreference: getWhatsAppProviderPreference(),
    metaTemplateConfigured: isMetaWhatsAppTemplateConfigured(),
    whatsappLogMode: isWhatsAppLogMode() && !whatsappLive,
    trackingUrlConfigured: Boolean(getSiteBaseUrl()),
    buyerNotificationsLive: isBuyerNotificationsLive(),
    adminAlertPhones: adminPhones.length,
    adminAlertsLive:
      adminPhones.length > 0 &&
      ((channels.includes("sms") && smsLive) ||
        (channels.includes("whatsapp") && whatsappLive)),
  };
}
