import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppIcon } from "../components/AppIcon";
import { Field, ScreenHeader } from "../components/ui";
import { colors } from "../theme";
import { Conversation, MeetupDetails, Message, OfferDetails } from "../types";

export const CAMPUS_MEETUP_SPOTS = [
  {
    id: "lib-lobby",
    name: "Campus Library (Main Lobby)",
    note: "Monitored, well-lit entrance area near turnstiles",
    icon: "book-outline",
  },
  {
    id: "union-cafe",
    name: "Student Union Cafe",
    note: "High-traffic seating area by coffee counter",
    icon: "cafe-outline",
  },
  {
    id: "science-quad",
    name: "Science Quad Plaza",
    note: "Central open outdoor plaza near clocktower",
    icon: "sunny-outline",
  },
  {
    id: "dining-hall",
    name: "Dining Commons West Entrance",
    note: "Busiest noon & evening meetup point",
    icon: "restaurant-outline",
  },
  {
    id: "security-gate",
    name: "Campus Main Gate Security Booth",
    note: "24/7 security officer presence",
    icon: "shield-checkmark-outline",
  },
];

const MEETUP_TIME_PRESETS = [
  "Today at 12:30 PM (Lunch)",
  "Today at 3:30 PM (After class)",
  "Today at 5:15 PM (Evening)",
  "Tomorrow at 11:00 AM",
  "Tomorrow at 2:30 PM",
];

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

