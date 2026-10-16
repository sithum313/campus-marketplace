// cart.ts - helpers
import { designById } from "../designs";
import { CartLine, Listing, Offer } from "../types";

export const lineKeyOf = (
  itemId: string,
  v: { color?: string; size?: string; design?: string },
) => [itemId, v.color, v.size, v.design].filter(Boolean).join("|");

export const variantLabel = (line: CartLine) =>
  [line.color, line.size, designById(line.design)?.name].filter(Boolean).join(" · ");

/** Offers (not plain notices) that touch this product. */
export const offersFor = (item: Listing, offers: Offer[]) =>
  offers.filter(
    (o) =>
      o.eventId === item.eventId &&
      (o.kind === "info" ||
        o.target === "all" ||
        o.target === item.kind ||
        (o.kind === "bundle" && o.gives === item.kind)),
  );

const round = (n: number) => Math.round(n * 100) / 100;

export type PricedRow = {
  line: CartLine;
  item: Listing;
  gross: number;
  discount: number;
  labels: string[];
};

export function priceCart(lines: CartLine[], items: Listing[], offers: Offer[]) {
  const rows: PricedRow[] = [];
  for (const line of lines) {
    const item = items.find((i) => i.id === line.itemId);
    if (item) rows.push({ line, item, gross: item.price * line.qty, discount: 0, labels: [] });
  }

  for (const offer of offers) {
    if (offer.kind === "info") continue;
    const inEvent = rows.filter((r) => r.item.eventId === offer.eventId);
    if (offer.kind === "percent" && offer.percent) {
      for (const r of inEvent)
        if (offer.target === "all" || r.item.kind === offer.target) {
          r.discount += (r.gross * offer.percent) / 100;
          r.labels.push(offer.title);
        }
    } else if (offer.kind === "bogo") {
      for (const r of inEvent)
        if (offer.target === "all" || r.item.kind === offer.target) {
          const free = Math.floor(r.line.qty / 2);
          if (free) {
            r.discount += free * r.item.price;
            r.labels.push(offer.title);
          }
        }
    } else if (offer.kind === "bundle") {
      let remaining = inEvent
        .filter((r) => r.item.kind === offer.target)
        .reduce((sum, r) => sum + r.line.qty, 0);
      for (const r of inEvent)
        if (r.item.kind === offer.gives && remaining > 0) {
          const free = Math.min(remaining, r.line.qty);
          remaining -= free;
          r.discount += free * r.item.price;
          r.labels.push(offer.title);
        }
    }
  }

  for (const r of rows) r.discount = round(Math.min(r.discount, r.gross));
  const subtotal = round(rows.reduce((s, r) => s + r.gross, 0));
  const savings = round(rows.reduce((s, r) => s + r.discount, 0));
  return { rows, subtotal, savings, total: round(subtotal - savings) };
}
