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
      "Vice Chairman",
      "CEO / President",
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
    values: ["Head Coach", "Assistant Coach", "Goalkeeping Coach"],
  },
  {
    id: "performance",
    heading: "Performance & Analysis",
    badge: "PERF",
    values: ["Fitness Coach", "Team Analyst"],
  },
  {
    id: "medical",
    heading: "Medical Team",
    badge: "MED",
    values: ["Team Doctor / Physiotherapist"],
  },
  {
    id: "operations",
    heading: "Matchday Operations",
    badge: "OPS",
    values: [
      "Kit Manager",
      "Disciplinarian",
      "Photographer",
      "Equipment & Matchday Assistant",
    ],
  },
] as const;

const FEATURED_POSITIONS = new Set(["Chairman", "Head Coach"]);

const LEGACY_TECHNICAL_POSITIONS = [
  "Assistant Coach",
  "Goalkeeping Coach",
  "Fitness Coach",
  "Team Doctor / Physiotherapist",
  "Team Analyst",
  "Kit Manager",
  "Disciplinarian",
  "Photographer",
  "Equipment & Matchday Assistant",
] as const;

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
  const groups = roleGroupsForCategory(category);
  for (const group of groups) {
    if ((group.values as readonly string[]).includes(position.trim())) {
      return group.badge;
    }
  }
  return position.slice(0, 4).toUpperCase();
}

export function getManagementRoleGroupId(
  position: string,
  category: string
): string {
  const normalized = position.trim();
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
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));

    const roleGroups = roleGroupsForCategory(category.dbValue).map((group) => ({
      ...group,
      members: categoryMembers.filter(
        (member) => getManagementRoleGroupId(member.position, member.category) === group.id
      ),
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
