export type NotificationChannel = "sms" | "whatsapp";

export function getNotificationChannels(): NotificationChannel[] {
  const raw = process.env.ORDER_NOTIFICATION_CHANNELS || "sms";

  return raw
    .split(",")
    .map((channel) => channel.trim().toLowerCase())
    .filter(
      (channel): channel is NotificationChannel =>
        channel === "sms" || channel === "whatsapp"
    );
}

export function getSiteBaseUrl(): string | null {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_URL;

  if (!url) {
    return null;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace(/\/$/, "");
  }

  return `https://${url.replace(/\/$/, "")}`;
}

export function getOrderTrackingUrl(orderId: number): string | null {
  const baseUrl = getSiteBaseUrl();

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/?order=${orderId}`;
}

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.AFRICAS_TALKING_API_KEY && process.env.AFRICAS_TALKING_USERNAME
  );
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

export function getNotificationConfigSummary() {
  const channels = getNotificationChannels();

  return {
    channels,
    sms: isSmsConfigured(),
    whatsapp: isWhatsAppConfigured(),
    trackingUrlConfigured: Boolean(getSiteBaseUrl()),
  };
}
