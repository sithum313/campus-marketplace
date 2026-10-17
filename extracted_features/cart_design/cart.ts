import { designById } from "../../src/designs";
import { CartLine, Listing, Offer } from "../../src/types";

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

export type CampusMeetupSpot = {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  desc: string;
  safetyTag: string;
};

export const CAMPUS_MEETUP_SPOTS: CampusMeetupSpot[] = [
  {
    id: "lib-lobby",
    name: "Main Library Lobby",
    shortName: "Library",
    icon: "school-outline",
    desc: "Ground floor lobby near main security desk",
    safetyTag: "CCTV Monitored · Safe Zone",
  },
  {
    id: "student-union",
    name: "Student Union Hall",
    shortName: "Union Cafe",
    icon: "cafe-outline",
    desc: "Cafeteria seating area near entrance",
    safetyTag: "High Foot-Traffic Hub",
  },
  {
    id: "sci-quad",
    name: "Science & Tech Quad",
    shortName: "Science Quad",
    icon: "laptop-outline",
    desc: "Plaza between Block A and Engineering Lab",
    safetyTag: "Well-Lit Outdoor Plaza",
  },
  {
    id: "rec-center",
    name: "Campus Rec & Gym Center",
    shortName: "Rec Center",
    icon: "fitness-outline",
    desc: "Front desk turnstile waiting lounge",
    safetyTag: "Staffed Front Desk Area",
  },
];

export type CampusPromo = {
  code: string;
  discountType: "percent" | "fixed";
  amount: number;
  label: string;
  minSpend?: number;
};

export const CAMPUS_PROMOS: CampusPromo[] = [
  {
    code: "CAMPUS10",
    discountType: "percent",
    amount: 10,
    label: "10% Campus Student Discount",
    minSpend: 0,
  },
  {
    code: "SAVE5",
    discountType: "fixed",
    amount: 5,
    label: "$5 Off Orders Over $25",
    minSpend: 25,
  },
  {
    code: "FRESHER",
    discountType: "fixed",
    amount: 3,
    label: "$3 Freshman Welcome Perk",
    minSpend: 10,
  },
];

export function applyPromoCode(
  rawCode: string,
  subtotal: number,
): { valid: boolean; discount: number; promo?: CampusPromo; message: string } {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return { valid: false, discount: 0, message: "" };

  const match = CAMPUS_PROMOS.find((p) => p.code === code);
  if (!match) {
    return {
      valid: false,
      discount: 0,
      message: `Code "${code}" is invalid. Try "CAMPUS10" for 10% off!`,
    };
  }

  if (match.minSpend && subtotal < match.minSpend) {
    return {
      valid: false,
      discount: 0,
      message: `Code requires a minimum spend of $${match.minSpend}.`,
    };
  }

  let discount = 0;
  if (match.discountType === "percent") {
    discount = round((subtotal * match.amount) / 100);
  } else {
    discount = Math.min(subtotal, match.amount);
  }

  return {
    valid: true,
    discount,
    promo: match,
    message: `${match.label} applied!`,
  };
}
