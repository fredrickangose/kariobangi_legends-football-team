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

export function hasKickoffTime(date: string): boolean {
  return /(?:T|\s)\d{1,2}:\d{2}/.test(date.trim());
}

export function parseFixtureDate(date: string): Date | null {
  const trimmed = date.trim();
  if (!trimmed) return null;

  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
      0,
      0,
      0
    );
  }

  const dateTime = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (dateTime) {
    return new Date(
      Number(dateTime[1]),
      Number(dateTime[2]) - 1,
      Number(dateTime[3]),
      Number(dateTime[4]),
      Number(dateTime[5]),
      0
    );
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatKickoff(date: string): string {
  const parsed = parseFixtureDate(date);
  if (!parsed) return date;

  const datePart = parsed.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!hasKickoffTime(date)) {
    return datePart;
  }

  const timePart = parsed.toLocaleTimeString("en-KE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} · ${timePart}`;
}

const ICS_DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // typical match length incl. stoppage time

function toIcsUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function toIcsDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/** Builds an .ics calendar file so fans can add a fixture to their phone's calendar. */
export function buildFixtureIcs(fixture: FixtureLike): string {
  const parsed = parseFixtureDate(fixture.date);
  const { home, away } = getHomeAwayTeams(fixture);
  const summary = escapeIcsText(`${home.name} vs ${away.name}`);
  const location = escapeIcsText(fixture.venue || "");
  const description = escapeIcsText(`${CLUB_FULL_NAME} — ${getMatchTypeMeta(fixture.matchType).label}`);
  const uid = `kariobangi-fixture-${fixture.id}@kariobangilegends`;
  const now = toIcsUtcStamp(new Date());

  const timedEvent = parsed && hasKickoffTime(fixture.date);
  const allDayEvent = parsed && !hasKickoffTime(fixture.date);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kariobangi Legends FC//Fixtures//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
  ];

  if (timedEvent && parsed) {
    const end = new Date(parsed.getTime() + ICS_DEFAULT_DURATION_MS);
    lines.push(`DTSTART:${toIcsUtcStamp(parsed)}`, `DTEND:${toIcsUtcStamp(end)}`);
  } else if (allDayEvent && parsed) {
    const end = new Date(parsed.getTime() + 24 * 60 * 60 * 1000);
    lines.push(
      `DTSTART;VALUE=DATE:${toIcsDateOnly(parsed)}`,
      `DTEND;VALUE=DATE:${toIcsDateOnly(end)}`
    );
  }

  lines.push(
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.join("\r\n");
}

export type MatchCountdown = {
  hasTime: boolean;
  started: boolean;
  isMatchDay: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getMatchCountdown(
  date: string,
  now = new Date()
): MatchCountdown | null {
  const kickoff = parseFixtureDate(date);
  if (!kickoff) return null;

  const withTime = hasKickoffTime(date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const matchDay = new Date(
    kickoff.getFullYear(),
    kickoff.getMonth(),
    kickoff.getDate()
  );
  const dayDiff = Math.round(
    (matchDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (!withTime) {
    if (dayDiff > 0) {
      return {
        hasTime: false,
        started: false,
        isMatchDay: false,
        days: dayDiff,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    if (dayDiff === 0) {
      return {
        hasTime: false,
        started: false,
        isMatchDay: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      hasTime: false,
      started: true,
      isMatchDay: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const diff = kickoff.getTime() - now.getTime();
  if (diff <= 0) {
    return {
      hasTime: true,
      started: true,
      isMatchDay: dayDiff === 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    hasTime: true,
    started: false,
    isMatchDay: dayDiff === 0,
    days: Math.floor(diff / (24 * 60 * 60 * 1000)),
    hours: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
    minutes: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
    seconds: Math.floor((diff % (60 * 1000)) / 1000),
  };
}

export function toFixtureDateInputValue(date: string): string {
  if (!date) return "";

  const dateOnly = date.trim().split(/[T\s]/)[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly;
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

export function toFixtureTimeInputValue(date: string): string {
  if (!date) return "";

  const timeMatch = date.match(/(?:T|\s)(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime()) || !date.includes("T")) {
    return "";
  }

  return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
}

export function combineFixtureDateTime(date: string, time?: string): string {
  const trimmedDate = date.trim();
  if (!trimmedDate) return "";

  const trimmedTime = time?.trim();
  if (trimmedTime) {
    return `${trimmedDate}T${trimmedTime}`;
  }

  return trimmedDate;
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
