import {
  getAfricasTalkingApiBaseUrl,
  getAfricasTalkingSenderId,
  isAfricasTalkingSandbox,
} from "@/lib/notifications/config";
import { normalizeKenyaPhone } from "@/lib/order-tracking";

type AfricasTalkingRecipient = {
  number?: string;
  status?: string;
  statusCode?: number;
  messageId?: string;
  cost?: string;
};

type AfricasTalkingSmsResponse = {
  SMSMessageData?: {
    Message?: string;
    Recipients?: AfricasTalkingRecipient[];
  };
};

function extractSmsFailure(
  data: AfricasTalkingSmsResponse,
  fallback: string
): string {
  const recipients = data.SMSMessageData?.Recipients ?? [];
  const failed = recipients.find(
    (recipient) =>
      recipient.status &&
      recipient.status.toLowerCase() !== "success" &&
      recipient.statusCode !== 101
  );

  if (failed?.status) {
    return `SMS ${failed.status}${failed.number ? ` (${failed.number})` : ""}`;
  }

  const apiMessage = data.SMSMessageData?.Message?.trim();
  if (apiMessage) {
    return apiMessage;
  }

  return fallback;
}

export async function sendOrderSms(phoneNumber: string, message: string) {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME;

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
    message: message.replace(/\r?\n/g, "\r\n"),
  });

  const senderId = getAfricasTalkingSenderId();
  if (senderId) {
    body.set("from", senderId);
  }

  const baseUrl = getAfricasTalkingApiBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/version1/messaging`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey,
      },
      body: body.toString(),
    });

    const responseText = await response.text();
    let data: AfricasTalkingSmsResponse = {};

    try {
      data = JSON.parse(responseText) as AfricasTalkingSmsResponse;
    } catch {
      console.error("Africa's Talking SMS non-JSON response:", responseText);
      return {
        sent: false,
        channel: "sms" as const,
        reason: isAfricasTalkingSandbox()
          ? "SMS failed — check sandbox API key and add the phone in Africa's Talking dashboard"
          : "SMS request failed — invalid response from Africa's Talking",
        providerResponse: responseText,
      };
    }

    const recipients = data.SMSMessageData?.Recipients ?? [];
    const delivered = recipients.some(
      (recipient) =>
        recipient.status?.toLowerCase() === "success" ||
        recipient.statusCode === 101
    );

    if (!response.ok || !delivered) {
      const reason = extractSmsFailure(
        data,
        isAfricasTalkingSandbox()
          ? "SMS failed — sandbox only delivers to phone numbers added in your Africa's Talking dashboard"
          : "SMS request failed"
      );

      console.error("Africa's Talking SMS failed:", {
        status: response.status,
        sandbox: isAfricasTalkingSandbox(),
        to,
        data,
      });

      return {
        sent: false,
        channel: "sms" as const,
        reason,
        providerResponse: data,
      };
    }

    console.log(
      `[SMS sent via Africa's Talking${isAfricasTalkingSandbox() ? " sandbox" : ""}] → ${to}`
    );

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
