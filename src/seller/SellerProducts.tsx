import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ProductImage } from "../components/ProductImage";
import { Button, page } from "../components/ui";
import { colors, money } from "../theme";
import { Listing } from "../types";

export function SellerProducts({
  products,
  onAdd,
  onEdit,
  onToggleSoldOut,
  onDelete,
}: {
  products: Listing[];
  onAdd: () => void;
  onEdit: (item: Listing) => void;
  onToggleSoldOut: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const safeProducts = (products || []).filter(
    (p, idx, arr) => p?.id && arr.findIndex((x) => x?.id === p.id) === idx,
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>My products</Text>
      <Text style={styles.sub}>Items you are selling on campus</Text>
      <Button icon="add-circle-outline" label="Add a product" onPress={onAdd} style={{ marginTop: 18 }} />

      {safeProducts.length === 0 ? (
        <View style={styles.empty}>
          <Image source={require("../../assets/onboarding/sell.png")} style={styles.art} resizeMode="contain" />
          <Text style={styles.emptyTitle}>Nothing listed yet</Text>
          <Text style={styles.emptyText}>Add your first product and students around campus can find it right away.</Text>
        </View>
      ) : (
        <View style={{ gap: 12, marginTop: 18 }}>
          {safeProducts.map((item) => {
            const out = item.soldOut || item.stock === 0;
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.top}>
                  <View style={styles.thumb}>
                    <ProductImage item={item} iconSize={26} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.meta}>
                      {item.category} · {item.condition}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>{money(item.price)}</Text>
                      {item.discountPercent ? <Text style={styles.off}>-{item.discountPercent}%</Text> : null}
                    </View>
                  </View>
                  <View style={[styles.badge, out && { backgroundColor: "#FBE3E4" }]}>
                    <Text style={styles.badgeText}>{out ? "Sold out" : item.stock !== undefined ? `${item.stock} left` : "Listed"}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable style={styles.act} onPress={() => onEdit(item)}>
                    <Text style={styles.actText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.act} onPress={() => onToggleSoldOut(item.id)}>
                    <Text style={styles.actText}>{out ? "Relist" : "Mark sold out"}</Text>
                  </Pressable>
                  <Pressable style={styles.act} onPress={() => onDelete(item.id)}>
                    <Text style={[styles.actText, { color: colors.red }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
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
  empty: { alignItems: "center", paddingTop: 30 },
  art: { width: 260, height: 180 },
  emptyTitle: { color: colors.ink, fontSize: 20, fontWeight: "800", marginTop: 10 },
  emptyText: { color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 20, maxWidth: 280 },
  card: { backgroundColor: "#FFF", borderRadius: 18, padding: 12, borderWidth: 1, borderColor: colors.line },
  top: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  thumb: { width: 64, height: 64, borderRadius: 14, overflow: "hidden" },
  name: { color: colors.ink, fontWeight: "800", fontSize: 14 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: "row", gap: 8, alignItems: "baseline", marginTop: 4 },
  price: { color: colors.ink, fontWeight: "900", fontSize: 15 },
  off: { color: colors.red, fontSize: 12, fontWeight: "800" },
  badge: { backgroundColor: colors.blue, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  actions: { flexDirection: "row", marginTop: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 4 },
  act: { flex: 1, height: 38, alignItems: "center", justifyContent: "center" },
  actText: { color: colors.ink, fontWeight: "800", fontSize: 12 },
});
