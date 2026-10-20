import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../components/AppIcon";
import { ProductImage } from "../components/ProductImage";
import { Button, Stepper, page } from "../components/ui";
import { priceCart, variantLabel } from "../lib/cart";
import { colors, money } from "../theme";
import { CartLine, Listing, Offer } from "../types";

export function CartPage({
  lines,
  items,
  offers,
  onQty,
  onRemove,
  onOpen,
  onBrowse,
  onCheckout,
}: {
  lines: CartLine[];
  items: Listing[];
  offers: Offer[];
  onQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onOpen: (item: Listing) => void;
  onBrowse: () => void;
  onCheckout: () => void;
}) {
  const { rows, subtotal, savings, total } = priceCart(lines, items, offers);
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Your cart</Text>
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <AppIcon name="cart-outline" size={34} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Items you add will show up here.</Text>
          <Button label="Browse items" onPress={onBrowse} style={{ marginTop: 18 }} />
        </View>
      ) : (
        <>
          <View style={{ gap: 12, marginTop: 16 }}>
            {rows.map(({ line, item, discount, labels }) => (
              <View key={line.key} style={styles.row}>
                <Pressable style={styles.thumb} onPress={() => onOpen(item)}>
                  <ProductImage item={item} iconSize={26} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {variantLabel(line) || item.seller}
                  </Text>
                  <View style={styles.bottom}>
                    <Text style={styles.price}>{money(item.price * line.qty)}</Text>
                    <Stepper value={line.qty} max={item.stock || 99} onChange={(q) => onQty(line.key, q)} />
                  </View>
                  {discount > 0 ? (
                    <Text style={styles.deal} numberOfLines={2}>
                      {labels.join(" + ")} · −{money(discount)}
                    </Text>
                  ) : null}
                </View>
                <Pressable onPress={() => onRemove(line.key)} hitSlop={10} accessibilityLabel="Remove from cart">
                  <AppIcon name="trash-outline" size={20} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>
          <View style={styles.summary}>
            <View style={styles.sumRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.sumVal}>{money(subtotal)}</Text>
            </View>
            {savings > 0 ? (
              <View style={styles.sumRow}>
                <Text style={[styles.totalLabel, { color: colors.green }]}>Event offers</Text>
                <Text style={[styles.sumVal, { color: colors.green }]}>−{money(savings)}</Text>
              </View>
            ) : null}
            <View style={styles.sumRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>{money(total)}</Text>
            </View>
          </View>
          <Button label="Checkout" onPress={onCheckout} style={{ marginTop: 18 }} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: page,
  title: { color: colors.ink, fontSize: 28, fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  thumb: { width: 72, height: 72, borderRadius: 14, overflow: "hidden" },
  name: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  price: { color: colors.ink, fontWeight: "800" },
  deal: { color: colors.green, fontSize: 11, fontWeight: "700", marginTop: 6 },
  summary: { marginTop: 22, gap: 8 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  totalLabel: { color: colors.muted, fontSize: 15 },
  sumVal: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  total: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  emptyText: { color: colors.muted, marginTop: 6 },
});
