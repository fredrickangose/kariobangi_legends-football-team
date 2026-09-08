import { normalizeKenyaPhone } from "@/lib/order-tracking";

export async function sendOrderWhatsApp(
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
