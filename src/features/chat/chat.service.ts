/**
 * feature/buyer-seller-chatting – Firebase service layer
 *
 * All Firestore reads/writes for the chat feature live here.
 * Import these helpers in App.tsx (or a context) instead of
 * writing Firestore calls inline.
 */

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Conversation, Message } from "./chat.types";

// ─── helpers ──────────────────────────────────────────────────────────────────

const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

// ─── Firestore listeners ───────────────────────────────────────────────────────

/**
 * Subscribe to all conversations the current user is a member of.
 * Works for both buyer (buyerId == uid) and seller (sellerId == uid)
 * because Firestore's array-contains query on `memberIds` covers both roles.
 *
 * @returns unsubscribe function – call it inside useEffect cleanup.
 */
export function subscribeToConversations(
  uid: string,
  onUpdate: (conversations: Conversation[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!db) return () => {};

  const q = query(
    collection(db, "conversations"),
    where("memberIds", "array-contains", uid),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Conversation[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Conversation, "id" | "messages">),
        messages: [], // messages are fetched separately via subscribeToMessages
      }));
      list.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
      onUpdate(list);
    },
    (err) => {
      console.warn("[chat] Conversations sync error:", err.message);
      onError?.(err);
    },
  );
}

/**
 * Subscribe to messages inside a single conversation (real-time).
 * Skips local/demo conversation IDs that start with "c-".
 *
 * @returns unsubscribe function
 */
export function subscribeToMessages(
  conversationId: string,
  currentUid: string,
  onUpdate: (msgs: Message[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!db || conversationId.startsWith("c-")) return () => {};

  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text || "",
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          mine: data.senderId === currentUid,
          at: data.createdAt?.toMillis?.() || Date.now(),
        };
      });
      onUpdate(msgs);
    },
    (err) => {
      console.warn("[chat] Messages sync error:", err.message);
      onError?.(err);
    },
  );
}

// ─── Firestore mutations ───────────────────────────────────────────────────────

/**
 * Create a new conversation document in Firestore.
 * Returns the new conversation's Firestore ID.
 */
export async function createConversation(payload: {
  itemId: string;
  itemTitle: string;
  sellerName: string;
  sellerId: string;
  buyerName: string;
  buyerId: string;
}): Promise<string> {
  if (!db) throw new Error("Firestore is not initialised");

  const docRef = await addDoc(
    collection(db, "conversations"),
    clean({
      itemId: payload.itemId,
      itemTitle: payload.itemTitle,
      seller: payload.sellerName,
      sellerId: payload.sellerId,
      buyer: payload.buyerName,
      buyerId: payload.buyerId,
      memberIds: [payload.buyerId, payload.sellerId],
      lastMessage: "",
      lastMessageAt: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  return docRef.id;
}

/**
 * Send a message to an existing Firestore conversation.
 * Updates the conversation's `lastMessage` and `lastMessageAt` fields too.
 */
export async function sendMessage(payload: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "buyer" | "seller";
  text: string;
}): Promise<void> {
  if (!db) throw new Error("Firestore is not initialised");

  await addDoc(
    collection(db, "conversations", payload.conversationId, "messages"),
    {
      senderId: payload.senderId,
      senderName: payload.senderName,
      senderRole: payload.senderRole,
      text: payload.text,
      createdAt: serverTimestamp(),
    },
  );

  await updateDoc(doc(db, "conversations", payload.conversationId), {
    lastMessage: payload.text,
    lastMessageAt: Date.now(),
    updatedAt: serverTimestamp(),
  });
}
