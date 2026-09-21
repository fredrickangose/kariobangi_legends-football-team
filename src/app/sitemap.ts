import type { MetadataRoute } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { fixtures, news } from "@/db/schema";
import { getSiteBaseUrl } from "@/lib/notifications/config";
import { buildFixtureShareUrl, buildNewsShareUrl } from "@/lib/share-links";

const STATIC_TABS = [
  "fixtures",
  "squad",
  "management",
  "news",
  "gallery",
  "highlights",
  "shop",
  "membership",
  "donors",
  "contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();

  if (!baseUrl) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    ...STATIC_TABS.map((tab) => ({
      url: `${baseUrl}/?tab=${tab}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  try {
    const [allNews, allFixtures] = await Promise.all([
      db.select().from(news).orderBy(desc(news.createdAt)).limit(100),
      db.select().from(fixtures).orderBy(desc(fixtures.date)).limit(100),
    ]);

    for (const item of allNews) {
      entries.push({
        url: buildNewsShareUrl(item.id, baseUrl),
        lastModified: item.createdAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const fixture of allFixtures) {
      entries.push({
        url: buildFixtureShareUrl(fixture.id, baseUrl),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch (error) {
    console.error("Sitemap generation failed to load dynamic entries:", error);
  }

  return entries;
}