const REACTION_OPTIONS = ["👍", "❤️", "🤝", "📍", "💰", "🎉"];

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
  currentUserId,
  isSeller: isSellerProp,
  onSendMeetup,
  onSendOffer,
}: {
  conversation: Conversation;
  onSend: (text: string) => void;
  onBack: () => void;
  currentUserId?: string;
  isSeller?: boolean;
  onSendMeetup?: (meetup: MeetupDetails) => void;
  onSendOffer?: (offer: OfferDetails) => void;
}) {
  const [text, setText] = useState("");
  const [showPrompts, setShowPrompts] = useState(true);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [meetupModalOpen, setMeetupModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);

  // Meetup modal state
  const [selectedSpotId, setSelectedSpotId] = useState(CAMPUS_MEETUP_SPOTS[0].id);
  const [selectedTime, setSelectedTime] = useState(MEETUP_TIME_PRESETS[1]);
  const [customTime, setCustomTime] = useState("");

  // Offer modal state
  const basePrice = conversation.itemPrice || 45;
  const [offerAmount, setOfferAmount] = useState<string>(
    String(Math.round(basePrice * 0.9)),
  );

  // Local state overlay for real-time reactivity inside component
  const [localMessages, setLocalMessages] = useState<Message[]>(conversation.messages);
  const [activeMeetup, setActiveMeetup] = useState<MeetupDetails | undefined>(
    conversation.activeMeetup,
  );
  const [activeOffer, setActiveOffer] = useState<OfferDetails | undefined>(
    conversation.activeOffer,
  );

  const scroller = useRef<ScrollView>(null);

  const isSeller = isSellerProp !== undefined
    ? isSellerProp
    : Boolean(
        currentUserId &&
          (conversation.sellerId === currentUserId || conversation.sellerId === "demo-seller"),
      );

  const otherName = isSeller
    ? conversation.buyer || "Campus student"
    : conversation.seller || "Seller";
  const quickReplies = isSeller ? SELLER_PROMPTS : BUYER_PROMPTS;

  // Sync when prop messages change
  useMemo(() => {
    setLocalMessages(conversation.messages);
  }, [conversation.messages]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; items: Message[] }[] = [];
    localMessages.forEach((m) => {
      const label = formatDateSeparator(m.at);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.dateLabel === label) {
        lastGroup.items.push(m);
      } else {
        groups.push({ dateLabel: label, items: [m] });
      }
    });
    return groups;
  }, [localMessages]);

  const send = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    const newMsg: Message = {
      id: String(Date.now()),
      mine: true,
      senderId: currentUserId || (isSeller ? "demo-seller" : "buyer-alex"),
      senderRole: isSeller ? "seller" : "buyer",
      text: clean,
      type: "text",
      at: Date.now(),
    };
    setLocalMessages((prev) => [...prev, newMsg]);
    onSend(clean);
    setText("");
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 70);
  };

  const handleProposeMeetup = () => {
    const spot = CAMPUS_MEETUP_SPOTS.find((s) => s.id === selectedSpotId) || CAMPUS_MEETUP_SPOTS[0];
    const finalTime = customTime.trim() || selectedTime;
    const meetup: MeetupDetails = {
      location: spot.name,
      spotId: spot.id,
      time: finalTime,
      status: "proposed",
    };

    setActiveMeetup(meetup);
    setMeetupModalOpen(false);

    const meetupMsg: Message = {
      id: String(Date.now()),
      mine: true,
      senderId: currentUserId || (isSeller ? "demo-seller" : "buyer-alex"),
      senderRole: isSeller ? "seller" : "buyer",
      text: `Proposed meetup at ${spot.name} (${finalTime})`,
      type: "meetup",
      meetup,
      at: Date.now(),
    };

    setLocalMessages((prev) => [...prev, meetupMsg]);
    if (onSendMeetup) {
      onSendMeetup(meetup);
    } else {
      onSend(`📍 Proposed campus meetup: ${spot.name} - ${finalTime}`);
    }
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 70);
  };

  const handleAcceptMeetup = (msgId: string, meetup: MeetupDetails) => {
    const updatedMeetup: MeetupDetails = { ...meetup, status: "accepted" };
    setActiveMeetup(updatedMeetup);

    setLocalMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, meetup: updatedMeetup } : m,
      ),
    );

    const confirmMsg: Message = {
      id: String(Date.now()),
      mine: true,
      senderId: currentUserId || (isSeller ? "demo-seller" : "buyer-alex"),
      senderRole: isSeller ? "seller" : "buyer",
      text: `✓ Meetup confirmed at ${meetup.location}! See you there.`,
      type: "text",
      at: Date.now(),
    };

    setLocalMessages((prev) => [...prev, confirmMsg]);
    onSend(`✓ Meetup confirmed at ${meetup.location} (${meetup.time})!`);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 70);
  };

  const handleSendOffer = () => {
    const numericAmount = parseFloat(offerAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid dollar amount.");
      return;
    }

    const offer: OfferDetails = {
      amount: numericAmount,
      originalPrice: basePrice,
      status: "pending",
    };

    setActiveOffer(offer);
    setOfferModalOpen(false);

    const offerMsg: Message = {
      id: String(Date.now()),
      mine: true,
      senderId: currentUserId || (isSeller ? "demo-seller" : "buyer-alex"),
      senderRole: isSeller ? "seller" : "buyer",
      text: `Offered $${numericAmount.toFixed(2)} for ${conversation.itemTitle}`,
      type: "offer",
      offer,
      at: Date.now(),
    };

    setLocalMessages((prev) => [...prev, offerMsg]);
    if (onSendOffer) {
      onSendOffer(offer);
    } else {
      onSend(`🏷️ Proposed price offer: $${numericAmount.toFixed(2)} (List: $${basePrice.toFixed(2)})`);
    }
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 70);
  };

  const handleAcceptOffer = (msgId: string, offer: OfferDetails) => {
    const updatedOffer: OfferDetails = { ...offer, status: "accepted" };
    setActiveOffer(updatedOffer);

    setLocalMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, offer: updatedOffer } : m,
      ),
    );

    const acceptMsg: Message = {
      id: String(Date.now()),
      mine: true,
      senderId: currentUserId || (isSeller ? "demo-seller" : "buyer-alex"),
      senderRole: isSeller ? "seller" : "buyer",
      text: `Deal agreed! Accepted offer of $${offer.amount.toFixed(2)}.`,
      type: "text",
      at: Date.now(),
    };

    setLocalMessages((prev) => [...prev, acceptMsg]);
    onSend(`🤝 Accepted offer of $${offer.amount.toFixed(2)}!`);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 70);
  };

  const handleReactToMessage = (msgId: string, emoji: string) => {
    setLocalMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m,
      ),
    );
    setReactionMsgId(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ─── Top Header Bar ────────────────────────────────────────────── */}
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
              <View style={styles.verifiedBadge}>
                <AppIcon name="checkmark-circle" size={13} color={colors.green} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.headerStatus}>
              Active now • Campus Student ID Verified
            </Text>
          </View>
        </View>

        {/* Pinned Product Inquiry Context Banner */}
        <View style={styles.productBanner}>
          <View style={styles.productIconWrap}>
            <AppIcon name="cube-outline" size={18} color={colors.ink} />
          </View>
          <View style={styles.productDetails}>
            <View style={styles.productTagRow}>
              <Text style={styles.productTag}>
                {isSeller ? "INQUIRY ABOUT PRODUCT" : "INQUIRING ON ITEM"}
              </Text>
              {conversation.itemPrice ? (
                <View style={styles.pricePill}>
                  <Text style={styles.pricePillText}>${conversation.itemPrice}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.productTitle} numberOfLines={1}>
              {conversation.itemTitle}
            </Text>
          </View>
          <View style={styles.campusBadge}>
            <AppIcon name="location-sharp" size={12} color={colors.ink} />
            <Text style={styles.campusBadgeText}>North Campus</Text>
          </View>
        </View>

        {/* Active Meetup / Offer Status Bar */}
        {activeMeetup && activeMeetup.status === "accepted" ? (
          <View style={styles.dealStatusBar}>
            <AppIcon name="calendar-outline" size={14} color="#166534" />
            <Text style={styles.dealStatusText} numberOfLines={1}>
              Meetup confirmed: {activeMeetup.location} ({activeMeetup.time})
            </Text>
          </View>
        ) : activeOffer && activeOffer.status === "accepted" ? (
          <View style={styles.dealStatusBar}>
            <AppIcon name="pricetag" size={14} color="#166534" />
            <Text style={styles.dealStatusText} numberOfLines={1}>
              Agreed price: ${activeOffer.amount.toFixed(2)} (Deal locked)
            </Text>
          </View>
        ) : null}
      </View>

      {/* Safety Notice Banner */}
      <Pressable style={styles.safetyBox} onPress={() => setSafetyModalOpen(true)}>
        <AppIcon name="shield-checkmark" size={14} color={colors.green} />
        <Text style={styles.safetyText}>
          Safety tip: Meet in public campus spots with security. Tap for guide.
        </Text>
        <AppIcon name="chevron-forward" size={12} color={colors.green} />
      </Pressable>

      {/* ─── Messages Thread Feed ───────────────────────────────────────── */}
      <ScrollView
        ref={scroller}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
      >
        {localMessages.length === 0 ? (
          <View style={styles.emptyFeed}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="chatbubble-ellipses-outline" size={32} color={colors.ink} />
            </View>
            <Text style={styles.emptyHeading}>Start the conversation</Text>
            <Text style={styles.emptySub}>
              Coordinate meetup spot, ask condition questions, or make an offer with {otherName}.
            </Text>
          </View>
        ) : (
          conversation.messages.map((m) => {
            let isMine: boolean;
            if (m.senderRole) {
              isMine = isSeller ? m.senderRole === "seller" : m.senderRole === "buyer";
            } else if (m.senderId && currentUserId) {
              isMine = m.senderId === currentUserId;
            } else {
              isMine = m.mine;
            }
            return (
              <View key={m.id} style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
                <Text style={{ color: isMine ? "#FFF" : colors.ink, fontSize: 14 }}>{m.text}</Text>
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

                    <Pressable
                      onLongPress={() => setReactionMsgId(reactionMsgId === m.id ? null : m.id)}
                      style={[
                        styles.bubble,
                        isMine ? styles.bubbleMine : styles.bubbleTheirs,
                        m.type === "meetup" && styles.bubbleSpecial,
                        m.type === "offer" && styles.bubbleSpecial,
                      ]}
                    >
                      {/* 1. MEETUP PROPOSAL CARD */}
                      {m.type === "meetup" && m.meetup ? (
                        <View style={styles.cardBubble}>
                          <View style={styles.cardBubbleHeader}>
                            <View style={styles.cardBadgePin}>
                              <AppIcon name="location-sharp" size={14} color="#FFF" />
                            </View>
                            <Text style={styles.cardHeaderTitle}>Campus Meetup Proposal</Text>
                            <View
                              style={[
                                styles.statusPill,
                                m.meetup.status === "accepted" ? styles.statusAccepted : styles.statusPending,
                              ]}
                            >
                              <Text style={styles.statusPillText}>
                                {m.meetup.status === "accepted" ? "Confirmed" : "Proposed"}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.cardBodyBox}>
                            <View style={styles.cardDetailRow}>
                              <AppIcon name="business-outline" size={16} color={colors.ink} />
                              <Text style={styles.cardLocationName}>{m.meetup.location}</Text>
                            </View>
                            <View style={styles.cardDetailRow}>
                              <AppIcon name="time-outline" size={16} color={colors.muted} />
                              <Text style={styles.cardTimeText}>{m.meetup.time}</Text>
                            </View>
                          </View>

                          {!isMine && m.meetup.status === "proposed" ? (
                            <Pressable
                              style={styles.cardActionBtn}
                              onPress={() => handleAcceptMeetup(m.id, m.meetup!)}
                            >
                              <AppIcon name="checkmark-circle" size={16} color="#FFF" />
                              <Text style={styles.cardActionBtnText}>Accept Meetup Spot</Text>
                            </Pressable>
                          ) : m.meetup.status === "accepted" ? (
                            <View style={styles.confirmedBanner}>
                              <AppIcon name="shield-checkmark" size={14} color="#15803D" />
                              <Text style={styles.confirmedBannerText}>
                                Safe handoff agreed by both students
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                      {/* 2. PRICE OFFER CARD */}
                      {m.type === "offer" && m.offer ? (
                        <View style={styles.cardBubble}>
                          <View style={styles.cardBubbleHeader}>
                            <View style={[styles.cardBadgePin, { backgroundColor: colors.yellow }]}>
                              <AppIcon name="pricetag" size={14} color={colors.ink} />
                            </View>
                            <Text style={styles.cardHeaderTitle}>Price Offer Proposal</Text>
                            <View
                              style={[
                                styles.statusPill,
                                m.offer.status === "accepted" ? styles.statusAccepted : styles.statusPending,
                              ]}
                            >
                              <Text style={styles.statusPillText}>
                                {m.offer.status === "accepted" ? "Accepted" : "Under Review"}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.offerAmountRow}>
                            <Text style={styles.offerValue}>${m.offer.amount.toFixed(2)}</Text>
                            {m.offer.originalPrice ? (
                              <View style={styles.offerListPriceCol}>
                                <Text style={styles.offerListPrice}>
                                  ${m.offer.originalPrice.toFixed(2)}
                                </Text>
                                <Text style={styles.offerDiscountText}>
                                  -
                                  {Math.round(
                                    (1 - m.offer.amount / m.offer.originalPrice) * 100,
                                  )}
                                  % savings
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {isSeller && !isMine && m.offer.status === "pending" ? (
                            <Pressable
                              style={[styles.cardActionBtn, { backgroundColor: colors.ink }]}
                              onPress={() => handleAcceptOffer(m.id, m.offer!)}
                            >
                              <AppIcon name="checkmark" size={16} color="#FFF" />
                              <Text style={styles.cardActionBtnText}>Accept Offer</Text>
                            </Pressable>
                          ) : m.offer.status === "accepted" ? (
                            <View style={styles.confirmedBanner}>
                              <AppIcon name="checkmark-done" size={14} color="#15803D" />
                              <Text style={styles.confirmedBannerText}>
                                Seller accepted this offer
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                      {/* 3. STANDARD TEXT MESSAGE */}
                      {(!m.type || m.type === "text") && (
                        <Text style={[styles.messageText, isMine ? styles.textMine : styles.textTheirs]}>
                          {m.text}
                        </Text>
                      )}

                      {/* Message Metadata (Time & Read Checkmarks) */}
                      <View style={styles.metaRow}>
                        <Text style={[styles.timeText, isMine ? styles.timeMine : styles.timeTheirs]}>
                          {formatTime(m.at)}
                        </Text>
                        {isMine && (
                          <AppIcon name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />
                        )}
                      </View>

                      {/* Message Reaction Badge */}
                      {m.reaction ? (
                        <View style={styles.reactionPill}>
                          <Text style={styles.reactionEmoji}>{m.reaction}</Text>
                        </View>
                      ) : null}
                    </Pressable>

                    {/* Floating Reaction Picker Tooltip */}
                    {reactionMsgId === m.id && (
                      <View style={styles.reactionPickerBar}>
                        {REACTION_OPTIONS.map((emoji) => (
                          <Pressable
                            key={emoji}
                            style={styles.reactionPickerItem}
                            onPress={() => handleReactToMessage(m.id, emoji)}
                          >
                            <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* ─── Quick Actions Bar ─────────────────────────────────────────── */}
      <View style={styles.actionToolBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionToolScroll}
        >
          <Pressable
            style={styles.actionChip}
            onPress={() => setMeetupModalOpen(true)}
          >
            <AppIcon name="location-outline" size={15} color={colors.ink} />
            <Text style={styles.actionChipText}>Propose Meetup</Text>
          </Pressable>

          <Pressable
            style={styles.actionChip}
            onPress={() => setOfferModalOpen(true)}
          >
            <AppIcon name="pricetag-outline" size={15} color={colors.ink} />
            <Text style={styles.actionChipText}>Make Offer</Text>
          </Pressable>

          <Pressable
            style={[styles.actionChip, showPrompts && styles.actionChipActive]}
            onPress={() => setShowPrompts((v) => !v)}
          >
            <AppIcon
              name="flash-outline"
              size={15}
              color={showPrompts ? "#FFF" : colors.ink}
            />
            <Text
              style={[
                styles.actionChipText,
                showPrompts && { color: "#FFF" },
              ]}
            >
              Suggestions
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionChip}
            onPress={() => setSafetyModalOpen(true)}
          >
            <AppIcon name="shield-checkmark-outline" size={15} color={colors.green} />
            <Text style={[styles.actionChipText, { color: colors.green }]}>
              Safety Guide
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* ─── Quick Prompts Carousel ────────────────────────────────────── */}
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

      {/* ─── Bottom Message Composer ───────────────────────────────────── */}
      <View style={styles.composerWrapper}>
        <View style={styles.composerBar}>
          <Pressable
            style={styles.togglePromptBtn}
            onPress={() => setMeetupModalOpen(true)}
            accessibilityLabel="Open meetup locations"
          >
            <AppIcon name="location" size={20} color={colors.ink} />
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
        <Pressable style={styles.send} onPress={() => send(text)} accessibilityLabel="Send">
          <AppIcon name="send" size={18} color="#FFF" />
        </Pressable>
      </View>

      {/* ─── MEETUP MODAL ──────────────────────────────────────────────── */}
      <Modal visible={meetupModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setMeetupModalOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Propose Campus Meetup</Text>
                <Text style={styles.modalSubtitle}>
                  Choose a monitored, safe spot on campus for item exchange
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setMeetupModalOpen(false)}
              >
                <AppIcon name="close" size={20} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={styles.modalSectionLabel}>1. SELECT MONITORED LOCATION</Text>
              <View style={styles.spotsList}>
                {CAMPUS_MEETUP_SPOTS.map((spot) => {
                  const selected = spot.id === selectedSpotId;
                  return (
                    <Pressable
                      key={spot.id}
                      style={[styles.spotCard, selected && styles.spotCardActive]}
                      onPress={() => setSelectedSpotId(spot.id)}
                    >
                      <View style={[styles.spotIconCircle, selected && styles.spotIconActive]}>
                        <AppIcon
                          name={spot.icon}
                          size={18}
                          color={selected ? "#FFF" : colors.ink}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.spotName, selected && styles.spotTextActive]}>
                          {spot.name}
                        </Text>
                        <Text style={styles.spotNote}>{spot.note}</Text>
                      </View>
                      {selected && (
                        <AppIcon name="checkmark-circle" size={20} color={colors.ink} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.modalSectionLabel}>2. SUGGESTED MEETING TIME</Text>
              <View style={styles.timeChipsWrap}>
                {MEETUP_TIME_PRESETS.map((t) => {
                  const active = t === selectedTime && !customTime;
                  return (
                    <Pressable
                      key={t}
                      style={[styles.timeChip, active && styles.timeChipActive]}
                      onPress={() => {
                        setSelectedTime(t);
                        setCustomTime("");
                      }}
                    >
                      <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                style={styles.customTimeInput}
                placeholder="Or specify custom time (e.g. Today 4:15 PM)"
                placeholderTextColor={colors.muted}
                value={customTime}
                onChangeText={setCustomTime}
              />
            </ScrollView>

            <Pressable style={styles.submitModalBtn} onPress={handleProposeMeetup}>
              <AppIcon name="paper-plane" size={17} color="#FFF" />
              <Text style={styles.submitModalBtnText}>Send Meetup Proposal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── MAKE OFFER MODAL ─────────────────────────────────────────── */}
      <Modal visible={offerModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setOfferModalOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Make a Price Offer</Text>
                <Text style={styles.modalSubtitle}>
                  Propose a student-friendly discount to the seller
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setOfferModalOpen(false)}
              >
                <AppIcon name="close" size={20} color={colors.ink} />
              </Pressable>
            </View>

            <View style={styles.offerItemCard}>
              <Text style={styles.offerItemTitle} numberOfLines={1}>
                {conversation.itemTitle}
              </Text>
              <Text style={styles.offerItemListPrice}>
                List Price: <Text style={{ fontWeight: "800" }}>${basePrice.toFixed(2)}</Text>
              </Text>
            </View>

            <Text style={styles.modalSectionLabel}>QUICK DISCOUNT PERCENTAGES</Text>
            <View style={styles.discountRow}>
              {[5, 10, 15, 20].map((pct) => {
                const discounted = Math.round(basePrice * (1 - pct / 100));
                return (
                  <Pressable
                    key={pct}
                    style={styles.discountChip}
                    onPress={() => setOfferAmount(String(discounted))}
                  >
                    <Text style={styles.discountChipPct}>{pct}% OFF</Text>
                    <Text style={styles.discountChipVal}>${discounted}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.modalSectionLabel}>OFFER AMOUNT ($)</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.dollarPrefix}>$</Text>
              <TextInput
                style={styles.amountField}
                keyboardType="numeric"
                value={offerAmount}
                onChangeText={setOfferAmount}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
              />
            </View>

            {parseFloat(offerAmount) < basePrice && (
              <View style={styles.savingsBox}>
                <AppIcon name="sparkles" size={15} color="#166534" />
                <Text style={styles.savingsBoxText}>
                  You save ${(basePrice - parseFloat(offerAmount)).toFixed(2)} (
                  {Math.round((1 - parseFloat(offerAmount) / basePrice) * 100)}% off)
                </Text>
              </View>
            )}

            <Pressable style={styles.submitModalBtn} onPress={handleSendOffer}>
              <AppIcon name="pricetag" size={17} color="#FFF" />
              <Text style={styles.submitModalBtnText}>Send Offer to Seller</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── CAMPUS SAFETY GUIDE MODAL ─────────────────────────────────── */}
      <Modal visible={safetyModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setSafetyModalOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Campus Safety Protocol</Text>
                <Text style={styles.modalSubtitle}>Guidelines for safe in-person exchanges</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setSafetyModalOpen(false)}
              >
                <AppIcon name="close" size={20} color={colors.ink} />
              </Pressable>
            </View>

            <View style={styles.safetyList}>
              <View style={styles.safetyItem}>
                <View style={[styles.safetyIcon, { backgroundColor: "#DCFCE7" }]}>
                  <AppIcon name="location" size={18} color="#15803D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.safetyItemTitle}>Meet in Public Campus Spaces</Text>
                  <Text style={styles.safetyItemDesc}>
                    Always choose high-visibility spots such as the Campus Library Main Lobby,
                    Student Union, or Dining Commons.
                  </Text>
                </View>
              </View>

              <View style={styles.safetyItem}>
                <View style={[styles.safetyIcon, { backgroundColor: "#FEF3C7" }]}>
                  <AppIcon name="sunny" size={18} color="#B45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.safetyItemTitle}>Daylight & Monitored Hours</Text>
                  <Text style={styles.safetyItemDesc}>
                    Schedule meetups during regular campus operating hours when student traffic is
                    active.
                  </Text>
                </View>
              </View>

              <View style={styles.safetyItem}>
                <View style={[styles.safetyIcon, { backgroundColor: "#DBEAFE" }]}>
                  <AppIcon name="card" size={18} color="#1D4ED8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.safetyItemTitle}>Inspect Before Payment</Text>
                  <Text style={styles.safetyItemDesc}>
                    Verify textbook condition, test electronics/headphones, and check event wristbands
                    before completing handoff.
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              style={styles.submitModalBtn}
              onPress={() => setSafetyModalOpen(false)}
            >
              <Text style={styles.submitModalBtnText}>Understood</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    maxWidth: 580,
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
    gap: 6,
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
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "700",
  },
  headerStatus: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
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
    width: 32,
    height: 32,
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
  productTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productTag: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  pricePill: {
    backgroundColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pricePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
  },
  productTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
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
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700",
  },
  dealStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  dealStatusText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  safetyBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: "rgba(46,158,107,0.08)",
  },
  safetyText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
    maxWidth: 580,
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
    position: "relative",
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
    maxWidth: "80%",
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
  bubbleSpecial: {
    padding: 12,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: colors.line,
    width: 280,
  },
  cardBubble: {
    gap: 8,
  },
  cardBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardBadgePin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusAccepted: {
    backgroundColor: "#DCFCE7",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
  },
  cardBodyBox: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  cardDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardLocationName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  cardTimeText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  cardActionBtn: {
    backgroundColor: colors.green,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  cardActionBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  confirmedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  confirmedBannerText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "700",
  },
  offerAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    backgroundColor: colors.bg,
    padding: 10,
    borderRadius: 10,
  },
  offerValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  offerListPriceCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  offerListPrice: {
    color: colors.muted,
    fontSize: 13,
    textDecorationLine: "line-through",
  },
  offerDiscountText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "800",
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
  reactionPill: {
    position: "absolute",
    bottom: -8,
    right: 10,
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionPickerBar: {
    position: "absolute",
    top: -38,
    right: 10,
    backgroundColor: "#FFF",
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  reactionPickerItem: {
    padding: 2,
  },
  reactionPickerEmoji: {
    fontSize: 18,
  },
  actionToolBar: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingVertical: 6,
  },
  actionToolScroll: {
    paddingHorizontal: 16,
    gap: 8,
    maxWidth: 580,
    alignSelf: "center",
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  actionChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
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
    maxWidth: 580,
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
    maxWidth: 580,
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

  /* Modals */
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
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: "85%",
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
  modalSectionLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  spotsList: {
    gap: 8,
  },
  spotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
  },
  spotCardActive: {
    borderColor: colors.ink,
    backgroundColor: "#FFF",
  },
  spotIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  spotIconActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  spotName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  spotTextActive: {
    color: colors.ink,
    fontWeight: "800",
  },
  spotNote: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  timeChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    backgroundColor: colors.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  timeChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  timeChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600",
  },
  timeChipTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  customTimeInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 13,
    marginTop: 10,
  },
  submitModalBtn: {
    backgroundColor: colors.ink,
    borderRadius: 16,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },
  submitModalBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },

  /* Offer Modal styles */
  offerItemCard: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  offerItemTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  offerItemListPrice: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  discountRow: {
    flexDirection: "row",
    gap: 8,
  },
  discountChip: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 8,
    alignItems: "center",
  },
  discountChipPct: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "800",
  },
  discountChipVal: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "#FFF",
  },
  dollarPrefix: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    marginRight: 6,
  },
  amountField: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  savingsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  savingsBoxText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Safety Modal styles */
  safetyList: {
    gap: 14,
    paddingVertical: 8,
  },
  safetyItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  safetyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  safetyItemTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  safetyItemDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
