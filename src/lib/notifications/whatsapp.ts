import { normalizeKenyaPhone } from "@/lib/order-tracking";
import {
  getAfricasTalkingWhatsAppTemplateHeader,
  getAfricasTalkingWhatsAppTemplateId,
  getMetaWhatsAppApiVersion,
  getMetaWhatsAppTemplateName,
  getWhatsAppBusinessPhone,
  isAfricasTalkingWhatsAppConfigured,
  isMetaWhatsAppConfigured,
  isMetaWhatsAppTemplateConfigured,
  isWhatsAppLogMode,
  shouldUseAfricasTalkingWhatsApp,
  shouldUseMetaWhatsApp,
} from "@/lib/notifications/config";

function toInternationalPhone(phone: string): string {
  const normalized = normalizeKenyaPhone(phone);
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}

function extractMetaError(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "WhatsApp request failed";
  }

  const error = (data as { error?: { message?: string; error_user_msg?: string } }).error;

  return (
    error?.error_user_msg ||
    error?.message ||
    "WhatsApp request failed"
  );
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
  const templateName = getMetaWhatsAppTemplateName();
  const apiVersion = getMetaWhatsAppApiVersion();

  if (!accessToken || !phoneNumberId) {
    return {
      sent: false,
      channel: "whatsapp" as const,
      reason:
        "Meta Cloud API is not configured — set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID",
    };
  }

  if (templateValues && !templateName) {
    return {
      sent: false,
      channel: "whatsapp" as const,
      reason:
        "Meta outbound messages require an approved template — set WHATSAPP_TEMPLATE_NAME in .env",
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
                    text: templateValues.trackingUrl || "Visit our website shop page",
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
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
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
      const reason = extractMetaError(data);
      console.error("Meta WhatsApp notification failed:", data);
      return {
        sent: false,
        channel: "whatsapp" as const,
        reason,
        providerResponse: data,
      };
    }

    return {
      sent: true,
      channel: "whatsapp" as const,
      provider: "meta" as const,
      providerResponse: data,
    };
  } catch (error) {
    console.error("Meta WhatsApp notification error:", error);
    return {
      sent: false,
      channel: "whatsapp" as const,
      reason: "WhatsApp request error",
    };
  }
}

async function sendViaAfricasTalking(
  phoneNumber: string,
  message: string,
  templateValues?: {
    orderId: string;
    statusLabel: string;
    trackingUrl?: string | null;
  }
) {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME;
  const waNumber = getWhatsAppBusinessPhone();
  const templateId = getAfricasTalkingWhatsAppTemplateId();

  if (!apiKey || !username || !waNumber) {
    return {
      sent: false,
      channel: "whatsapp" as const,
      reason: "Africa's Talking WhatsApp is not configured",
    };
  }

  const body =
    templateId && templateValues
      ? {
          templateId,
          headerValue: getAfricasTalkingWhatsAppTemplateHeader(),
          bodyValues: [
            templateValues.orderId,
            templateValues.statusLabel,
            templateValues.trackingUrl || "Visit our website shop page",
          ],
        }
      : {
          message,
        };

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
          body,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Africa's Talking WhatsApp failed:", data);
      return {
        sent: false,
        channel: "whatsapp" as const,
        reason:
          !templateId && templateValues
            ? "WhatsApp request failed — set WHATSAPP_AT_TEMPLATE_ID for outbound order updates"
            : "WhatsApp request failed",
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
  },
  options?: {
    logOnly?: boolean;
  }
) {
  const metaReady = isMetaWhatsAppConfigured();
  const metaLive = metaReady && isMetaWhatsAppTemplateConfigured();

  if (
    options?.logOnly ||
    (isWhatsAppLogMode() &&
      process.env.WHATSAPP_NOTIFY_MODE !== "live" &&
      !metaLive &&
      !isAfricasTalkingWhatsAppConfigured())
  ) {
    console.log(
      `[WhatsApp from ${getWhatsAppBusinessPhone()} → ${toInternationalPhone(phoneNumber)}] ${message}`
    );

    return {
      sent: false,
      channel: "whatsapp" as const,
      provider: "log" as const,
      reason:
        "WhatsApp is in log mode — message was printed in the server console only",
      logged: true,
    };
  }

  if (shouldUseMetaWhatsApp() && metaReady) {
    const metaResult = await sendViaMetaCloudApi(
      phoneNumber,
      message,
      templateValues
    );

    if (metaResult.sent) {
      return metaResult;
    }

    if (!shouldUseAfricasTalkingWhatsApp()) {
      return metaResult;
    }

    console.error(
      "Meta WhatsApp failed, trying Africa's Talking fallback:",
      metaResult.reason
    );
  }

  if (shouldUseAfricasTalkingWhatsApp()) {
    const atResult = await sendViaAfricasTalking(
      phoneNumber,
      message,
      templateValues
    );

    if (atResult.sent) {
      return atResult;
    }

    if (!getAfricasTalkingWhatsAppTemplateId() && templateValues) {
      return {
        ...atResult,
        reason:
          atResult.reason ||
          "Outbound WhatsApp needs an approved template — set WHATSAPP_AT_TEMPLATE_ID in .env",
      };
    }

    return atResult;
  }

  if (shouldUseMetaWhatsApp()) {
    return {
      sent: false,
      channel: "whatsapp" as const,
      reason:
        "Meta Cloud API is not configured — set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_TEMPLATE_NAME",
    };
  }

  return {
    sent: false,
    channel: "whatsapp" as const,
    reason: "WhatsApp is not configured",
  };
}
