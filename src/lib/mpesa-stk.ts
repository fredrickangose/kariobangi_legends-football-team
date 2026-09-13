export function getMpesaTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function formatMpesaPhone(phone: string): string | null {
  let formattedPhone = phone.replace(/\s+/g, "");

  if (formattedPhone.startsWith("+254")) {
    formattedPhone = formattedPhone.substring(1);
  } else if (formattedPhone.startsWith("254")) {
    // already correct
  } else if (formattedPhone.startsWith("0")) {
    formattedPhone = `254${formattedPhone.substring(1)}`;
  } else {
    return null;
  }

  return formattedPhone;
}

export function getMpesaApiBaseUrl(environment: string) {
  return environment === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export async function getMpesaAccessToken(
  baseUrl: string,
  consumerKey: string,
  consumerSecret: string
) {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const tokenResponse = await fetch(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const tokenText = await tokenResponse.text();
  let tokenData: { access_token?: string; errorMessage?: string; error_description?: string };

  try {
    tokenData = JSON.parse(tokenText);
  } catch {
    throw new Error("Safaricom returned a non-JSON response while generating the access token.");
  }

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.errorMessage ||
        tokenData.error_description ||
        "Unable to obtain M-PESA access token."
    );
  }

  return tokenData.access_token;
}

export async function initiateMpesaStkPush(options: {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}) {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const environment = process.env.MPESA_ENVIRONMENT || "sandbox";
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
    throw new Error("M-PESA environment variables are missing.");
  }

  if (!callbackUrl) {
    throw new Error("MPESA_CALLBACK_URL is missing from .env");
  }

  const formattedPhone = formatMpesaPhone(options.phone);
  if (!formattedPhone) {
    throw new Error("Invalid M-PESA phone number. Use a number such as 0712345678.");
  }

  const baseUrl = getMpesaApiBaseUrl(environment);
  const accessToken = await getMpesaAccessToken(baseUrl, consumerKey, consumerSecret);
  const timestamp = getMpesaTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(options.amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: options.accountReference,
      TransactionDesc: options.transactionDesc,
    }),
  });

  const stkText = await stkResponse.text();
  let stkData: {
    ResponseCode?: string;
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    errorMessage?: string;
    ResponseDescription?: string;
  };

  try {
    stkData = JSON.parse(stkText);
  } catch {
    throw new Error("Safaricom returned a non-JSON response for the STK Push request.");
  }

  if (!stkResponse.ok || stkData.ResponseCode !== "0") {
    throw new Error(
      stkData.errorMessage ||
        stkData.ResponseDescription ||
        "M-PESA STK Push could not be initiated."
    );
  }

  return {
    formattedPhone,
    merchantRequestId: stkData.MerchantRequestID || null,
    checkoutRequestId: stkData.CheckoutRequestID || null,
  };
}
