import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearAdminSessionCookie } from "@/lib/session-exclusive";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("kariobangi_admin");

  const response = NextResponse.json({
    success: true,
    message: "Admin logged out successfully.",
  });

  clearAdminSessionCookie(response);

  return response;
}
