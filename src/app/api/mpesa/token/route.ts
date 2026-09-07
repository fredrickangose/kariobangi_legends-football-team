import { NextResponse } from "next/server";

export async function GET() {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const environment = process.env.MPESA_ENVIRONMENT || "sandbox";

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "M-PESA consumer credentials are missing",
        },
        { status: 500 }
      );
    }

    const baseUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    const credentials = Buffer.from(
      `${consumerKey}:${consumerSecret}`
    ).toString("base64");

    const response = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("M-PESA token error:", data);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate M-PESA access token",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error("M-PESA token route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected M-PESA token error",
      },
      { status: 500 }
    );
  }
}