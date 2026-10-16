import { Listing } from "./types";

export const colors = {
  ink: "#1E2230",
  muted: "#7B8190",
  bg: "#F6F8FB",
  card: "#FFFFFF",
  line: "#E6EAF0",
  yellow: "#F6C52A",
  teal: "#85DAE1",
  pink: "#F4D4E1",
  blue: "#CFE8F7",
  red: "#E5484D",
  green: "#2E9E6B",
};

export const originalPrice = (price: number, discountPercent?: number) =>
  discountPercent ? Math.round(price / (1 - discountPercent / 100)) : price;

/** Price before discount, preferring the seller's own number. */
export const listPriceOf = (item: Listing) =>
  item.listPrice ?? originalPrice(item.price, item.discountPercent);

/** $12 or $12.50 – never $12.00 */
export const money = (value: number) =>
  `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
