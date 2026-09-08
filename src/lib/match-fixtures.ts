export const CLUB_SHORT_NAME = "Legends FC";
export const CLUB_FULL_NAME = "Kariobangi Legends FC";
export const CLUB_LOGO_PATH = "/assets/logo.png";
export const COMPETITION_NAME = "FKF Division One";

export const MATCH_TYPES = [
  {
    value: "league",
    label: "League Match",
    badge: "LEAGUE",
    heading: "FKF Division One",
  },
  {
    value: "friendly",
    label: "Friendly",
    badge: "FRD",
    heading: "Friendly Match",
  },
  {
    value: "charity",
    label: "Charity Match",
    badge: "CHR",
    heading: "Charity Match",
  },
] as const;

export type MatchTypeValue = (typeof MATCH_TYPES)[number]["value"];

export const MATCH_STATUSES = [
  { value: "upcoming", label: "Upcoming", badge: "NS", description: "Not started" },
  { value: "live", label: "Live", badge: "LIVE", description: "In progress" },
  { value: "completed", label: "Full Time", badge: "FT", description: "Match finished" },
  { value: "postponed", label: "Postponed", badge: "PST", description: "Match postponed" },
  { value: "cancelled", label: "Cancelled", badge: "CAN", description: "Match cancelled" },
] as const;

export type MatchStatusValue = (typeof MATCH_STATUSES)[number]["value"];
export type MatchResult = "win" | "draw" | "loss";

export interface FixtureLike {
  id: number;
  opponent: string;
  opponentLogoUrl: string | null;
  date: string;
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  venue: string;
  matchType?: string | null;
}

export function normalizeMatchType(matchType: string | null | undefined): MatchTypeValue {
  const normalized = (matchType ?? "league").trim().toLowerCase();
  if (normalized === "friendly") return "friendly";
  if (normalized === "charity") return "charity";
  return "league";
}

export function getMatchTypeMeta(matchType: string | null | undefined) {
  const value = normalizeMatchType(matchType);
  return MATCH_TYPES.find((entry) => entry.value === value) ?? MATCH_TYPES[0];
}

export function isLeagueMatch(fixture: FixtureLike): boolean {
  return normalizeMatchType(fixture.matchType) === "league";
}

export interface TeamDisplay {
  name: string;
  logo: string | null;
  isLegends: boolean;
}

export function normalizeMatchStatus(status: string): MatchStatusValue {
  const normalized = status.trim().toLowerCase();
  if (normalized === "live") return "live";
  if (normalized === "completed" || normalized === "ft") return "completed";
  if (normalized === "postponed" || normalized === "pst") return "postponed";
  if (normalized === "cancelled" || normalized === "can") return "cancelled";
  return "upcoming";
}

export function getMatchStatusMeta(status: string) {
  const value = normalizeMatchStatus(status);
  return MATCH_STATUSES.find((entry) => entry.value === value) ?? MATCH_STATUSES[0];
}

export function getHomeAwayTeams(fixture: FixtureLike): {
  home: TeamDisplay;
  away: TeamDisplay;
} {
  const legends: TeamDisplay = {
    name: CLUB_SHORT_NAME,
    logo: CLUB_LOGO_PATH,
    isLegends: true,
  };
  const opponent: TeamDisplay = {
    name: fixture.opponent,
    logo: fixture.opponentLogoUrl,
    isLegends: false,
  };

  if (fixture.isHome) {
    return { home: legends, away: opponent };
  }

  return { home: opponent, away: legends };
}

export function getLegendsScore(fixture: FixtureLike): {
  legends: number | null;
  opponent: number | null;
} {
  if (fixture.isHome) {
    return {
      legends: fixture.homeScore,
      opponent: fixture.awayScore,
    };
  }

  return {
    legends: fixture.awayScore,
    opponent: fixture.homeScore,
  };
}

export function isFixtureFinished(fixture: FixtureLike): boolean {
  const status = normalizeMatchStatus(fixture.status);
  return (
    status === "completed" ||
    status === "cancelled" ||
    (fixture.homeScore !== null && fixture.awayScore !== null)
  );
}

export function getMatchResult(fixture: FixtureLike): MatchResult | null {
  if (!isFixtureFinished(fixture)) return null;

  const { legends, opponent } = getLegendsScore(fixture);
  if (legends === null || opponent === null) return null;
  if (legends > opponent) return "win";
  if (legends < opponent) return "loss";
  return "draw";
}

export function getResultLabel(result: MatchResult | null): string {
  if (result === "win") return "Win";
  if (result === "draw") return "Draw";
  if (result === "loss") return "Loss";
  return "—";
}

export function getResultTone(result: MatchResult | null): {
  badge: string;
  text: string;
  border: string;
} {
  if (result === "win") {
    return {
      badge: "bg-emerald-50 text-emerald-700",
      text: "text-emerald-600",
      border: "border-emerald-100",
    };
  }
  if (result === "loss") {
    return {
      badge: "bg-rose-50 text-rose-700",
      text: "text-rose-600",
      border: "border-rose-100",
    };
  }
  if (result === "draw") {
    return {
      badge: "bg-slate-100 text-slate-700",
      text: "text-slate-600",
      border: "border-slate-200",
    };
  }

  return {
    badge: "bg-slate-100 text-slate-600",
    text: "text-slate-500",
    border: "border-slate-100",
  };
}

export function formatKickoff(date: string): string {
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return date;
}

export function partitionFixtures(fixtures: FixtureLike[], todayString: string) {
  const live = fixtures
    .filter((fixture) => normalizeMatchStatus(fixture.status) === "live")
    .sort((a, b) => a.date.localeCompare(b.date));

  const upcoming = fixtures
    .filter(
      (fixture) =>
        fixture.date >= todayString &&
        !isFixtureFinished(fixture) &&
        normalizeMatchStatus(fixture.status) !== "live"
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const recent = fixtures
    .filter(
      (fixture) =>
        isFixtureFinished(fixture) ||
        fixture.date < todayString ||
        normalizeMatchStatus(fixture.status) === "completed"
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    live,
    upcoming,
    upcomingRest: upcoming.slice(1),
    recent,
    nextMatch: upcoming[0] ?? null,
  };
}

export function getSeasonStats(fixtures: FixtureLike[]) {
  const completed = fixtures.filter(
    (fixture) => isLeagueMatch(fixture) && getMatchResult(fixture) !== null
  );

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const fixture of completed) {
    const result = getMatchResult(fixture);
    const { legends, opponent } = getLegendsScore(fixture);

    goalsFor += legends ?? 0;
    goalsAgainst += opponent ?? 0;

    if (result === "win") wins += 1;
    else if (result === "draw") draws += 1;
    else if (result === "loss") losses += 1;
  }

  const played = wins + draws + losses;
  const points = wins * 3 + draws;

  return {
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points,
  };
}

export function getRecentForm(fixtures: FixtureLike[], limit = 5): MatchResult[] {
  return fixtures
    .map((fixture) => getMatchResult(fixture))
    .filter((result): result is MatchResult => result !== null)
    .slice(0, limit);
}
