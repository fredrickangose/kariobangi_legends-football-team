import { normalizeKenyaPhone } from "@/lib/order-tracking";
import {
  getWhatsAppBusinessPhone,
  isAfricasTalkingWhatsAppConfigured,
  isMetaWhatsAppConfigured,
  isWhatsAppLogMode,
} from "@/lib/notifications/config";

function toInternationalPhone(phone: string): string {
  const normalized = normalizeKenyaPhone(phone);
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}

async function sendViaMetaCloudApi(
  phoneNumber: string,
  message: string,
  templateValues?: {
    orderId: string;
    statusLabel: string;
    trackingUrl?: string | null;
  }
) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;

  if (!accessToken || !phoneNumberId) {
    return {
      sent: false,
      channel: "whatsapp" as const,
      reason: "WhatsApp Cloud API is not configured",
    };
  }

  const to = normalizeKenyaPhone(phoneNumber);

  const payload =
    templateName && templateValues
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
            },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: templateValues.orderId },
                  { type: "text", text: templateValues.statusLabel },
                  {
                    type: "text",
                    text: templateValues.trackingUrl || "our website shop page",
                  },
                ],
              },
            ],
          },
        }
      : {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: {
            body: message,
          },
        };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("WhatsApp notification failed:", data);
      return {
        sent: false,
        channel: "whatsapp" as const,
        reason: "WhatsApp request failed",
      };
    }

    return {
      sent: true,
      channel: "whatsapp" as const,
      provider: "meta" as const,
      providerResponse: data,
    };
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return {
      sent: false,
      channel: "whatsapp" as const,
      reason: "WhatsApp request error",
    };
  }
}

async function sendViaAfricasTalking(
  phoneNumber: string,
  message: string
) {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME;
  const waNumber = getWhatsAppBusinessPhone();

  if (!apiKey || !username || !waNumber) {
    return {
      sent: false,
      channel: "whatsapp" as const,
      reason: "Africa's Talking WhatsApp is not configured",
    };
  }

  try {
    const response = await fetch(
      "https://chat.africastalking.com/whatsapp/message/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          apiKey,
        },
        body: JSON.stringify({
          username,
          waNumber: toInternationalPhone(waNumber),
          phoneNumber: toInternationalPhone(phoneNumber),
          body: {
            message,
          },
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Africa's Talking WhatsApp failed:", data);
      return {
        sent: false,
        channel: "whatsapp" as const,
        reason: "WhatsApp request failed",
        providerResponse: data,
      };
    }

    return {
      sent: true,
      channel: "whatsapp" as const,
      provider: "africas_talking" as const,
      providerResponse: data,
    };
  } catch (error) {
    console.error("Africa's Talking WhatsApp error:", error);
    return {
      sent: false,
      channel: "whatsapp" as const,
      reason: "WhatsApp request error",
    };
  }
}

export async function sendOrderWhatsApp(
  phoneNumber: string,
  message: string,
  templateValues?: {
    orderId: string;
    statusLabel: string;
    trackingUrl?: string | null;
  }
) {
  if (
    isWhatsAppLogMode() &&
    !isMetaWhatsAppConfigured() &&
    !isAfricasTalkingWhatsAppConfigured()
  ) {
    console.log(
      `[WhatsApp from ${getWhatsAppBusinessPhone()} → ${toInternationalPhone(phoneNumber)}] ${message}`
    );

    return {
      sent: true,
      channel: "whatsapp" as const,
      provider: "log" as const,
    };
  }

  if (isMetaWhatsAppConfigured()) {
    const metaResult = await sendViaMetaCloudApi(
      phoneNumber,
      message,
      templateValues
    );

    if (metaResult.sent) {
      return metaResult;
    }
  }

  if (isAfricasTalkingWhatsAppConfigured()) {
    return sendViaAfricasTalking(phoneNumber, message);
  }

  return {
    sent: false,
    channel: "whatsapp" as const,
    reason: "WhatsApp is not configured",
  };
}
