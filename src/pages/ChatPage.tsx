import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppIcon } from "../components/AppIcon";
import { colors } from "../theme";
import { Conversation, Message } from "../types";

const BUYER_PROMPTS = [
  { icon: "hand-right-outline", text: "Is this still available?" },
  { icon: "location-outline", text: "Can we meet at the Campus Library?" },
  { icon: "pricetag-outline", text: "Would you take 10% less?" },
  { icon: "time-outline", text: "Can I pick this up today?" },
  { icon: "shield-checkmark-outline", text: "What condition is it in?" },
];

const SELLER_PROMPTS = [
  { icon: "checkmark-circle-outline", text: "Yes, it's still available!" },
  { icon: "location-outline", text: "Library meetup works great for me." },
  { icon: "time-outline", text: "I'm free after 3 PM today." },
  { icon: "lock-closed-outline", text: "Price is firm, sorry!" },
  { icon: "thumbs-up-outline", text: "Deal! Let's arrange pickup." },
];

function formatTime(timestamp?: number | string | null): string {
  if (!timestamp) return "Just now";
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date();
  if (isNaN(date.getTime())) return "Just now";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateSeparator(timestamp?: number): string {
  if (!timestamp) return "Today";
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ChatPage({
  conversation,
  onSend,
  onBack,
}: {
  conversation: Conversation;
  onSend: (text: string) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const [showPrompts, setShowPrompts] = useState(true);
  const scroller = useRef<ScrollView>(null);

  const isSeller = isSellerProp !== undefined
    ? isSellerProp
    : Boolean(currentUserId && (conversation.sellerId === currentUserId || conversation.sellerId === "demo-seller"));

  const otherName = isSeller ? (conversation.buyer || "Campus student") : (conversation.seller || "Seller");
  const quickReplies = isSeller ? SELLER_PROMPTS : BUYER_PROMPTS;

  // Group messages by day
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; items: Message[] }[] = [];
    conversation.messages.forEach((m) => {
      const label = formatDateSeparator(m.at);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.dateLabel === label) {
        lastGroup.items.push(m);
      } else {
        groups.push({ dateLabel: label, items: [m] });
      }
    });
    return groups;
  }, [conversation.messages]);

  const send = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    onSend(clean);
    setText("");
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60);
  };
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={onBack} hitSlop={8} accessibilityLabel="Back">
            <AppIcon name="chevron-back" size={22} color={colors.ink} />
          </Pressable>

          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {otherName.slice(0, 1).toUpperCase()}
            </Text>
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {otherName}
              </Text>
              <View style={[styles.roleBadge, isSeller ? styles.buyerBadge : styles.sellerBadge]}>
                <Text style={styles.roleBadgeText}>{isSeller ? "Buyer" : "Seller"}</Text>
              </View>
            </View>
            <Text style={styles.headerStatus}>
              Active now • Campus Verified
            </Text>
          </View>
        </View>

        {/* Pinned Product Inquiry Context Banner */}
        <View style={styles.productBanner}>
          <View style={styles.productIconWrap}>
            <AppIcon name="cube-outline" size={18} color={colors.ink} />
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productTag}>
              {isSeller ? "INQUIRY ABOUT" : "INQUIRING ON"}
            </Text>
            <Text style={styles.productTitle} numberOfLines={1}>
              {conversation.itemTitle}
            </Text>
          </View>
          <View style={styles.campusBadge}>
            <AppIcon name="location-sharp" size={11} color={colors.muted} />
            <Text style={styles.campusBadgeText}>Campus Meetup</Text>
          </View>
        </View>
      </View>

      {/* Safety Notice Banner */}
      <View style={styles.safetyBox}>
        <AppIcon name="shield-checkmark" size={13} color={colors.green} />
        <Text style={styles.safetyText}>
          Safety tip: Meet in public campus spots (e.g. Student Union, Library).
        </Text>
      </View>

      {/* Messages Thread Feed */}
      <ScrollView
        ref={scroller}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
      >
        {conversation.messages.length === 0 ? (
          <View style={styles.emptyFeed}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="chatbubble-ellipses-outline" size={32} color={colors.ink} />
            </View>
            <Text style={styles.emptyHeading}>Start the conversation</Text>
            <Text style={styles.emptySub}>
              Send a quick message to coordinate details with {otherName}.
            </Text>
          </View>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <View key={groupIdx} style={styles.dateGroup}>
              {/* Date divider pill */}
              <View style={styles.dateDivider}>
                <Text style={styles.dateDividerText}>{group.dateLabel}</Text>
              </View>

              {group.items.map((m, mIdx) => {
                let isMine: boolean;
                if (m.senderRole) {
                  isMine = isSeller ? m.senderRole === "seller" : m.senderRole === "buyer";
                } else if (m.senderId && currentUserId) {
                  isMine = m.senderId === currentUserId;
                } else {
                  isMine = m.mine;
                }

                const prevMsg = mIdx > 0 ? group.items[mIdx - 1] : null;
                const prevMine = prevMsg
                  ? prevMsg.senderRole
                    ? isSeller
                      ? prevMsg.senderRole === "seller"
                      : prevMsg.senderRole === "buyer"
                    : prevMsg.mine
                  : null;
                const isSequence = prevMine === isMine;

                return (
                  <View
                    key={m.id}
                    style={[
                      styles.bubbleRow,
                      isMine ? styles.rowMine : styles.rowTheirs,
                      isSequence && styles.bubbleSequence,
                    ]}
                  >
                    {!isMine && !isSequence ? (
                      <View style={styles.miniAvatar}>
                        <Text style={styles.miniAvatarText}>
                          {otherName.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    ) : !isMine ? (
                      <View style={styles.miniAvatarSpacer} />
                    ) : null}

                    <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <Text style={[styles.messageText, isMine ? styles.textMine : styles.textTheirs]}>
                        {m.text}
                      </Text>
                      <View style={styles.metaRow}>
                        <Text style={[styles.timeText, isMine ? styles.timeMine : styles.timeTheirs]}>
                          {formatTime(m.at)}
                        </Text>
                        {isMine && (
                          <AppIcon name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Quick Prompts Carousel */}
      {showPrompts && (
        <View style={styles.quickBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickScroll}
          >
            {quickReplies.map((q, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}
                onPress={() => send(q.text)}
              >
                <AppIcon name={q.icon} size={14} color={colors.ink} />
                <Text style={styles.quickChipText}>{q.text}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Message Composer */}
      <View style={styles.composerWrapper}>
        <View style={styles.composerBar}>
          <Pressable
            style={styles.togglePromptBtn}
            onPress={() => setShowPrompts((v) => !v)}
            accessibilityLabel="Toggle suggestions"
          >
            <AppIcon
              name={showPrompts ? "flash" : "flash-outline"}
              size={18}
              color={showPrompts ? colors.yellow : colors.muted}
            />
          </Pressable>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={`Message ${otherName}…`}
            placeholderTextColor={colors.muted}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => send(text)}
          />

          <Pressable
            style={[styles.sendBtn, text.trim().length > 0 && styles.sendBtnActive]}
            onPress={() => send(text)}
            disabled={text.trim().length === 0}
            accessibilityLabel="Send message"
          >
            <AppIcon
              name="arrow-up"
              size={18}
              color={text.trim().length > 0 ? "#FFF" : colors.muted}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 16,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerAvatarText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
  onlineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.green,
    position: "absolute",
    bottom: -1,
    right: -1,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  buyerBadge: {
    backgroundColor: "rgba(133,218,225,0.25)",
  },
  sellerBadge: {
    backgroundColor: "rgba(246,197,42,0.25)",
  },
  roleBadgeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700",
  },
  headerStatus: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 1,
  },
  productBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  productIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  productDetails: {
    flex: 1,
  },
  productTag: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  productTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  campusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  campusBadgeText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
  },
  safetyBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "rgba(46,158,107,0.08)",
  },
  safetyText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "600",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    flexGrow: 1,
  },
  emptyFeed: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  emptyHeading: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  emptySub: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  dateGroup: {
    marginBottom: 14,
  },
  dateDivider: {
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  dateDividerText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
    gap: 6,
  },
  bubbleSequence: {
    marginBottom: 4,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  rowTheirs: {
    justifyContent: "flex-start",
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.pink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  miniAvatarText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  miniAvatarSpacer: {
    width: 28,
  },
  bubble: {
    maxWidth: "76%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleMine: {
    backgroundColor: colors.ink,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMine: {
    color: "#FFFFFF",
  },
  textTheirs: {
    color: colors.ink,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  timeMine: {
    color: "rgba(255,255,255,0.65)",
  },
  timeTheirs: {
    color: colors.muted,
  },
  quickBar: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingVertical: 8,
  },
  quickScroll: {
    paddingHorizontal: 16,
    gap: 8,
    maxWidth: 560,
    alignSelf: "center",
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quickChipPressed: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
  },
  quickChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600",
  },
  composerWrapper: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  composerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  togglePromptBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.ink,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: colors.ink,
  },
});
