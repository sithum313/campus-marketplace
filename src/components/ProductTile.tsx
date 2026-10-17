import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, listPriceOf, money } from "../theme";
import { Listing } from "../types";
import { ProductImage } from "./ProductImage";

/** Compact tile used for 3-per-row grids (discounts). */
export function ProductTile({
  item,
  width,
  onOpen,
}: {
  item: Listing;
  width: number;
  onOpen: () => void;
}) {
  return (
    <Pressable style={[styles.tile, { width }]} onPress={onOpen}>
      <View style={[styles.photo, { height: width }]}>
        <ProductImage item={item} iconSize={28} />
        {item.discountPercent ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{item.discountPercent}%</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{money(item.price)}</Text>
        {item.discountPercent ? (
          <Text style={styles.old}>
            {money(listPriceOf(item))}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {},
  photo: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.blue,
  },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  title: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 7,
    minHeight: 30,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 2 },
  price: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  old: { color: colors.muted, fontSize: 10, textDecorationLine: "line-through" },
});
