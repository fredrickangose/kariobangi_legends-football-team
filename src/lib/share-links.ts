import { getSiteBaseUrl } from "@/lib/notifications/config";
import {
  formatKickoff,
  getHomeAwayTeams,
  type FixtureLike,
} from "@/lib/match-fixtures";

export function getShareBaseUrl(fallback?: string): string {
  if (fallback) return fallback.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return getSiteBaseUrl() || "";
}

/** Origin from the incoming request — matches the browser URL during SSR/hydration. */
export function getRequestOrigin(headers: Headers): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return getSiteBaseUrl() || "";
  const protocol = headers.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`.replace(/\/$/, "");
}

export function buildNewsShareUrl(newsId: number, baseUrl?: string): string {
  const base = (baseUrl || getShareBaseUrl()).replace(/\/$/, "");
  return `${base}/?tab=news&news=${newsId}`;
}

export function buildFixtureShareUrl(fixtureId: number, baseUrl?: string): string {
  const base = (baseUrl || getShareBaseUrl()).replace(/\/$/, "");
  return `${base}/?tab=fixtures&fixture=${fixtureId}`;
}

export function buildWhatsAppShareUrl(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
}

export function buildNewsWhatsAppShare(
  news: {
    id: number;
    title: string;
    summary: string;
  },
  baseUrl?: string,
): string {
  const url = buildNewsShareUrl(news.id, baseUrl);
  const text = `📰 ${news.title}\n${news.summary}`;
  return buildWhatsAppShareUrl(text, url);
}

export function buildFixtureWhatsAppShare(fixture: FixtureLike, baseUrl?: string): string {
  const url = buildFixtureShareUrl(fixture.id, baseUrl);
  const { home, away } = getHomeAwayTeams(fixture);
  const score =
    fixture.homeScore != null && fixture.awayScore != null
      ? ` · ${fixture.homeScore}-${fixture.awayScore}`
      : "";
  const text = `⚽ ${home.name} vs ${away.name}${score}\n${formatKickoff(fixture.date)} · ${fixture.venue}`;
  return buildWhatsAppShareUrl(text, url);
}

export const SHAREABLE_TABS = new Set([
  "home",
  "fixtures",
  "news",
  "shop",
  "donors",
  "account",
  "squad",
  "management",
  "gallery",
  "highlights",
  "contact",
]);

/** Maps legacy/alternate tab ids to the ids used in ClubWebsite. */
export function normalizeShareTab(tab?: string | null): string | undefined {
  if (!tab) return undefined;
  if (tab === "donate") return "donors";
  return tab;
}
