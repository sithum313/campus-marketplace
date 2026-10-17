import { colors } from "./theme";
import { capColors, shirtColors, shirtSizes } from "./designs";
import { CampusEvent, Listing, Offer, ProductKind } from "./types";

export const categories = [
  "All items",
  "Textbooks",
  "Furniture",
  "Tech",
  "Fashion",
  "Stationery",
  "Sports",
  "Accessories",
  "Event merch",
];

export const categoryIcons: Record<string, string> = {
  "All items": "grid-outline",
  Textbooks: "book-outline",
  Furniture: "bed-outline",
  Tech: "laptop-outline",
  Fashion: "mci:tshirt-crew-outline",
  Stationery: "pencil-outline",
  Sports: "basketball-outline",
  Accessories: "watch-outline",
  "Event merch": "ticket-outline",
};

export const categoryTints: string[] = [
  colors.pink,
  colors.teal,
  colors.yellow,
  colors.blue,
];

const base = (
  id: string,
  title: string,
  price: number,
  category: string,
  seller: string,
  campus: string,
  extra: Partial<Listing> = {},
): Listing => ({
  id,
  title,
  price,
  category,
  seller,
  campus,
  condition: "Good condition",
  description: "Listed by a student on campus.",
  ...extra,
});

export const seedEvents: CampusEvent[] = [
  {
    id: "e1",
    title: "Freshers Welcome Night",
    date: "8 Nov 2026",
    month: "NOV",
    day: "08",
    venue: "Main Auditorium",
    color: colors.yellow,
    organizer: "Student Union",
    cover: "freshers",
    description: "Meet your batch, music, games and food. The biggest night of the first semester.",
  },
  {
    id: "e2",
    title: "Inter-Faculty Sports Meet",
    date: "22 Nov 2026",
    month: "NOV",
    day: "22",
    venue: "University Ground",
    color: colors.teal,
    organizer: "Sports Council",
    cover: "sports",
    description: "Every faculty, one ground. Cricket, netball, relay and tug-of-war all day.",
  },
  {
    id: "e3",
    title: "Annual Charity Concert",
    date: "5 Dec 2026",
    month: "DEC",
    day: "05",
    venue: "Open Air Theatre",
    color: colors.pink,
    organizer: "Rotaract Club",
    cover: "charity",
    description: "An evening of live music where every ticket supports a campus scholarship fund.",
  },
];

const eventProducts = (
  eventId: string,
  name: string,
  organizer: string,
  prices: { ticket: number; cap: number; shirt: number; bookmark: number },
): Listing[] => {
  const ev = (kind: ProductKind, label: string, price: number, extra: Partial<Listing>) =>
    base(`${eventId}-${kind}`, `${name} ${label}`, price, "Event merch", organizer, "Event organizers", {
      eventId,
      kind,
      sold: 0,
      ...extra,
    });
  return [
    ev("ticket", "ticket", prices.ticket, {
      icon: "ticket-outline",
      condition: "Entry ticket",
      description: `Entry ticket for ${name}. Show the QR code at the gate.`,
      stock: 300,
      sold: 112,
    }),
    ev("cap", "cap", prices.cap, {
      icon: "mci:hat-fedora",
      condition: "New",
      description: `Official cap for ${name}. Adjustable strap.`,
      colors: capColors,
      stock: 80,
      sold: 21,
    }),
    ev("tshirt", "t-shirt", prices.shirt, {
      icon: "mci:tshirt-crew-outline",
      condition: "New",
      description: `Official t-shirt for ${name}. Pick a colour, size and print design.`,
      colors: shirtColors,
      sizes: shirtSizes,
      designs: ["crew", "laugh", "sunset", "waves", "stars", "together"],
      stock: 150,
      sold: 48,
    }),
    ev("bookmark", "bookmark", prices.bookmark, {
      icon: "bookmark-outline",
      condition: "New",
      description: `Collectible bookmark for ${name}. Choose your favourite design.`,
      designs: ["peace", "cheeky", "joy", "cheer", "squad", "sunset", "waves", "dots", "stars"],
      stock: 400,
      sold: 133,
    }),
  ];
};

