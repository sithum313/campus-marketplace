import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppIcon } from "../components/AppIcon";
import { colors } from "../theme";
import { Conversation } from "../types";

function formatConversationTime(timestamp?: number | null): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffHours < 48) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const AVATAR_COLORS = [
  colors.teal,
  colors.pink,
  colors.blue,
  colors.yellow,
  "#D9E8F5",
  "#FCE8D5",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const isCurrentUserSeller = isSeller !== undefined
        ? isSeller
        : Boolean(currentUserId && (c.sellerId === currentUserId || c.sellerId === "demo-seller"));
      const otherParty = isCurrentUserSeller ? (c.buyer || "Campus student") : (c.seller || "Seller");

      const matchSearch =
        search.trim().length === 0 ||
        otherParty.toLowerCase().includes(search.toLowerCase()) ||
        c.itemTitle.toLowerCase().includes(search.toLowerCase()) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (filter === "unread") {
        const last = c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
        const isMine = last
          ? (last.senderRole
              ? (isCurrentUserSeller ? last.senderRole === "seller" : last.senderRole === "buyer")
              : (last.senderId && currentUserId ? last.senderId === currentUserId : last.mine))
          : false;
        return !isMine;
      }

      return true;
    });
  }, [conversations, search, filter, isSeller, currentUserId]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Title & Stats Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pageTitle}>
            {isSeller ? "Customer Inquiries" : "Messages"}
          </Text>
          <Text style={styles.pageSubtitle}>
            {isSeller
              ? "Questions from campus students about your products & events"
              : "Direct chatting with verified campus sellers"}
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{conversations.length}</Text>
        </View>
      </View>

      {/* Modern Search Bar */}
      <View style={styles.searchBar}>
        <AppIcon name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, product, or keyword…"
          placeholderTextColor={colors.muted}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <AppIcon name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, filter === "all" && styles.filterChipActive]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === "all" && styles.filterChipTextActive,
            ]}
          >
            All chats ({conversations.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === "unread" && styles.filterChipActive]}
          onPress={() => setFilter("unread")}
        >
          <View style={styles.unreadDot} />
          <Text
            style={[
              styles.filterChipText,
              filter === "unread" && styles.filterChipTextActive,
            ]}
          >
            Unread
          </Text>
        </Pressable>
      </View>

      {/* Conversation Cards List */}
      {filteredConversations.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyCircle}>
            <AppIcon
              name={search.length > 0 ? "search-outline" : "chatbubble-ellipses-outline"}
              size={34}
              color={colors.ink}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {search.length > 0
              ? "No matching conversations"
              : isSeller
              ? "No customer inquiries yet"
              : "Your inbox is quiet"}
          </Text>
          <Text style={styles.emptyMessage}>
            {search.length > 0
              ? `No chats matched "${search}". Try searching for another keyword or person.`
              : isSeller
              ? "When campus buyers inquire about your items or events, conversations will appear here."
              : "Tap 'Chat with Seller' on any product in the marketplace to start a conversation."}
          </Text>
          <Pressable style={styles.emptyActionBtn} onPress={onBrowse}>
            <AppIcon name="storefront-outline" size={17} color="#FFF" />
            <Text style={styles.emptyActionText}>
              {isSeller ? "Manage Products" : "Browse Campus Listings"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cardsList}>
          {filteredConversations.map((c) => {
            const isCurrentUserSeller = isSeller !== undefined
              ? isSeller
              : Boolean(currentUserId && (c.sellerId === currentUserId || c.sellerId === "demo-seller"));
            const otherParty = isCurrentUserSeller
              ? (c.buyer || "Campus student")
              : (c.seller || "Seller");

            const last = c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
            const isMine = last
              ? (last.senderRole
                  ? (isCurrentUserSeller ? last.senderRole === "seller" : last.senderRole === "buyer")
                  : (last.senderId && currentUserId ? last.senderId === currentUserId : last.mine))
              : false;

            const displaySnippet = last
              ? (isMine ? "You: " : "") + last.text
              : (c.lastMessage ? c.lastMessage : "Tap to open chat");

            const timeLabel = formatConversationTime(
              last?.at || c.lastMessageAt || (c.createdAt ? Date.now() - 3600000 : null)
            );

            const avatarBg = getAvatarColor(otherParty);

            return (
              <Pressable
                key={c.id}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => onOpen(c.id)}
              >
                {/* Contact Avatar */}
                <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                  <Text style={styles.avatarText}>
                    {otherParty.slice(0, 1).toUpperCase()}
                  </Text>
                  <View style={styles.avatarOnlineDot} />
                </View>

                {/* Conversation Details */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.nameAndRole}>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {otherParty}
                      </Text>
                      <View style={[styles.roleTag, isCurrentUserSeller ? styles.buyerRole : styles.sellerRole]}>
                        <Text style={styles.roleTagText}>
                          {isCurrentUserSeller ? "Buyer" : "Seller"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.timeLabel}>{timeLabel}</Text>
                  </View>

                  {/* Linked Product Tag */}
                  <View style={styles.productTag}>
                    <AppIcon name="pricetag" size={11} color={colors.muted} />
                    <Text style={styles.productTagText} numberOfLines={1}>
                      {c.itemTitle}
                    </Text>
                  </View>

                  {/* Message Snippet & Arrow */}
                  <View style={styles.snippetRow}>
                    <Text style={styles.messageSnippet} numberOfLines={1}>
                      {displaySnippet}
                    </Text>
                    <AppIcon name="chevron-forward" size={16} color={colors.line} />
                  </View>
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
  container: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 130,
    maxWidth: 560,
    alignSelf: "center",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  pageTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  countBadge: {
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  countBadgeText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 13,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: colors.ink,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#FFF",
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.yellow,
  },
  cardsList: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 14,
    alignItems: "center",
  },
  cardPressed: {
    backgroundColor: "#F9FAFC",
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: {
    color: colors.ink,
    fontWeight: "900",
    fontSize: 18,
  },
  avatarOnlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green,
    position: "absolute",
    bottom: -1,
    right: -1,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameAndRole: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  contactName: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 15,
  },
  roleTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  buyerRole: {
    backgroundColor: "rgba(133,218,225,0.3)",
  },
  sellerRole: {
    backgroundColor: "rgba(246,197,42,0.3)",
  },
  roleTagText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700",
  },
  timeLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  productTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  productTagText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  snippetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  messageSnippet: {
    color: colors.ink,
    fontSize: 13,
    flex: 1,
    marginRight: 6,
  },
  emptyCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 32,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyMessage: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 320,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyActionText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
  },
});
