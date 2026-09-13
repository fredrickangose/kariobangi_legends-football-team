import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getNotificationConfigSummary } from "@/lib/notifications/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const notifications = getNotificationConfigSummary();

  try {
    await db.execute(sql`select 1`);

    return Response.json({
      ok: true,
      database: true,
      notifications: {
        buyerLive: notifications.buyerNotificationsLive,
        smsLive: notifications.smsLive,
        whatsappLive: notifications.whatsappLive,
        whatsappLogMode: notifications.whatsappLogMode,
        trackingLinks: notifications.trackingUrlConfigured,
        adminAlertPhones: notifications.adminAlertPhones,
        adminAlertsLive: notifications.adminAlertsLive,
      },
    });
  } catch {
    return Response.json(
      {
        ok: false,
        database: false,
        notifications: {
          buyerLive: notifications.buyerNotificationsLive,
          smsLive: notifications.smsLive,
          whatsappLive: notifications.whatsappLive,
          whatsappLogMode: notifications.whatsappLogMode,
          trackingLinks: notifications.trackingUrlConfigured,
          adminAlertPhones: notifications.adminAlertPhones,
          adminAlertsLive: notifications.adminAlertsLive,
        },
      },
      { status: 500 }
    );
  }
}
