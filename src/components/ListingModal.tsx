import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { designById } from "../designs";
import { Image } from "react-native";
import { offersFor } from "../lib/cart";
import { colors, listPriceOf, money } from "../theme";
import { CartLine, Listing, Offer } from "../types";
import { AppIcon } from "./AppIcon";
import { DesignGrid, ShirtPreview, SwatchRow } from "./DesignPicker";
import { OfferBanner } from "./OfferBanner";
import { ProductImage } from "./ProductImage";
import { Button, Chip, Label, Stepper } from "./ui";

export function ListingModal({
  item,
  saved,
  offers,
  signedIn,
  onToggleSave,
  onAdd,
  onChat,
  onViewCart,
  onClose,
}: {
  item: Listing | null;
  saved: boolean;
  offers: Offer[];
  signedIn: boolean;
  onToggleSave: () => void;
  onAdd: (line: Omit<CartLine, "key">) => void;
  onChat: () => void;
  onViewCart: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={item !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        {item ? (
          <Sheet
            key={item.id}
            item={item}
            saved={saved}
            offers={offers}
            signedIn={signedIn}
            onToggleSave={onToggleSave}
            onAdd={onAdd}
            onChat={onChat}
            onViewCart={onViewCart}
            onClose={onClose}
          />
        ) : null}
      </View>
    </Modal>
  );
}

function Sheet({
  item,
  saved,
  offers,
  signedIn,
  onToggleSave,
  onAdd,
  onChat,
  onViewCart,
  onClose,
}: {
  item: Listing;
  saved: boolean;
  offers: Offer[];
  signedIn: boolean;
  onToggleSave: () => void;
  onAdd: (line: Omit<CartLine, "key">) => void;
  onChat: () => void;
  onViewCart: () => void;
  onClose: () => void;
}) {
  const [color, setColor] = useState(item.colors?.[0]?.name);
  const [size, setSize] = useState(item.sizes?.[Math.min(2, item.sizes.length - 1)]);
  const [design, setDesign] = useState(item.designs?.[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  useEffect(() => setAdded(false), [color, size, design, qty]);

  const hex = item.colors?.find((c) => c.name === color)?.hex;
  const out = item.soldOut || item.stock === 0;
  const discount = item.discountPercent ? listPriceOf(item) : null;
  const related = offersFor(item, offers);
  const art = designById(design);
  const designLabel = item.kind === "bookmark" ? "Bookmark design" : "Print design";

  return (
    <View style={styles.sheet}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View>
          {item.kind === "tshirt" && hex ? (
            <ShirtPreview hex={hex} design={design} />
          ) : item.kind === "bookmark" && art ? (
            <View style={[styles.hero, { alignItems: "center", backgroundColor: "#E9EDF3" }]}>
              <Image source={art.source} style={styles.bookmark} />
            </View>
          ) : (
            <View style={styles.hero}>
              <ProductImage item={item} iconSize={64} />
            </View>
          )}
          <Pressable
            accessibilityLabel={saved ? "Remove from saved" : "Save item"}
            style={[styles.round, { left: 14 }]}
            onPress={onToggleSave}
          >
            <AppIcon
              name={saved ? "heart" : "heart-outline"}
              size={20}
              color={saved ? colors.red : colors.ink}
            />
          </Pressable>
          <Pressable accessibilityLabel="Close" style={[styles.round, { right: 14 }]} onPress={onClose}>
            <AppIcon name="close" size={20} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.category}>{item.category.toUpperCase()}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{money(item.price)}</Text>
            {discount ? (
              <>
                <Text style={styles.old}>{money(discount)}</Text>
                <Text style={styles.off}>{item.discountPercent}% off</Text>
              </>
            ) : null}
          </View>
          <Text style={styles.meta}>
            {item.condition} · {item.campus} · {item.seller}
          </Text>
          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}

          {related.length ? (
            <View style={{ gap: 8, marginTop: 14 }}>
              {related.map((o) => (
                <OfferBanner key={o.id} offer={o} />
              ))}
            </View>
          ) : null}

          {item.colors?.length ? (
            <>
              <Label hint={color}>Colour</Label>
              <SwatchRow swatches={item.colors} value={color} onChange={setColor} />
            </>
          ) : null}

          {item.sizes?.length ? (
            <>
              <Label>Size</Label>
              <View style={styles.wrap}>
                {item.sizes.map((s) => (
                  <Chip key={s} label={s} active={size === s} onPress={() => setSize(s)} />
                ))}
              </View>
            </>
          ) : null}

          {item.designs?.length ? (
            <>
              <Label hint={`${item.designs.length} designs · tap one to choose`}>{designLabel}</Label>
              <DesignGrid options={item.designs} selected={design ? [design] : []} onToggle={setDesign} />
            </>
          ) : null}

          <View style={styles.qtyRow}>
            <View>
              <Text style={styles.label}>Quantity</Text>
              {item.stock !== undefined ? (
                <Text style={styles.meta}>{out ? "Sold out" : `${item.stock} available`}</Text>
              ) : null}
            </View>
            <Stepper value={qty} onChange={setQty} max={item.stock || 99} />
          </View>

          <View style={styles.actions}>
            <Button
              kind="outline"
              icon="chatbubble-ellipses-outline"
              label={signedIn ? "Chat" : "Sign in to chat"}
              onPress={onChat}
              style={{ flex: 1, paddingHorizontal: 10 }}
            />
            {added ? (
              <Button
                kind="soft"
                icon="cart"
                label="View cart"
                onPress={onViewCart}
                style={{ flex: 1.4 }}
              />
            ) : (
              <Button
                icon="cart-outline"
                disabled={out}
                label={out ? "Sold out" : `Add · ${money(Math.round(item.price * qty * 100) / 100)}`}
                onPress={() => {
                  onAdd({ itemId: item.id, qty, color, size, design });
                  setAdded(true);
                }}
                style={{ flex: 1.4 }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(30,34,48,.45)", justifyContent: "flex-end", alignItems: "center" },
  sheet: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  hero: { width: "100%", height: 210, backgroundColor: colors.blue },
  bookmark: { height: "100%", aspectRatio: 0.45, borderRadius: 10 },
  round: {
    position: "absolute",
    top: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 22, paddingBottom: 28 },
  category: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 22, fontWeight: "800", marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 6 },
  price: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  old: { color: colors.muted, fontSize: 14, textDecorationLine: "line-through" },
  off: { color: colors.red, fontSize: 13, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  desc: { color: "#4B5263", fontSize: 14, lineHeight: 20, marginTop: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  qtyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
});
