import { User } from "firebase/auth";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../components/AppIcon";
import { ListingCard } from "../components/ListingCard";
import { OrderCard } from "../components/OrderCard";
import { Button, page } from "../components/ui";
import { colors, money } from "../theme";
import { Listing, Order } from "../types";

export type ProfileTab = "ongoing" | "past" | "saved";

export function ProfilePage({
  user,
  orders,
  saved,
  cartCount,
  cartTotal,
  initialTab,
  firebaseConfigured,
  profileReady,
  error,
  onOpen,
  onSave,
  onCart,
  onBrowse,
  onCancelOrder,
  onSignIn,
  onSignOut,
}: {
  user: User | null;
  orders: Order[];
  saved: Listing[];
  cartCount: number;
  cartTotal: number;
  initialTab: ProfileTab;
  firebaseConfigured: boolean;
  profileReady: boolean;
  error: string;
  onOpen: (item: Listing) => void;
  onSave: (id: string) => void;
  onCart: () => void;
  onBrowse: () => void;
  onCancelOrder: (id: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const name = user?.displayName || user?.email?.split("@")[0] || "Campus guest";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const ongoing = orders.filter((o) => o.status === "Placed" || o.status === "Ready for pickup");
  const past = orders.filter((o) => o.status === "Completed" || o.status === "Cancelled");

  const tabs: { key: ProfileTab; label: string; count: number }[] = [
    { key: "ongoing", label: "Ongoing", count: ongoing.length },
    { key: "past", label: "Past orders", count: past.length },
    { key: "saved", label: "Saved", count: saved.length },
  ];
  const rows: Listing[][] = [];
  for (let i = 0; i < saved.length; i += 2) rows.push(saved.slice(i, i + 2));

  const orderList = (list: Order[], canCancel: boolean, empty: string) =>
    list.length === 0 ? (
      <Text style={styles.empty}>{empty}</Text>
    ) : (
      <View style={{ gap: 12 }}>
        {list.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            partyLabel="Seller"
            actions={
              canCancel && order.status === "Placed" ? (
                <Button
                  kind="outline"
                  label="Cancel order"
                  onPress={() => onCancelOrder(order.id)}
                  style={{ height: 40, flex: 1 }}
                />
              ) : undefined
            }
          />
        ))}
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.initials}>{user ? initials : "?"}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.muted} numberOfLines={1}>
            {user?.email || "Sign in to chat with sellers and order"}
          </Text>
        </View>
      </View>

      <Pressable style={styles.cart} onPress={onCart}>
        <View style={styles.cartIcon}>
          <AppIcon name="cart" size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cartTitle}>My cart</Text>
          <Text style={styles.muted}>
            {cartCount ? `${cartCount} item${cartCount === 1 ? "" : "s"} · ${money(cartTotal)}` : "Nothing in your cart yet"}
          </Text>
        </View>
        <Text style={styles.cartGo}>Go to cart</Text>
        <AppIcon name="chevron-forward" size={18} />
      </Pressable>

      <View style={styles.segment}>
        {tabs.map((t) => (
          <Pressable key={t.key} style={[styles.seg, tab === t.key && styles.segOn]} onPress={() => setTab(t.key)}>
            <Text style={[styles.segText, tab === t.key && { color: "#FFF" }]}>
              {t.label} {t.count}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        {tab === "ongoing" && orderList(ongoing, true, "No ongoing orders. Orders you place show up here until pickup.")}
        {tab === "past" && orderList(past, false, "Completed and cancelled orders will be listed here.")}
        {tab === "saved" &&
          (saved.length === 0 ? (
            <View style={{ alignItems: "center" }}>
              <Text style={styles.empty}>Tap the heart on any item to keep it here.</Text>
              <Button label="Browse items" onPress={onBrowse} />
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {rows.map((row, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 14 }}>
                  {row.map((item) => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      saved
                      onSave={() => onSave(item.id)}
                      onOpen={() => onOpen(item)}
                    />
                  ))}
                  {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                </View>
              ))}
            </View>
          ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {user && profileReady ? <Text style={styles.success}>Profile saved to Firebase</Text> : null}
      {user ? (
        <Button kind="outline" label="Sign out" onPress={onSignOut} style={{ marginTop: 28 }} />
      ) : (
        <Button label="Sign in to continue" onPress={onSignIn} style={{ marginTop: 28 }} />
      )}
      <Text style={styles.backend}>
        {firebaseConfigured ? "Connected to Firebase" : "Demo mode · Add Firebase keys to connect"}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: page,
  hero: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 22 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 20, color: colors.ink, fontWeight: "800" },
  name: { color: colors.ink, fontSize: 22, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 12, marginTop: 2 },
  cart: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    marginTop: 22,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cartIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  cartTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  cartGo: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  segment: {
    flexDirection: "row",
    backgroundColor: "#E9EDF3",
    borderRadius: 22,
    padding: 4,
    marginTop: 20,
  },
  seg: { flex: 1, height: 40, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: colors.ink },
  segText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  empty: { color: colors.muted, textAlign: "center", lineHeight: 20, padding: 24 },
  success: { color: colors.green, fontSize: 12, fontWeight: "700", marginTop: 16 },
  error: {
    color: "#B64950",
    backgroundColor: "#FBECEE",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 16,
  },
  backend: { textAlign: "center", color: "#9BA59F", fontSize: 11, marginTop: 22 },
});