export const seedListings: Listing[] = [
  {
    id: "1",
    title: "Calculus: Early Transcendentals",
    price: 35,
    category: "Textbooks",
    seller: "Maya R.",
    campus: "North Campus",
    condition: "Like new",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
    description: "Barely used and ready for your next math class.",
    popular: true,
    discountPercent: 20,
  },
  {
    id: "2",
    title: "Walnut study desk",
    price: 80,
    category: "Furniture",
    seller: "Jordan K.",
    campus: "West Village",
    condition: "Good condition",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800",
    description: "Solid walnut desk with room for a monitor and books.",
    popular: true,
  },
  {
    id: "3",
    title: "Noise-cancelling headphones",
    price: 120,
    category: "Tech",
    seller: "Alex P.",
    campus: "East Quad",
    condition: "Like new",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    description: "Wireless headphones with case and charging cable.",
    popular: true,
    discountPercent: 15,
  },
  {
    id: "4",
    title: "Vintage varsity jacket",
    price: 45,
    category: "Fashion",
    seller: "Sam T.",
    campus: "North Campus",
    condition: "Good condition",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800",
    description: "A warm, classic layer with a relaxed fit.",
    popular: true,
    discountPercent: 10,
  },
  base("5", "Scientific calculator", 18, "Tech", "Nimal P.", "North Campus", {
    icon: "calculator-outline",
    discountPercent: 25,
    popular: true,
  }),
  base("6", "Data structures notes bundle", 9, "Textbooks", "Dilini S.", "East Quad", {
    icon: "document-text-outline",
    discountPercent: 30,
  }),
  base("7", "Desk lamp", 14, "Furniture", "Kavindu W.", "West Village", {
    icon: "bulb-outline",
    discountPercent: 20,
  }),
  base("8", "A4 notebook set (5 pack)", 7, "Stationery", "Ishara M.", "North Campus", {
    icon: "pencil-outline",
    discountPercent: 15,
    popular: true,
  }),
  base("9", "Badminton racket", 22, "Sports", "Tharindu J.", "University Ground", {
    icon: "tennisball-outline",
    discountPercent: 35,
  }),
  base("10", "Canvas backpack", 26, "Accessories", "Sachini L.", "East Quad", {
    icon: "bag-handle-outline",
    popular: true,
  }),
  base("11", "Wireless mouse", 11, "Tech", "Pasindu H.", "North Campus", {
    icon: "hardware-chip-outline",
    discountPercent: 20,
  }),
  base("12", "Organic chemistry textbook", 30, "Textbooks", "Amaya F.", "West Village", {
    icon: "book-outline",
  }),
  base("13", "Casual hoodie", 20, "Fashion", "Ruwan D.", "East Quad", {
    icon: "mci:tshirt-crew-outline",
    popular: true,
  }),
  base("14", "Analog wristwatch", 24, "Accessories", "Hiruni N.", "North Campus", {
    icon: "watch-outline",
  }),
  ...eventProducts("e1", "Freshers Night", "Student Union", { ticket: 5, cap: 6, shirt: 10, bookmark: 2 }),
  ...eventProducts("e2", "Sports Meet", "Sports Council", { ticket: 3, cap: 6, shirt: 11, bookmark: 2 }),
  ...eventProducts("e3", "Charity Concert", "Rotaract Club", { ticket: 8, cap: 7, shirt: 12, bookmark: 3 }),
];

export const seedOffers: Offer[] = [
  {
    id: "o1",
    eventId: "e1",
    kind: "bogo",
    target: "ticket",
    title: "Buy 1 ticket, get 1 free",
    detail: "Bring a friend to Freshers Night. Every second ticket is on us.",
    until: "Until 6 Nov",
  },
  {
    id: "o2",
    eventId: "e2",
    kind: "percent",
    target: "tshirt",
    percent: 20,
    title: "CPL t-shirt: 20% off",
    detail: "Official CPL edition tees are 20% off for the Sports Meet.",
    until: "Until 20 Nov",
  },
  {
    id: "o3",
    eventId: "e3",
    kind: "bundle",
    target: "ticket",
    gives: "bookmark",
    title: "Free bookmark with every ticket",
    detail: "Buy a concert ticket and pick any bookmark design for free.",
    until: "While stocks last",
  },
  {
    id: "o4",
    eventId: "e1",
    kind: "info",
    title: "Gates open at 5:00 PM",
    detail: "Bring your student ID. Tickets are checked at the main gate.",
  },
];
