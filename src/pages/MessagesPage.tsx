import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../components/EmptyState";
import { Button, page } from "../components/ui";
import { colors } from "../theme";
import { Conversation } from "../types";
import React from "react";

export function MessagesPage({
  conversations,
  onOpen,
  onBrowse,
  currentUserId,
}: {
  conversations: Conversation[];
  onOpen: (id: string) => void;
  onBrowse?: () => void;
  currentUserId?: string;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.sub}>Keep campus meetups simple</Text>
      {conversations.length === 0 ? (
        <EmptyState
          title="Your inbox is quiet"
          message="Tap “Chat” on any product to message its seller. Conversations show up here."
          action={onBrowse ? "Browse listings" : undefined}
          onAction={onBrowse}
        />
      ) : (
        <View style={{ gap: 10, marginTop: 18 }}>
          {conversations.map((c) => {
            const isSeller = Boolean(currentUserId && c.sellerId === currentUserId);
            const otherParty = isSeller ? (c.buyer || "Buyer") : c.seller;
            const last = c.messages[c.messages.length - 1];
            const isLastMine = last
              ? last.senderId
                ? currentUserId
                  ? last.senderId === currentUserId
                  : last.mine
                : last.mine
              : false;

            return (
              <Pressable key={c.id} style={styles.row} onPress={() => onOpen(c.id)}>
                <View style={[styles.avatar, isSeller && { backgroundColor: colors.teal }]}>
                  <Text style={styles.avatarText}>{otherParty.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.name}>{otherParty}</Text>
                    {isSeller ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Buyer inquiry</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.item} numberOfLines={1}>
                    {c.itemTitle}
                  </Text>
                  <Text style={styles.last} numberOfLines={1}>
                    {last ? (isLastMine ? "You: " : "") + last.text : (c.lastMessage || "Say hello")}
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
  badge: {
    backgroundColor: colors.teal,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700",
  },
});
