export type ProductKind = "ticket" | "cap" | "tshirt" | "bookmark" | "general";

export type Swatch = { name: string; hex: string };

export type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  seller: string;
  sellerId?: string;
  campus: string;
  condition: string;
  image?: string;
  description?: string;
  /** percent off, e.g. 20 means `price` is already 20% lower than `listPrice` */
  discountPercent?: number;
  /** price before the discount (set by sellers; derived from price when missing) */
  listPrice?: number;
  popular?: boolean;
  /** set when the item is sold for a campus event */
  eventId?: string;
  /** icon shown when the item has no photo (see AppIcon) */
  icon?: string;
  kind?: ProductKind;
  colors?: Swatch[];
  sizes?: string[];
  /** ids from the design library (see designs.ts) the buyer can choose from */
  designs?: string[];
  stock?: number;
  sold?: number;
  soldOut?: boolean;
};

export type CampusEvent = {
  id: string;
  title: string;
  date: string;
  month: string;
  day: string;
  venue: string;
  color: string;
  organizer: string;
  description?: string;
  /** key of a bundled cover (see covers in data.ts) */
  cover?: string;
};

export type OfferKind = "percent" | "bogo" | "bundle" | "info";

/** A notice/offer an organizer attaches to an event. */
export type Offer = {
  id: string;
  eventId: string;
  kind: OfferKind;
  title: string;
  detail?: string;
  /** product kind the offer applies to (percent / bogo) or that must be bought (bundle) */
  target?: ProductKind | "all";
  percent?: number;
  /** bundle: kind that comes free */
  gives?: ProductKind;
  until?: string;
};

export type CartLine = {
  key: string;
  itemId: string;
  qty: number;
  color?: string;
  size?: string;
  design?: string;
};

export type OrderStatus = "Placed" | "Ready for pickup" | "Completed" | "Cancelled";

export type OrderLine = {
  title: string;
  qty: number;
  unitPrice: number;
  variant?: string;
  itemId?: string;
};

export type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  lines: OrderLine[];
  total: number;
  /** buyer name (seller view) or seller name (buyer view) */
  party: string;
  eventId?: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  sellerId?: string;
  meetupSpot?: string;
  meetupTime?: string;
  notes?: string;
  promoCode?: string;
  discount?: number;
  createdAt?: any;
  updatedAt?: any;
};

export type MessageType = "text" | "meetup" | "offer" | "system";

export type MeetupDetails = {
  location: string;
  spotId?: string;
  time: string;
  status: "proposed" | "accepted" | "declined";
};

export type OfferDetails = {
  amount: number;
  originalPrice?: number;
  status: "pending" | "accepted" | "declined" | "countered";
  counterAmount?: number;
};

export type Message = {
  id: string;
  mine: boolean;
  text: string;
  at: number;
  senderId?: string;
  senderName?: string;
  senderRole?: "buyer" | "seller";
  type?: MessageType;
  meetup?: MeetupDetails;
  offer?: OfferDetails;
  reaction?: string;
};

export type Conversation = {
  id: string;
  itemId: string;
  itemTitle: string;
  itemPrice?: number;
  itemImage?: string;
  seller: string;
  sellerId?: string;
  buyer?: string;
  buyerId?: string;
  memberIds?: string[];
  lastMessage?: string;
  lastMessageAt?: number;
  messages: Message[];
  unreadCount?: number;
  pinned?: boolean;
  activeMeetup?: MeetupDetails;
  activeOffer?: OfferDetails;
  createdAt?: any;
  updatedAt?: any;
};

export type Filters = {
  category: string;
  min: string;
  max: string;
  condition: string;
  campus: string;
  discountOnly: boolean;
  sort: "relevance" | "priceAsc" | "priceDesc" | "discount";
};

export type Mode = "buyer" | "seller";
export type Tab = "Home" | "Messages" | "Search" | "Cart" | "Profile";
export type SellerTab = "Dashboard" | "Products" | "Events" | "Orders";
export type SubPage = "discounts" | "events" | "chat" | null;
