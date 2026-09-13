import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { merchandise } from "@/db/schema";
import {
  isJerseyMerchandise,
  type CheckoutCartItem,
} from "@/lib/order-customization";
import { isMerchandiseAvailable } from "@/lib/merchandise-stock";
import { applyMemberUnitPrice } from "@/lib/membership";
import { findActivePaidMembership } from "@/lib/membership-server";

const MAX_LINE_QUANTITY = 20;

function parseMerchandiseSizes(raw: string): string[] {
  return raw
    .split(",")
    .map((size) => size.trim())
    .filter(Boolean);
}

export async function validateAndPriceCheckoutCart(
  cart: CheckoutCartItem[],
  options?: { customerId?: number | null }
): Promise<
  | { ok: true; cart: CheckoutCartItem[]; totalAmount: number; memberDiscountApplied: boolean }
  | { ok: false; error: string }
> {
  if (!Array.isArray(cart) || cart.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const merchIds = [
    ...new Set(
      cart
        .map((item) => Number(item.merchId))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];

  if (merchIds.length === 0) {
    return { ok: false, error: "Your cart contains invalid merchandise." };
  }

  const merchandiseRows = await db
    .select()
    .from(merchandise)
    .where(inArray(merchandise.id, merchIds));

  const merchandiseById = new Map(
    merchandiseRows.map((row) => [row.id, row])
  );

  const activeMembership = options?.customerId
    ? await findActivePaidMembership(options.customerId)
    : null;
  const memberDiscountApplied = Boolean(activeMembership);

  const validatedCart: CheckoutCartItem[] = [];
  let totalAmount = 0;

  for (const item of cart) {
    const merchId = Number(item.merchId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(merchId) || merchId <= 0) {
      return { ok: false, error: "Your cart contains invalid merchandise." };
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_LINE_QUANTITY) {
      return {
        ok: false,
        error: `Invalid quantity for ${item.name || "an item"} in your cart.`,
      };
    }

    const product = merchandiseById.get(merchId);

    if (!product) {
      return {
        ok: false,
        error: `${item.name || "An item"} is no longer available in the shop.`,
      };
    }

    if (!isMerchandiseAvailable(product.stockStatus)) {
      return {
        ok: false,
        error: `${product.name} is not available to order right now.`,
      };
    }

    const size = String(item.size || "").trim();
    const allowedSizes = parseMerchandiseSizes(product.sizes);

    if (!size || !allowedSizes.includes(size)) {
      return {
        ok: false,
        error: `Invalid size selected for ${product.name}.`,
      };
    }

    if (
      isJerseyMerchandise(product.kitType) &&
      !item.itemCustomization?.trim()
    ) {
      return {
        ok: false,
        error: `Choose a jersey name option for ${product.name} (${size}).`,
      };
    }

    const unitPrice = memberDiscountApplied
      ? applyMemberUnitPrice(product.price)
      : product.price;
    const lineTotal = unitPrice * quantity;
    totalAmount += lineTotal;

    validatedCart.push({
      merchId: product.id,
      name: product.name,
      price: unitPrice,
      size,
      quantity,
      kitType: product.kitType,
      itemCustomization: item.itemCustomization?.trim() || null,
    });
  }

  return {
    ok: true,
    cart: validatedCart,
    totalAmount: Math.round(totalAmount),
    memberDiscountApplied,
  };
}
