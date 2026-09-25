import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getClubData } from "./actions";
import ClubWebsite from "./ClubWebsite";
import { db, ensureDatabaseSchema } from "@/db";
import { fixtures, news } from "@/db/schema";
import { getSiteBaseUrl } from "@/lib/notifications/config";
import {
  buildFixtureShareUrl,
  buildNewsShareUrl,
  getRequestOrigin,
  normalizeShareTab,
  SHAREABLE_TABS,
} from "@/lib/share-links";
import { headers } from "next/headers";
import { formatKickoff, getHomeAwayTeams } from "@/lib/match-fixtures";

export const dynamic = "force-dynamic";

const DEFAULT_TITLE = "Kariobangi Legends FC | Official Club Website";
const DEFAULT_DESCRIPTION =
  "Official website of Kariobangi Legends Football Club (KLFC), playing in FKF Division One, Nairobi Kenya. Founded by Mr. Erick Otieno Atanga to empower slum youths through football and community leadership.";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    news?: string;
    fixture?: string;
    order?: string;
  }>;
};

function resolveInitialTab(params: {
  tab?: string;
  news?: string;
  fixture?: string;
  order?: string;
}) {
  if (params.order) return "account";
  const tab = normalizeShareTab(params.tab);
  if (tab && SHAREABLE_TABS.has(tab)) return tab;
  if (params.news) return "news";
  if (params.fixture) return "fixtures";
  return "home";
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const baseUrl = getSiteBaseUrl();

  const defaultOpenGraph = {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    type: "website" as const,
    siteName: "Kariobangi Legends FC",
    ...(baseUrl ? { url: baseUrl } : {}),
  };

  try {
    await ensureDatabaseSchema();

    const newsId = Number(params.news);
    if (newsId > 0) {
      const [item] = await db
        .select()
        .from(news)
        .where(eq(news.id, newsId))
        .limit(1);

      if (item) {
        const url = baseUrl ? buildNewsShareUrl(newsId, baseUrl) : undefined;
        return {
          title: `${item.title} | Kariobangi Legends FC`,
          description: item.summary,
          openGraph: {
            title: item.title,
            description: item.summary,
            type: "article",
            siteName: "Kariobangi Legends FC",
            ...(url ? { url } : {}),
            ...(item.imageUrl ? { images: [{ url: item.imageUrl, alt: item.title }] } : {}),
          },
          twitter: {
            card: "summary_large_image",
            title: item.title,
            description: item.summary,
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
          },
        };
      }
    }

    const fixtureId = Number(params.fixture);
    if (fixtureId > 0) {
      const [fixture] = await db
        .select()
        .from(fixtures)
        .where(eq(fixtures.id, fixtureId))
        .limit(1);

      if (fixture) {
        const { home, away } = getHomeAwayTeams(fixture);
        const score =
          fixture.homeScore != null && fixture.awayScore != null
            ? ` · ${fixture.homeScore}-${fixture.awayScore}`
            : "";
        const title = `${home.name} vs ${away.name}${score}`;
        const description = `${formatKickoff(fixture.date)} · ${fixture.venue}`;
        const url = baseUrl ? buildFixtureShareUrl(fixtureId, baseUrl) : undefined;

        return {
          title: `${title} | Kariobangi Legends FC`,
          description,
          openGraph: {
            title,
            description,
            type: "website",
            siteName: "Kariobangi Legends FC",
            ...(url ? { url } : {}),
          },
          twitter: {
            card: "summary",
            title,
            description,
          },
        };
      }
    }
  } catch (error) {
    console.error("Share metadata generation failed:", error);
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    openGraph: defaultOpenGraph,
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    },
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const headersList = await headers();
  const shareBaseUrl = getRequestOrigin(headersList);
  const clubDataResult = await getClubData();

  if (!clubDataResult.success) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-black text-rose-500">Database Connection Failed</h1>
        <p className="text-slate-400 mt-2 max-w-md text-sm">
          Please check your database environment setup. Drizzle could not query the PostgreSQL database.
        </p>
        <p className="text-xs text-rose-400/80 bg-rose-950/40 p-4 rounded-xl mt-4 max-w-xl font-mono">
          {clubDataResult.error}
        </p>
      </main>
    );
  }

  const initialData = {
    players: clubDataResult.players || [],
    fixtures: clubDataResult.fixtures || [],
    news: clubDataResult.news || [],
    merchandise: clubDataResult.merchandise || [],
    donations: clubDataResult.donations || [],
    fanMessages: clubDataResult.fanMessages || [],
    gallery: clubDataResult.gallery || [],
    highlights: clubDataResult.highlights || [],
    management: clubDataResult.management || [],
    leagueName: clubDataResult.leagueName || "FKF Division One",
  };

  const initialNewsId = Number(params.news);
  const initialFixtureId = Number(params.fixture);

  return (
    <ClubWebsite
      initialData={initialData}
      initialTab={resolveInitialTab(params)}
      initialNewsId={initialNewsId > 0 ? initialNewsId : null}
      initialFixtureId={initialFixtureId > 0 ? initialFixtureId : null}
      shareBaseUrl={shareBaseUrl}
      initialTrackOrderId={params.order ?? ""}
    />
  );
}
