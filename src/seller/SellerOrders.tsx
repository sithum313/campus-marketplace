import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { OrderCard } from "../components/OrderCard";
import { Button, Chip, page } from "../components/ui";
import { colors } from "../theme";
import { Order, OrderStatus } from "../types";

const FILTERS = ["All", "New", "Ready", "Completed"] as const;

export function SellerOrders({
  orders,
  onStatus,
}: {
  orders: Order[];
  onStatus: (id: string, status: OrderStatus) => void;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const shown = orders.filter(
    (o) =>
      filter === "All" ||
      (filter === "New" && o.status === "Placed") ||
      (filter === "Ready" && o.status === "Ready for pickup") ||
      (filter === "Completed" && (o.status === "Completed" || o.status === "Cancelled")),
  );
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Orders</Text>
      <Text style={styles.sub}>Products and event sales from buyers</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 16 }}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
      {shown.length === 0 ? <Text style={styles.empty}>No orders here yet.</Text> : null}
      <View style={{ gap: 12 }}>
        {shown.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            partyLabel="Buyer"
            actions={
              order.status === "Placed" ? (
                <>
                  <Button kind="outline" label="Decline" onPress={() => onStatus(order.id, "Cancelled")} style={{ flex: 1, height: 40 }} />
                  <Button label="Ready for pickup" onPress={() => onStatus(order.id, "Ready for pickup")} style={{ flex: 1.6, height: 40 }} />
                </>
              ) : order.status === "Ready for pickup" ? (
                <Button label="Mark completed" onPress={() => onStatus(order.id, "Completed")} style={{ flex: 1, height: 40 }} />
              ) : undefined
            }
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: page,
  title: { color: colors.ink, fontSize: 28, fontWeight: "800" },
  sub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  empty: { color: colors.muted, textAlign: "center", padding: 30 },
});
