import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
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

type FilterTab = "all" | "buying" | "selling" | "meetups" | "unread";

export function MessagesPage({
  conversations: propConversations,
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
  const [conversations, setConversations] = useState<Conversation[]>(propConversations);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [actionModalChat, setActionModalChat] = useState<Conversation | null>(null);

  // Sync state if props change
  useMemo(() => {
    setConversations(propConversations);
  }, [propConversations]);

  // Active stats counts
  const stats = useMemo(() => {
    let meetupsCount = 0;
    let offersCount = 0;
    let unreadTotal = 0;

    conversations.forEach((c) => {
      if (c.activeMeetup) meetupsCount++;
      if (c.activeOffer) offersCount++;
      if (c.unreadCount && c.unreadCount > 0) unreadTotal += c.unreadCount;
    });

    return { meetupsCount, offersCount, unreadTotal };
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    return conversations
      .filter((c) => {
        const isCurrentUserSeller = isSeller !== undefined
          ? isSeller
          : Boolean(
              currentUserId &&
                (c.sellerId === currentUserId || c.sellerId === "demo-seller"),
            );
        const otherParty = isCurrentUserSeller
          ? c.buyer || "Campus student"
          : c.seller || "Seller";

        // Search match
        const query = search.trim().toLowerCase();
        const matchSearch =
          query.length === 0 ||
          otherParty.toLowerCase().includes(query) ||
          c.itemTitle.toLowerCase().includes(query) ||
          (c.lastMessage && c.lastMessage.toLowerCase().includes(query)) ||
          (c.activeMeetup?.location && c.activeMeetup.location.toLowerCase().includes(query));

        if (!matchSearch) return false;

        // Tab filter match
        if (filter === "buying") {
          return !isCurrentUserSeller;
        }
        if (filter === "selling") {
          return isCurrentUserSeller;
        }
        if (filter === "meetups") {
          return Boolean(c.activeMeetup);
        }
        if (filter === "unread") {
          if (c.unreadCount && c.unreadCount > 0) return true;
          const last = c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
          const isMine = last
            ? (last.senderRole
                ? (isCurrentUserSeller ? last.senderRole === "seller" : last.senderRole === "buyer")
                : (last.senderId && currentUserId ? last.senderId === currentUserId : last.mine))
            : false;
          return !isMine;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned conversations always on top
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
      });
  }, [conversations, search, filter, isSeller, currentUserId]);

  const togglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );
    setActionModalChat(null);
  };

  const toggleReadStatus = (id: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, unreadCount: c.unreadCount ? 0 : 1 } : c,
      ),
    );
    setActionModalChat(null);
  };

  const deleteConversation = (id: string) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this chat? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setConversations((prev) => prev.filter((c) => c.id !== id));
            setActionModalChat(null);
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ─── Header & Quick Stats ───────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pageTitle}>
            {isSeller ? "Customer Inquiries" : "Messages"}
          </Text>
          <Text style={styles.pageSubtitle}>
            {isSeller
              ? "Questions & meetup proposals from students on campus"
              : "Direct messaging with verified campus student sellers"}
          </Text>
        </View>

        <View style={styles.statsPillGroup}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{conversations.length} chats</Text>
          </View>
        </View>
      </View>

      {/* Mini Summary Pills */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryChip}>
          <AppIcon name="chatbubble-ellipses-outline" size={13} color={colors.ink} />
          <Text style={styles.summaryChipText}>{conversations.length} Active</Text>
        </View>
        {stats.meetupsCount > 0 && (
          <View style={[styles.summaryChip, { backgroundColor: "#DCFCE7", borderColor: "#BBF7D0" }]}>
            <AppIcon name="location-sharp" size={13} color="#15803D" />
            <Text style={[styles.summaryChipText, { color: "#15803D" }]}>
              {stats.meetupsCount} Meetup{stats.meetupsCount === 1 ? "" : "s"}
            </Text>
          </View>
        )}
        {stats.offersCount > 0 && (
          <View style={[styles.summaryChip, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}>
            <AppIcon name="pricetag" size={13} color="#B45309" />
            <Text style={[styles.summaryChipText, { color: "#B45309" }]}>
              {stats.offersCount} Offer{stats.offersCount === 1 ? "" : "s"}
            </Text>
          </View>
        )}
      </View>

      {/* ─── Search Bar ─────────────────────────────────────────────────── */}
      <View style={styles.searchBar}>
        <AppIcon name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by student, product, or meetup location…"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <AppIcon name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* ─── Filter Tabs ────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Pressable
          style={[styles.filterChip, filter === "all" && styles.filterChipActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterChipText, filter === "all" && styles.filterChipTextActive]}>
            All ({conversations.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === "buying" && styles.filterChipActive]}
          onPress={() => setFilter("buying")}
        >
          <AppIcon
            name="cart-outline"
            size={13}
            color={filter === "buying" ? "#FFF" : colors.ink}
          />
          <Text style={[styles.filterChipText, filter === "buying" && styles.filterChipTextActive]}>
            Buying
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === "selling" && styles.filterChipActive]}
          onPress={() => setFilter("selling")}
        >
          <AppIcon
            name="storefront-outline"
            size={13}
            color={filter === "selling" ? "#FFF" : colors.ink}
          />
          <Text style={[styles.filterChipText, filter === "selling" && styles.filterChipTextActive]}>
            Selling
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === "meetups" && styles.filterChipActive]}
          onPress={() => setFilter("meetups")}
        >
          <AppIcon
            name="location-outline"
            size={13}
            color={filter === "meetups" ? "#FFF" : colors.ink}
          />
          <Text style={[styles.filterChipText, filter === "meetups" && styles.filterChipTextActive]}>
            Meetups ({stats.meetupsCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === "unread" && styles.filterChipActive]}
          onPress={() => setFilter("unread")}
        >
          <View style={styles.unreadDot} />
          <Text style={[styles.filterChipText, filter === "unread" && styles.filterChipTextActive]}>
            Unread
          </Text>
        </Pressable>
      </ScrollView>

      {/* ─── Conversation Cards List ─────────────────────────────────────── */}
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
              : filter === "meetups"
              ? "No planned meetups yet"
              : filter === "unread"
              ? "All caught up! No unread chats"
              : isSeller
              ? "No customer inquiries yet"
              : "Your inbox is quiet"}
          </Text>
          <Text style={styles.emptyMessage}>
            {search.length > 0
              ? `No chats matched "${search}". Try searching for another keyword or person.`
              : filter === "meetups"
              ? "Open a conversation and tap 'Propose Meetup' to arrange an on-campus pickup."
              : isSeller
              ? "When campus buyers inquire about your items or events, conversations will appear here."
              : "Tap 'Chat with Seller' on any product in the marketplace to start a conversation."}
          </Text>

          {search.length > 0 || filter !== "all" ? (
            <Pressable
              style={styles.emptyActionBtn}
              onPress={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              <AppIcon name="refresh-outline" size={17} color="#FFF" />
              <Text style={styles.emptyActionText}>Reset Filters</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.emptyActionBtn} onPress={onBrowse}>
              <AppIcon name="storefront-outline" size={17} color="#FFF" />
              <Text style={styles.emptyActionText}>
                {isSeller ? "Manage Products" : "Browse Campus Listings"}
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={{ gap: 10, marginTop: 18 }}>
          {conversations.map((c) => {
            const isCurrentUserSeller = isSeller !== undefined
              ? isSeller
              : Boolean(
                  currentUserId &&
                    (c.sellerId === currentUserId || c.sellerId === "demo-seller"),
                );
            const otherParty = isCurrentUserSeller
              ? c.buyer || "Campus student"
              : c.seller || "Seller";

            const last = c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
            const isMine = last
              ? (last.senderRole
                  ? (isCurrentUserSeller ? last.senderRole === "seller" : last.senderRole === "buyer")
                  : (last.senderId && currentUserId ? last.senderId === currentUserId : last.mine))
              : false;
            const displaySnippet = last
              ? (isMine ? "You: " : "") + last.text
              : c.lastMessage
              ? c.lastMessage
              : "Tap to open chat";

            const timeLabel = formatConversationTime(
              last?.at || c.lastMessageAt || (c.createdAt ? Date.now() - 3600000 : null),
            );

            const avatarBg = getAvatarColor(otherParty);
            const hasUnread = Boolean(c.unreadCount && c.unreadCount > 0);

            return (
              <Pressable
                key={c.id}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                  c.pinned && styles.cardPinned,
                  hasUnread && styles.cardUnread,
                ]}
                onPress={() => onOpen(c.id)}
                onLongPress={() => setActionModalChat(c)}
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
                  {/* Top Name Row */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.nameAndRole}>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {otherParty}
                      </Text>
                      {c.pinned && (
                        <View style={styles.pinIconWrap}>
                          <AppIcon name="pin" size={11} color={colors.ink} />
                        </View>
                      )}
                      <View
                        style={[
                          styles.roleTag,
                          isCurrentUserSeller ? styles.buyerRole : styles.sellerRole,
                        ]}
                      >
                        <Text style={styles.roleTagText}>
                          {isCurrentUserSeller ? "Buyer" : "Seller"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.timeLabel, hasUnread && styles.timeLabelUnread]}>
                      {timeLabel}
                    </Text>
                  </View>

                  {/* Linked Product Chip */}
                  <View style={styles.productTag}>
                    <AppIcon name="pricetag" size={11} color={colors.muted} />
                    <Text style={styles.productTagText} numberOfLines={1}>
                      {c.itemTitle}
                    </Text>
                    {c.itemPrice ? (
                      <Text style={styles.productPriceText}>${c.itemPrice}</Text>
                    ) : null}
                  </View>

                  {/* Meetup / Offer Status Badges */}
                  {c.activeMeetup ? (
                    <View style={styles.activeMeetupBadge}>
                      <AppIcon name="location-sharp" size={11} color="#15803D" />
                      <Text style={styles.activeMeetupText} numberOfLines={1}>
                        Meetup: {c.activeMeetup.location}
                      </Text>
                    </View>
                  ) : c.activeOffer ? (
                    <View style={styles.activeOfferBadge}>
                      <AppIcon name="pricetag" size={11} color="#B45309" />
                      <Text style={styles.activeOfferText} numberOfLines={1}>
                        Offer: ${c.activeOffer.amount.toFixed(2)} (
                        {c.activeOffer.status === "accepted" ? "Agreed" : "Pending"})
                      </Text>
                    </View>
                  ) : null}

                  {/* Message Snippet & Arrow */}
                  <View style={styles.snippetRow}>
                    <Text
                      style={[
                        styles.messageSnippet,
                        hasUnread && styles.messageSnippetUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {displaySnippet}
                    </Text>
                    {hasUnread ? (
                      <View style={styles.unreadCountCircle}>
                        <Text style={styles.unreadCountText}>{c.unreadCount || 1}</Text>
                      </View>
                    ) : (
                      <AppIcon name="chevron-forward" size={15} color={colors.line} />
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

      {/* ─── CONVERSATION OPTIONS MODAL (PIN / READ / DELETE) ─────────── */}
      <Modal visible={actionModalChat !== null} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setActionModalChat(null)} />
          {actionModalChat && (
            <View style={styles.modalSheet}>
              <View style={styles.modalDragHandle} />
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Chat Options</Text>
                  <Text style={styles.modalSubtitle}>
                    {actionModalChat.itemTitle} with{" "}
                    {isSeller ? actionModalChat.buyer : actionModalChat.seller}
                  </Text>
                </View>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setActionModalChat(null)}
                >
                  <AppIcon name="close" size={20} color={colors.ink} />
                </Pressable>
              </View>

              <View style={styles.actionOptionsList}>
                <Pressable
                  style={styles.actionOptionBtn}
                  onPress={() => togglePin(actionModalChat.id)}
                >
                  <AppIcon
                    name={actionModalChat.pinned ? "pin-outline" : "pin"}
                    size={18}
                    color={colors.ink}
                  />
                  <Text style={styles.actionOptionText}>
                    {actionModalChat.pinned ? "Unpin from Top" : "Pin to Top"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.actionOptionBtn}
                  onPress={() => toggleReadStatus(actionModalChat.id)}
                >
                  <AppIcon name="mail-unread-outline" size={18} color={colors.ink} />
                  <Text style={styles.actionOptionText}>
                    {actionModalChat.unreadCount ? "Mark as Read" : "Mark as Unread"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.actionOptionBtn, { borderColor: "#FCA5A5" }]}
                  onPress={() => deleteConversation(actionModalChat.id)}
                >
                  <AppIcon name="trash-outline" size={18} color={colors.red} />
                  <Text style={[styles.actionOptionText, { color: colors.red }]}>
                    Delete Conversation
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 130,
    maxWidth: 580,
    alignSelf: "center",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
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
  statsPillGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    fontSize: 12,
  },
  summaryBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  summaryChipText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
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
    paddingHorizontal: 13,
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
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: "#F8FAFC",
    transform: [{ scale: 0.995 }],
  },
  cardPinned: {
    borderLeftWidth: 4,
    borderLeftColor: colors.ink,
  },
  cardUnread: {
    borderColor: "rgba(30,34,48,0.25)",
    backgroundColor: "#FAFCFF",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    marginBottom: 4,
  },
  nameAndRole: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    paddingRight: 6,
  },
  contactName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    maxWidth: "60%",
  },
  pinIconWrap: {
    backgroundColor: colors.bg,
    padding: 3,
    borderRadius: 6,
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  buyerRole: {
    backgroundColor: "rgba(133,218,225,0.25)",
  },
  sellerRole: {
    backgroundColor: "rgba(246,197,42,0.25)",
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
  timeLabelUnread: {
    color: colors.ink,
    fontWeight: "800",
  },
  productTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.bg,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
    maxWidth: "95%",
  },
  productTagText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },
  productPriceText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 3,
  },
  activeMeetupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  activeMeetupText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "700",
  },
  activeOfferBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  activeOfferText: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "700",
  },
  snippetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  messageSnippet: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
  },
  messageSnippetUnread: {
    color: colors.ink,
    fontWeight: "700",
  },
  unreadCountCircle: {
    backgroundColor: colors.ink,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadCountText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },

  /* Empty state */
  emptyCard: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 28,
    alignItems: "center",
    marginTop: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyMessage: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
    maxWidth: 320,
  },
  emptyActionBtn: {
    backgroundColor: colors.ink,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 20,
  },
  emptyActionText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  actionOptionsList: {
    gap: 10,
  },
  actionOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  actionOptionText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  avatarText: { color: colors.ink, fontWeight: "900", fontSize: 18 },
  name: { color: colors.ink, fontWeight: "800", fontSize: 15 },
  item: { color: colors.muted, fontSize: 11, marginTop: 1 },
  last: { color: colors.ink, fontSize: 13, marginTop: 4 },
  roleTag: { backgroundColor: "rgba(133,218,225,0.25)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleTagText: { color: colors.ink, fontSize: 10, fontWeight: "700" },
});
