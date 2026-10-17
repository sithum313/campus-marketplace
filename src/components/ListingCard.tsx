import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, listPriceOf, money } from "../theme";
import { Listing } from "../types";
import { AppIcon } from "./AppIcon";
import { ProductImage } from "./ProductImage";
import React from "react";

export function ListingCard({
  item,
  saved,
  onSave,
  onOpen,
}: {
  item: Listing;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.photo}>
        <ProductImage item={item} iconSize={44} />
        {item.discountPercent ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{item.discountPercent}%</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityLabel={saved ? "Remove saved item" : "Save item"}
          style={styles.save}
          onPress={onSave}
        >
          <AppIcon
            name={saved ? "heart" : "heart-outline"}
            size={18}
            color={saved ? colors.red : colors.ink}
          />
        </Pressable>
      </View>
      <View style={styles.body}>
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
        <Text style={styles.muted} numberOfLines={1}>
          {item.condition} · {item.campus}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
  },
  photo: { height: 130, backgroundColor: colors.blue },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  save: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  body: { padding: 12 },
  title: {
    minHeight: 34,
    color: colors.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 4 },
  price: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  old: { color: colors.muted, fontSize: 12, textDecorationLine: "line-through" },
  muted: { color: colors.muted, fontSize: 11, marginTop: 4 },
});
