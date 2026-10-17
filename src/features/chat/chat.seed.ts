/**
 * feature/buyer-seller-chatting – seed data
 *
 * Demo conversations used when Firebase is not configured.
 * Mirrors the shape of Firestore documents in /conversations/{id}.
 */

import { Conversation } from "./chat.types";

export const seedConversations: Conversation[] = [
  {
    id: "c-seed-1",
    itemId: "1",
    itemTitle: "Calculus: Early Transcendentals",
    seller: "Maya R.",
    sellerId: "demo-seller",
    buyer: "Alex P.",
    buyerId: "buyer-alex",
    memberIds: ["demo-seller", "buyer-alex"],
    lastMessage: "Can we meet at the library?",
    lastMessageAt: Date.now() - 3_600_000,
    messages: [
      {
        id: "m1",
        text: "Hi, is the calculus textbook still available?",
        mine: false,
        senderId: "buyer-alex",
        senderRole: "buyer",
        at: Date.now() - 7_200_000,
      },
      {
        id: "m2",
        text: "Yes, it is! Clean pages, no highlights.",
        mine: true,
        senderId: "demo-seller",
        senderRole: "seller",
        at: Date.now() - 5_400_000,
      },
      {
        id: "m3",
        text: "Can we meet at the library?",
        mine: false,
        senderId: "buyer-alex",
        senderRole: "buyer",
        at: Date.now() - 3_600_000,
      },
    ],
  },
  {
    id: "c-seed-2",
    itemId: "3",
    itemTitle: "Noise-cancelling headphones",
    seller: "Alex P.",
    sellerId: "demo-seller",
    buyer: "Nethmi K.",
    buyerId: "buyer-nethmi",
    memberIds: ["demo-seller", "buyer-nethmi"],
    lastMessage: "Price is fixed, thanks!",
    lastMessageAt: Date.now() - 86_400_000,
    messages: [
      {
        id: "m4",
        text: "Would you take $90 for the headphones?",
        mine: false,
        senderId: "buyer-nethmi",
        senderRole: "buyer",
        at: Date.now() - 90_000_000,
      },
      {
        id: "m5",
        text: "Price is fixed, thanks!",
        mine: true,
        senderId: "demo-seller",
        senderRole: "seller",
        at: Date.now() - 86_400_000,
      },
    ],
  },
];
