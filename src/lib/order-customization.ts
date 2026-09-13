import { normalizeMerchandiseCategory } from "@/lib/merchandise-categories";

export type CheckoutCartItem = {
  merchId: number;
  name: string;
  price: number;
  size: string;
  quantity: number;
  kitType?: string;
  itemCustomization?: string | null;
};

export function isJerseyMerchandise(kitType?: string | null): boolean {
  if (!kitType) return false;
  return normalizeMerchandiseCategory(kitType) === "jersey";
}

export function formatJerseyCustomization(
  option: "none" | "name",
  name?: string
): string {
  if (option === "none") {
    return "No name on jersey";
  }

  const trimmed = (name || "").trim().toUpperCase().slice(0, 15);
  return trimmed ? `Name on jersey: ${trimmed}` : "No name on jersey";
}

export function validateCheckoutCart(cart: CheckoutCartItem[]) {
  if (!Array.isArray(cart) || cart.length === 0) {
    return { ok: false as const, error: "Your cart is empty." };
  }

  for (const item of cart) {
    if (isJerseyMerchandise(item.kitType) && !item.itemCustomization?.trim()) {
      return {
        ok: false as const,
        error: `Choose a jersey name option for ${item.name} (${item.size}).`,
      };
    }
  }

  return { ok: true as const };
}
