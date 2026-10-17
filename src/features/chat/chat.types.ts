/**
 * feature/buyer-seller-chatting
 * Chat-related types (subset of global types.ts kept here for clarity)
 */

export type Message = {
  id: string;
  /** true when the message was sent by the current user */
  mine: boolean;
  text: string;
  /** Unix ms timestamp */
  at: number;
  senderId?: string;
  senderName?: string;
  /** Distinguishes who sent the message regardless of which device is viewing */
  senderRole?: "buyer" | "seller";
};

export type Conversation = {
  id: string;
  /** Listing that started the conversation */
  itemId: string;
  itemTitle: string;
  /** Seller display name */
  seller: string;
  sellerId?: string;
  /** Buyer display name */
  buyer?: string;
  buyerId?: string;
  /** Both participant IDs; used for Firestore array-contains queries */
  memberIds?: string[];
  lastMessage?: string;
  /** Unix ms timestamp of the most recent message */
  lastMessageAt?: number;
  messages: Message[];
  createdAt?: any;
  updatedAt?: any;
};
