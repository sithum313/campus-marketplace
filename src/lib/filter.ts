import { Filters, Listing } from "../types";

export const defaultFilters: Filters = {
  category: "All items",
  min: "",
  max: "",
  condition: "Any",
  campus: "Any",
  discountOnly: false,
  sort: "relevance",
};

/** Number of filters (besides category chips and sort) that are switched on. */
export const activeFilterCount = (f: Filters) =>
  (f.category !== "All items" ? 1 : 0) +
  (f.min !== "" ? 1 : 0) +
  (f.max !== "" ? 1 : 0) +
  (f.condition !== "Any" ? 1 : 0) +
  (f.campus !== "Any" ? 1 : 0) +
  (f.discountOnly ? 1 : 0);

export function applyFilters(items: Listing[], query: string, f: Filters): Listing[] {
  const q = query.trim().toLowerCase();
  let lo = f.min === "" ? 0 : Number(f.min);
  let hi = f.max === "" ? Infinity : Number(f.max);
  if (lo > hi) [lo, hi] = [hi, lo];
  const out = items.filter(
    (item) =>
      !item.soldOut &&
      (f.category === "All items" || item.category === f.category) &&
      item.price >= lo &&
      item.price <= hi &&
      (f.condition === "Any" || item.condition === f.condition) &&
      (f.campus === "Any" || item.campus === f.campus) &&
      (!f.discountOnly || !!item.discountPercent) &&
      (!q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.seller.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)),
  );
  if (f.sort === "priceAsc") out.sort((a, b) => a.price - b.price);
  if (f.sort === "priceDesc") out.sort((a, b) => b.price - a.price);
  if (f.sort === "discount") out.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
  return out;
}
