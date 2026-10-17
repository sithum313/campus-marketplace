/**
 * feature/buyer-seller-chatting
 *
 * Public surface – import everything you need from here.
 *
 * Usage in App.tsx / SellerApp.tsx:
 *
 *   import {
 *     ChatPage,
 *     MessagesPage,
 *     subscribeToConversations,
 *     subscribeToMessages,
 *     createConversation,
 *     sendMessage,
 *     filterBuyerConversations,
 *     filterSellerConversations,
 *     buildLocalConversation,
 *     appendLocalMessage,
 *     seedConversations,
 *   } from "./features/chat";
 *   import type { Conversation, Message } from "./features/chat";
 */

// Types
export type { Conversation, Message } from "./chat.types";

// UI components
export { ChatPage } from "./ChatPage";
export { MessagesPage } from "./MessagesPage";

// Firebase service (Firestore reads/writes)
export {
  subscribeToConversations,
  subscribeToMessages,
  createConversation,
  sendMessage,
} from "./chat.service";

// Pure logic helpers
export {
  buildLocalConversation,
  appendLocalMessage,
  filterSellerConversations,
  filterBuyerConversations,
} from "./chat.helpers";
export type { ChatMode, ChatContext } from "./chat.helpers";

// Demo / seed data
export { seedConversations } from "./chat.seed";
