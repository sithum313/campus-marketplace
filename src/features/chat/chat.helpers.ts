/**
 * feature/buyer-seller-chatting – App-level state & action helpers
 *
 * These are the pure logic helpers that App.tsx uses:
 *   – openChat   (buyer taps "Chat" on a listing)
 *   – sendMessage (local/offline fallback when Firebase is not configured)
 *   – conversation filtering (buyer view vs seller view)
 *
 * Nothing in this file renders JSX or imports React.
 */

import { Conversation, Message } from "./chat.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatMode = "buyer" | "seller";

/** Minimal subset of app state the helpers need */
export interface ChatContext {
  ownerId: string;
  ownerName: string;
  mode: ChatMode;
  /** Whether the user is signed in */
  isLoggedIn: boolean;
}

// ─── Conversation helpers ─────────────────────────────────────────────────────

/**
 * Build the local/demo conversation object created when Firebase is unavailable.
 */
export function buildLocalConversation(
  item: { id: string; title: string; seller: string; sellerId?: string },
  ctx: Pick<ChatContext, "ownerId" | "ownerName">,
): Conversation {
  const targetSellerId = item.sellerId || "demo-seller";
  return {
    id: `c-${item.id}`,
    itemId: item.id,
    itemTitle: item.title,
    seller: item.seller,
    sellerId: targetSellerId,
    buyer: ctx.ownerName,
    buyerId: ctx.ownerId,
    memberIds: [ctx.ownerId, targetSellerId],
    messages: [],
  };
}

/**
 * Append a local (offline) message to the matching conversation.
 * Returns a new conversations array; does NOT mutate the original.
 */
export function appendLocalMessage(
  conversations: Conversation[],
  conversationId: string,
  text: string,
  ctx: Pick<ChatContext, "ownerId" | "ownerName" | "mode">,
): Conversation[] {
  const newMessage: Message = {
    id: String(Date.now()),
    mine: true,
    senderId: ctx.ownerId,
    senderName: ctx.ownerName,
    senderRole: ctx.mode,
    text,
    at: Date.now(),
  };

  return conversations.map((c) =>
    c.id !== conversationId
      ? c
      : {
          ...c,
          lastMessage: text,
          lastMessageAt: Date.now(),
          messages: [...c.messages, newMessage],
        },
  );
}

// ─── Conversation filtering ───────────────────────────────────────────────────

/**
 * Returns conversations the logged-in user participates in as the SELLER.
 * Falls back to demo-seller conversations when the user is viewing in seller mode
 * but has no real sellerId assigned to any conversation yet.
 */
export function filterSellerConversations(
  conversations: Conversation[],
  ctx: Pick<ChatContext, "ownerId" | "ownerName" | "isLoggedIn" | "mode">,
): Conversation[] {
  return conversations.filter(
    (c) =>
      c.sellerId === ctx.ownerId ||
      (c.sellerId === "demo-seller" && (!ctx.isLoggedIn || ctx.mode === "seller")) ||
      c.seller === ctx.ownerName ||
      (!c.sellerId && c.memberIds?.includes(ctx.ownerId)),
  );
}

/**
 * Returns conversations the logged-in user participates in as the BUYER.
 */
export function filterBuyerConversations(
  conversations: Conversation[],
  ctx: Pick<ChatContext, "ownerId" | "ownerName" | "isLoggedIn">,
): Conversation[] {
  return conversations.filter(
    (c) =>
      c.buyerId === ctx.ownerId ||
      // demo buyers (offline mode only)
      (c.buyerId === "buyer-alex" && !ctx.isLoggedIn) ||
      (c.buyerId === "buyer-nethmi" && !ctx.isLoggedIn) ||
      c.buyer === ctx.ownerName ||
      (!c.buyerId && c.memberIds?.includes(ctx.ownerId)),
  );
}
