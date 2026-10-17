import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../components/AppIcon";
import { Button, page } from "../components/ui";
import { colors, money } from "../theme";
import { Conversation, Listing, Offer, Order } from "../types";

export function SellerDashboard({
  name = "Seller",
  products = [],
  eventProducts = [],
  offers = [],
  orders = [],
  conversations = [],
  onAddProduct,
  onCreateEvent,
  onOrders,
  onMessages,
}: {
  name?: string;
  products?: Listing[];
  eventProducts?: Listing[];
  offers?: Offer[];
  orders?: Order[];
  conversations?: Conversation[];
  onAddProduct: () => void;
  onCreateEvent: () => void;
  onOrders: () => void;
  onMessages?: () => void;
}) {
  const safeOrders = orders || [];
  const safeProducts = (products || []).filter(
    (p, idx, arr) => p?.id && arr.findIndex((x) => x?.id === p.id) === idx,
  );
  const safeConversations = conversations || [];
  const safeOffers = offers || [];
  const safeName = (name || "Seller").trim() || "Seller";

  const newOrders = safeOrders.filter((o) => {
    const st = (o?.status || "").toLowerCase();
    return st === "placed" || st === "new";
  }).length;
  const revenue = safeOrders
    .filter((o) => {
      const st = (o?.status || "").toLowerCase();
      return st !== "cancelled" && st !== "canceled";
    })
    .reduce((s, o) => s + (Number(o?.total) || 0), 0);
  const activeConversations = safeConversations.length;
  const stats = [
    { label: "Products live", value: String(safeProducts.filter((p) => !p?.soldOut && p?.stock !== 0).length), icon: "cube-outline", tint: colors.teal },
    { label: "New orders", value: String(newOrders), icon: "notifications-outline", tint: colors.yellow },
    { label: "Inquiries", value: String(activeConversations), icon: "mail-outline", tint: colors.pink },
    { label: "Revenue", value: money(Math.round(revenue * 100) / 100), icon: "cash-outline", tint: colors.blue },
  ];
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hi}>Seller space</Text>
          <Text style={styles.heroTitle}>Sell with{"\n"}ease, {safeName.split(" ")[0]}</Text>
          <Text style={styles.heroSub}>List products, chat with buyers, and fulfill orders in one place.</Text>
        </View>
        <Image source={require("../../assets/onboarding/sell.png")} style={styles.art} resizeMode="contain" />
      </View>

      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.stat, { backgroundColor: s.tint }]}>
            <AppIcon name={s.icon} size={20} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button icon="add-circle-outline" label="Add product" onPress={onAddProduct} style={{ flex: 1 }} />
        <Button kind="outline" icon="calendar-outline" label="New event" onPress={onCreateEvent} style={{ flex: 1 }} />
      </View>

      <Text style={styles.section}>Needs your attention</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          {newOrders ? `${newOrders} new order${newOrders === 1 ? "" : "s"} waiting for you.` : "No pending orders."}
        </Text>
        <Text style={styles.cardSub}>
          {activeConversations} buyer inquiry{activeConversations === 1 ? "" : "s"} · {safeOffers.length} event offers
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <Button kind="soft" label="Open orders" onPress={onOrders} style={{ flex: 1, height: 42 }} />
          {onMessages ? (
            <Button kind="outline" label="View messages" onPress={onMessages} style={{ flex: 1, height: 42 }} />
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: page,
  hero: {
    backgroundColor: colors.pink,
    borderRadius: 26,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    overflow: "hidden",
  },
  hi: { color: colors.ink, opacity: 0.6, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { color: colors.ink, fontSize: 26, lineHeight: 30, fontWeight: "900", marginTop: 6 },
  heroSub: { color: colors.ink, opacity: 0.75, fontSize: 12, lineHeight: 17, marginTop: 8, maxWidth: 170 },
  art: { width: 150, height: 130, marginRight: -10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  stat: { width: "48%", flexGrow: 1, borderRadius: 20, padding: 16, gap: 4 },
  statValue: { color: colors.ink, fontSize: 24, fontWeight: "900", marginTop: 6 },
  statLabel: { color: colors.ink, opacity: 0.7, fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  section: { color: colors.ink, fontSize: 18, fontWeight: "800", marginTop: 28, marginBottom: 12 },
  card: { backgroundColor: "#FFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.line },
  cardText: { color: colors.ink, fontWeight: "800", fontSize: 15 },
  cardSub: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
