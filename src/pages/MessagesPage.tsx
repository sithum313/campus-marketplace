import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../components/EmptyState";
import { Button, page } from "../components/ui";
import { colors } from "../theme";
import { Conversation } from "../types";

export function MessagesPage({
  conversations,
  onOpen,
  onBrowse,
}: {
  conversations: Conversation[];
  onOpen: (id: string) => void;
  onBrowse: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.sub}>Keep campus meetups simple</Text>
      {conversations.length === 0 ? (
        <EmptyState
          title="Your inbox is quiet"
          message="Tap “Chat” on any product to message its seller. Conversations show up here."
          action="Browse listings"
          onAction={onBrowse}
        />
      ) : (
        <View style={{ gap: 10, marginTop: 18 }}>
          {conversations.map((c) => {
            const last = c.messages[c.messages.length - 1];
            return (
              <Pressable key={c.id} style={styles.row} onPress={() => onOpen(c.id)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{c.seller.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.seller}</Text>
                  <Text style={styles.item} numberOfLines={1}>
                    {c.itemTitle}
                  </Text>
                  <Text style={styles.last} numberOfLines={1}>
                    {last ? (last.mine ? "You: " : "") + last.text : "Say hello"}
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
});
