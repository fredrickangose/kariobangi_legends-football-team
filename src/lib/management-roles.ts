export const MANAGEMENT_CATEGORIES = [
  {
    id: "leadership",
    dbValue: "Club Leadership",
    heading: "Club Leadership / Board",
    badge: "BOARD",
    description:
      "Strategic leadership, governance and overall direction of Kariobangi Legends.",
  },
  {
    id: "technical",
    dbValue: "Technical Team",
    heading: "Technical Team",
    badge: "TECH",
    description:
      "Coaching, medical, analysis and matchday operations behind the first team.",
  },
] as const;

export const LEADERSHIP_ROLE_GROUPS = [
  {
    id: "executive",
    heading: "Executive Leadership",
    badge: "EXEC",
    values: [
      "Chairman",
      "CEO / President",
      "Vice Chairman",
      "Senior Team Manager",
    ],
  },
  {
    id: "governance",
    heading: "Governance",
    badge: "GOV",
    values: ["Club Secretary", "Club Treasurer", "Board Member"],
  },
  {
    id: "discipline",
    heading: "Club Discipline",
    badge: "DISC",
    values: ["Disciplinarian"],
  },
  {
    id: "community",
    heading: "Community",
    badge: "COMM",
    values: ["Community Representative"],
  },
] as const;

export const TECHNICAL_ROLE_GROUPS = [
  {
    id: "coaching",
    heading: "Coaching Staff",
    badge: "COACH",
    values: [
      "Head Coach",
      "1st Assistant Coach",
      "2nd Assistant Coach",
      "Goalkeeping Trainer",
      "Fitness Trainer",
    ],
  },
  {
    id: "management",
    heading: "Team Management",
    badge: "MGMT",
    values: ["Team Manager", "Administrator"],
  },
  {
    id: "medical",
    heading: "Medical Team",
    badge: "MED",
    values: ["Team Doctor"],
  },
  {
    id: "operations",
    heading: "Matchday Operations",
    badge: "OPS",
    values: [
      "Kit Manager",
      "Assistant Kit Manager",
      "Grounds Official",
      "Team Driver",
    ],
  },
] as const;

const FEATURED_POSITIONS = new Set(["Chairman", "Head Coach"]);

/** Maps retired technical titles to their current slot for grouping and sort order. */
const LEGACY_TECHNICAL_POSITION_ALIASES: Record<string, string> = {
  "Assistant Coach": "1st Assistant Coach",
  "Goalkeeping Coach": "Goalkeeping Trainer",
  "Fitness Coach": "Fitness Trainer",
  "Team Doctor / Physiotherapist": "Team Doctor",
  "Team Analyst": "Administrator",
  Photographer: "Administrator",
  "Equipment & Matchday Assistant": "Team Driver",
};

const LEGACY_TECHNICAL_POSITIONS = [
  ...Object.keys(LEGACY_TECHNICAL_POSITION_ALIASES),
  "Disciplinarian",
] as const;

function normalizeManagementPosition(position: string): string {
  const trimmed = position.trim();
  return LEGACY_TECHNICAL_POSITION_ALIASES[trimmed] ?? trimmed;
}

function roleGroupsForCategory(dbValue: string) {
  return dbValue === "Club Leadership"
    ? LEADERSHIP_ROLE_GROUPS
    : TECHNICAL_ROLE_GROUPS;
}

export function getDefaultManagementPosition(category: string): string {
  return category === "Club Leadership" ? "Chairman" : "Head Coach";
}

export function getManagementPositionOptions(category: string) {
  return roleGroupsForCategory(category).flatMap((group) =>
    group.values.map((value) => ({
      value,
      label: value,
      groupHeading: group.heading,
    }))
  );
}

export function isFeaturedManagementRole(position: string): boolean {
  return FEATURED_POSITIONS.has(position.trim());
}

export function getManagementRoleBadge(position: string, category: string): string {
  const normalized = normalizeManagementPosition(position);

  if (position.trim() === "Disciplinarian" && category === "Technical Team") {
    return "OPS";
  }

  const groups = roleGroupsForCategory(category);
  for (const group of groups) {
    if ((group.values as readonly string[]).includes(normalized)) {
      return group.badge;
    }
  }
  return normalized.slice(0, 4).toUpperCase();
}

/** Lower rank = higher in hierarchy (displayed first). */
export function getManagementPositionRank(
  position: string,
  category: string
): number {
  const normalized = normalizeManagementPosition(position);
  let rank = 0;

  for (const group of roleGroupsForCategory(category)) {
    const index = (group.values as readonly string[]).indexOf(normalized);
    if (index >= 0) {
      return rank + index;
    }
    rank += group.values.length;
  }

  return rank + 1000;
}

function compareManagementMembers<
  T extends {
    name: string;
    position: string;
    category: string;
    displayOrder: number;
  },
>(a: T, b: T) {
  const rankDiff =
    getManagementPositionRank(a.position, a.category) -
    getManagementPositionRank(b.position, b.category);

  if (rankDiff !== 0) {
    return rankDiff;
  }

  return a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);
}

export function sortManagementMembers<
  T extends {
    name: string;
    position: string;
    category: string;
    displayOrder: number;
  },
>(members: T[]): T[] {
  return [...members].sort(compareManagementMembers);
}

export function getManagementRoleGroupId(
  position: string,
  category: string
): string {
  const raw = position.trim();

  if (raw === "Disciplinarian" && category === "Technical Team") {
    return "operations";
  }

  const normalized = normalizeManagementPosition(position);
  const groups = roleGroupsForCategory(category);

  for (const group of groups) {
    if ((group.values as readonly string[]).includes(normalized)) {
      return group.id;
    }
  }

  return "other";
}

export type ManagementMemberLike = {
  id: number;
  name: string;
  position: string;
  category: string;
  bio: string | null;
  responsibilities: string | null;
  imageUrl: string | null;
  displayOrder: number;
};

export function groupManagementByCategoryAndRole<T extends ManagementMemberLike>(
  members: T[]
) {
  return MANAGEMENT_CATEGORIES.map((category) => {
    const categoryMembers = members
      .filter((member) => member.category === category.dbValue)
      .sort(compareManagementMembers);

    const roleGroups = roleGroupsForCategory(category.dbValue).map((group) => ({
      ...group,
      members: categoryMembers
        .filter(
          (member) =>
            getManagementRoleGroupId(member.position, member.category) === group.id
        )
        .sort(compareManagementMembers),
    }));

    const otherMembers = categoryMembers.filter(
      (member) => getManagementRoleGroupId(member.position, member.category) === "other"
    );

    return {
      ...category,
      members: categoryMembers,
      roleGroups,
      otherMembers,
    };
  }).filter(
    (section) => section.members.length > 0
  );
}

export function isKnownManagementCategory(category: string): boolean {
  return MANAGEMENT_CATEGORIES.some((entry) => entry.dbValue === category);
}

export { LEGACY_TECHNICAL_POSITIONS };
