import { NextResponse } from "next/server";

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set("kariobangi_admin", "", {
    ...cookieBase,
    maxAge: 0,
  });
}

export function clearCustomerSessionCookie(response: NextResponse) {
  response.cookies.set("kariobangi_customer", "", {
    ...cookieBase,
    maxAge: 0,
  });
}
