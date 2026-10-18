/**
 * feature/buyer-seller-chatting – MessagesPage (conversation list)
 *
 * Shared by buyer tab ("Messages") and seller tab ("Messages").
 * The `isSeller` prop controls titles, avatar colour, and role tags.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { Button, page } from "../../components/ui";
import { colors } from "../../theme";
import { Conversation } from "./chat.types";

export function MessagesPage({
  conversations,
  onOpen,
  onBrowse,
  isSeller,
  currentUserId,
}: {
  conversations: Conversation[];
  onOpen: (id: string) => void;
  onBrowse: () => void;
  isSeller?: boolean;
  currentUserId?: string;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{isSeller ? "Customer inquiries" : "Messages"}</Text>
      <Text style={styles.sub}>
        {isSeller
          ? "Questions from buyers about your items & events"
          : "Keep campus meetups simple"}
      </Text>

      {conversations.length === 0 ? (
        <EmptyState
          title={isSeller ? "No inquiries yet" : "Your inbox is quiet"}
          message={
            isSeller
              ? "When campus students ask questions about your products or events, their chats will appear here."
              : "Tap "Chat" on any product to message its seller. Conversations show up here."
          }
          action={isSeller ? "Manage listings" : "Browse listings"}
          onAction={onBrowse}
        />
      ) : (
        <View style={{ gap: 10, marginTop: 18 }}>
          {conversations.map((c) => {
            const isCurrentUserSeller =
              isSeller !== undefined
                ? isSeller
                : Boolean(
                    currentUserId &&
                      (c.sellerId === currentUserId || c.sellerId === "demo-seller"),
                  );

            const otherParty = isCurrentUserSeller
              ? (c.buyer || "Campus student")
              : (c.seller || "Seller");

            const last =
              c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;

            const isMine = last
              ? last.senderRole
                ? isCurrentUserSeller
                  ? last.senderRole === "seller"
                  : last.senderRole === "buyer"
                : last.senderId && currentUserId
                  ? last.senderId === currentUserId
                  : last.mine
              : false;

            const displaySnippet = last
              ? (isMine ? "You: " : "") + last.text
              : c.lastMessage || "Say hello";

            return (
              <Pressable key={c.id} style={styles.row} onPress={() => onOpen(c.id)}>
                <View style={[styles.avatar, isCurrentUserSeller && { backgroundColor: colors.teal }]}>
                  <Text style={styles.avatarText}>
                    {otherParty.slice(0, 1).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.name}>{otherParty}</Text>
                    {isCurrentUserSeller && (
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>Buyer</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.item} numberOfLines={1}>
                    {c.itemTitle}
                  </Text>
                  <Text style={styles.last} numberOfLines={1}>
                    {displaySnippet}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: page,
  title: { color: colors.ink, fontSize: 28, fontWeight: "800" },
  sub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.ink, fontWeight: "900", fontSize: 18 },
  name: { color: colors.ink, fontWeight: "800", fontSize: 15 },
  item: { color: colors.muted, fontSize: 11, marginTop: 1 },
  last: { color: colors.ink, fontSize: 13, marginTop: 4 },
  roleTag: {
    backgroundColor: "rgba(133,218,225,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleTagText: { color: colors.ink, fontSize: 10, fontWeight: "700" },
});
