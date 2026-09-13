export const MERCHANDISE_STOCK_STATUSES = [
  {
    id: "available",
    label: "Available",
    description: "In stock and ready to order",
    badgeClass: "bg-emerald-600 text-white",
    buttonLabel: "Add to Cart · M-Pesa Ready",
  },
  {
    id: "out_of_stock",
    label: "Out of Stock",
    description: "Currently unavailable for purchase",
    badgeClass: "bg-rose-600 text-white",
    buttonLabel: "Out of Stock",
  },
  {
    id: "coming_soon",
    label: "Soon to be Updated",
    description: "Will be updated and listed soon",
    badgeClass: "bg-amber-500 text-slate-950",
    buttonLabel: "Soon to be Updated",
  },
] as const;

export type MerchandiseStockStatusId =
  (typeof MERCHANDISE_STOCK_STATUSES)[number]["id"];

const STOCK_STATUS_IDS = new Set<string>(
  MERCHANDISE_STOCK_STATUSES.map((status) => status.id)
);

export function normalizeMerchandiseStockStatus(
  stockStatus?: string | null
): MerchandiseStockStatusId {
  if (stockStatus && STOCK_STATUS_IDS.has(stockStatus)) {
    return stockStatus as MerchandiseStockStatusId;
  }

  return "available";
}

export function getMerchandiseStockStatusMeta(stockStatus?: string | null) {
  const statusId = normalizeMerchandiseStockStatus(stockStatus);
  return (
    MERCHANDISE_STOCK_STATUSES.find((status) => status.id === statusId) ??
    MERCHANDISE_STOCK_STATUSES[0]
  );
}

export function isMerchandiseAvailable(stockStatus?: string | null) {
  return normalizeMerchandiseStockStatus(stockStatus) === "available";
}
