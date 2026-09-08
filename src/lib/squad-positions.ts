export const SQUAD_POSITION_GROUPS = [
  {
    id: "gk",
    heading: "Goalkeepers",
    badge: "G'K",
    values: ["Goalkeeper"],
  },
  {
    id: "cb",
    heading: "Centre Backs",
    badge: "CB",
    values: ["Centre Back"],
  },
  {
    id: "rwb",
    heading: "Right Wing Backs",
    badge: "RWB",
    values: ["Right Wing Back"],
  },
  {
    id: "lwb",
    heading: "Left Wing Backs",
    badge: "LWB",
    values: ["Left Wing Back"],
  },
  {
    id: "cdm",
    heading: "CDMs",
    badge: "CDM",
    values: ["CDM"],
  },
  {
    id: "am",
    heading: "Att Midfielders",
    badge: "AM",
    values: ["Attacking Midfielder"],
  },
  {
    id: "st",
    heading: "Strikers",
    badge: "ST",
    values: ["Striker"],
  },
] as const;

/** Admin dropdown options — stored exactly as `players.position` in the database. */
export const SQUAD_POSITION_OPTIONS = SQUAD_POSITION_GROUPS.flatMap((group) =>
  group.values.map((value) => ({
    value,
    label: group.heading.endsWith("s")
      ? group.heading.slice(0, -1)
      : group.heading,
    groupHeading: group.heading,
  }))
);

const LEGACY_POSITION_GROUP: Record<string, string> = {
  Goalkeeper: "gk",
  Defender: "cb",
  Midfielder: "am",
  Forward: "st",
};

export function getSquadPositionGroupId(position: string): string {
  const normalized = position.trim();

  for (const group of SQUAD_POSITION_GROUPS) {
    if ((group.values as readonly string[]).includes(normalized)) {
      return group.id;
    }
  }

  return LEGACY_POSITION_GROUP[normalized] ?? "other";
}

export function getSquadPositionBadge(position: string): string {
  const groupId = getSquadPositionGroupId(position);
  const group = SQUAD_POSITION_GROUPS.find((entry) => entry.id === groupId);
  if (group) return group.badge;
  return position.slice(0, 3).toUpperCase();
}

export function groupPlayersBySquadPosition<T extends { position: string; jerseyNumber: number }>(
  players: T[]
): Map<string, T[]> {
  const buckets = new Map<string, T[]>();

  for (const group of SQUAD_POSITION_GROUPS) {
    buckets.set(group.id, []);
  }
  buckets.set("other", []);

  for (const player of players) {
    const groupId = getSquadPositionGroupId(player.position);
    const bucket = buckets.get(groupId) ?? buckets.get("other")!;
    bucket.push(player);
  }

  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  }

  return buckets;
}
