export const MERCHANDISE_CATEGORIES = [
  {
    id: "jersey",
    label: "Jerseys",
    description: "Official home, away, and training shirts",
  },
  {
    id: "scarf",
    label: "Scarves",
    description: "Supporter scarves for cold matchday evenings",
  },
  {
    id: "jumper",
    label: "Jumpers",
    description: "Club jumpers and hoodies for fans and players",
  },
  {
    id: "cap",
    label: "Caps",
    description: "Snapbacks, bucket hats, and club headwear",
  },
  {
    id: "socks",
    label: "Socks",
    description: "Official match and training socks",
  },
  {
    id: "tracksuit",
    label: "Tracksuits",
    description: "Full training tracksuit tops and sets",
  },
  {
    id: "shorts",
    label: "Shorts",
    description: "Training and match shorts",
  },
  {
    id: "bag",
    label: "Bags",
    description: "Kit bags and supporter carry bags",
  },
  {
    id: "other",
    label: "Other",
    description: "Additional official club merchandise",
  },
] as const;

export type MerchandiseCategoryId = (typeof MERCHANDISE_CATEGORIES)[number]["id"];

const LEGACY_CATEGORY_MAP: Record<string, MerchandiseCategoryId> = {
  home: "jersey",
  "away-green": "jersey",
  "away-white": "jersey",
  jersey: "jersey",
  accessory: "other",
  scarf: "scarf",
};

const CATEGORY_IDS = new Set<string>(MERCHANDISE_CATEGORIES.map((category) => category.id));

export function normalizeMerchandiseCategory(kitType: string): MerchandiseCategoryId {
  if (CATEGORY_IDS.has(kitType)) {
    return kitType as MerchandiseCategoryId;
  }

  return LEGACY_CATEGORY_MAP[kitType] ?? "other";
}

export function getMerchandiseCategoryLabel(kitType: string): string {
  const categoryId = normalizeMerchandiseCategory(kitType);
  return (
    MERCHANDISE_CATEGORIES.find((category) => category.id === categoryId)?.label ?? "Other"
  );
}

export function getMerchandiseCategoryMeta(kitType: string) {
  const categoryId = normalizeMerchandiseCategory(kitType);
  return (
    MERCHANDISE_CATEGORIES.find((category) => category.id === categoryId) ??
    MERCHANDISE_CATEGORIES[MERCHANDISE_CATEGORIES.length - 1]
  );
}

export function groupMerchandiseByCategory<T extends { kitType: string }>(items: T[]) {
  const groups = new Map<MerchandiseCategoryId, T[]>();

  for (const category of MERCHANDISE_CATEGORIES) {
    groups.set(category.id, []);
  }

  for (const item of items) {
    const categoryId = normalizeMerchandiseCategory(item.kitType);
    groups.get(categoryId)?.push(item);
  }

  return groups;
}

export function getMerchandiseCategoriesWithItems<T extends { kitType: string }>(items: T[]) {
  const groups = groupMerchandiseByCategory(items);
  return MERCHANDISE_CATEGORIES.filter((category) => (groups.get(category.id)?.length ?? 0) > 0);
}
