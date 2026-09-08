import { normalizeKenyaPhone } from "@/lib/order-tracking";

export async function sendOrderSms(phoneNumber: string, message: string) {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME;
  const senderId = process.env.AFRICAS_TALKING_SENDER_ID;

  if (!apiKey || !username) {
    return {
      sent: false,
      channel: "sms" as const,
      reason: "Africa's Talking SMS is not configured",
    };
  }

  const to = normalizeKenyaPhone(phoneNumber);

  const body = new URLSearchParams({
    username,
    to,
    message,
  });

  if (senderId) {
    body.set("from", senderId);
  }

  try {
    const response = await fetch(
      "https://api.africastalking.com/version1/messaging",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          apiKey,
        },
        body: body.toString(),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Africa's Talking SMS failed:", data);
      return {
        sent: false,
        channel: "sms" as const,
        reason: "SMS request failed",
      };
    }

    return {
      sent: true,
      channel: "sms" as const,
      providerResponse: data,
    };
  } catch (error) {
    console.error("Africa's Talking SMS error:", error);
    return {
      sent: false,
      channel: "sms" as const,
      reason: "SMS request error",
    };
  }
}
