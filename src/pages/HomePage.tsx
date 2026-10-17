import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { AppIcon } from "../components/AppIcon";
import { ProductImage } from "../components/ProductImage";
import { ProductTile } from "../components/ProductTile";
import { SectionHeader, SeeMoreButton } from "../components/SectionHeader";
import { categories, categoryIcons, categoryTints } from "../data";
import { eventCovers } from "../designs";
import { colors } from "../theme";
import { CampusEvent, Listing, Offer } from "../types";

export function HomePage({
  items,
  events,
  offers,
  onOpen,
  onCategory,
  onSeeDiscounts,
  onSeeEvents,
}: {
  items: Listing[];
  events: CampusEvent[];
  offers: Offer[];
  onOpen: (item: Listing) => void;
  onCategory: (category: string) => void;
  onSeeDiscounts: () => void;
  onSeeEvents: () => void;
}) {
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, 520);
  const tileWidth = (pageWidth - 40 - 24) / 3;

  const discounted = items.filter((item) => item.discountPercent).slice(0, 6);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandRow}>
        <Text style={styles.brand}>
          uni<Text style={styles.brandBold}>zon</Text>
        </Text>
        <View style={styles.dot} />
      </View>
      <Text style={styles.tagline}>Everything your campus buys and sells</Text>

      {/* Discounts */}
      <SectionHeader title="Discounts" subtitle="Student deals right now" />
      <View style={styles.grid3}>
        {discounted.map((item) => (
          <ProductTile
            key={item.id}
            item={item}
            width={tileWidth}
            onOpen={() => onOpen(item)}
          />
        ))}
      </View>
      <SeeMoreButton label="See more discounts" onPress={onSeeDiscounts} />

      {/* Events */}
      <SectionHeader title="Upcoming events" subtitle="Tickets and merch from campus events" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.eventRow}
        style={styles.bleed}
      >
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            products={items.filter((item) => item.eventId === event.id)}
            offers={offers.filter((o) => o.eventId === event.id)}
            onOpen={onOpen}
          />
        ))}
      </ScrollView>
      <SeeMoreButton label="View all events" onPress={onSeeEvents} />

      {/* Categories */}
      <SectionHeader title="Categories" subtitle="Swipe to explore" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        style={styles.bleed}
      >
        {categories
          .filter((name) => name !== "All items")
          .map((name, index) => (
            <Pressable key={name} style={styles.cat} onPress={() => onCategory(name)}>
              <View
                style={[
                  styles.catCircle,
                  { backgroundColor: categoryTints[index % categoryTints.length] },
                ]}
              >
                <AppIcon name={categoryIcons[name] || "grid-outline"} size={28} />
              </View>
              <Text style={styles.catLabel} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          ))}
      </ScrollView>

    </ScrollView>
  );
}

export function EventCard({
  event,
  products,
  offers = [],
  onOpen,
  wide,
}: {
  event: CampusEvent;
  products: Listing[];
  offers?: Offer[];
  onOpen: (item: Listing) => void;
  wide?: boolean;
}) {
  const cover = event.cover ? eventCovers[event.cover] : undefined;
  const banner = (
    <>
      {cover ? <View style={styles.shade} pointerEvents="none" /> : null}
      <View style={styles.dateBox}>
        <Text style={styles.dateMonth}>{event.month}</Text>
        <Text style={styles.dateDay}>{event.day}</Text>
      </View>
      <View>
        <Text style={[styles.eventTitle, cover ? { color: "#FFF" } : null]} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={[styles.eventMeta, cover ? { color: "#FFF", opacity: 0.9 } : null]}>
          {event.venue} · by {event.organizer}
        </Text>
      </View>
    </>
  );
  return (
    <View style={[styles.event, wide && { width: "100%" }]}>
      {cover ? (
        <ImageBackground source={cover} style={styles.banner}>
          {banner}
        </ImageBackground>
      ) : (
        <View style={[styles.banner, { backgroundColor: event.color }]}>{banner}</View>
      )}
      <View style={styles.eventProducts}>
        {products.map((item) => (
          <Pressable key={item.id} style={styles.eventItem} onPress={() => onOpen(item)}>
            <View style={styles.eventThumb}>
              <ProductImage item={item} iconSize={22} />
            </View>
            <Text style={styles.eventItemName} numberOfLines={1}>
              {productLabel(item)}
            </Text>
            <Text style={styles.eventItemPrice}>${item.price}</Text>
          </Pressable>
        ))}
      </View>
      {offers.length ? (
        <View style={styles.offerList}>
          {offers.map((o) => (
            <View key={o.id} style={styles.offerRow}>
              <AppIcon name={o.kind === "info" ? "megaphone-outline" : "pricetag"} size={14} />
              <Text style={styles.offerText} numberOfLines={1}>
                {o.title}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function productLabel(item: Listing) {
  const lower = item.title.toLowerCase();
  if (lower.endsWith("ticket")) return "Ticket";
  if (lower.endsWith("cap")) return "Cap";
  if (lower.endsWith("t-shirt")) return "T-shirt";
  if (lower.endsWith("bookmark")) return "Bookmark";
  return item.title;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 28, paddingBottom: 130, maxWidth: 520, alignSelf: "center", width: "100%" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brand: { color: colors.ink, fontSize: 40, fontWeight: "400", letterSpacing: -1.2 },
  brandBold: { fontWeight: "900" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.yellow, marginTop: 14 },
  tagline: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: 6 },
  grid3: { flexDirection: "row", flexWrap: "wrap", gap: 12, rowGap: 16 },
  bleed: { marginHorizontal: -20 },
  eventRow: { paddingHorizontal: 20, gap: 14 },
  event: {
    width: 290,
    backgroundColor: "#FFF",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
  },
  banner: { height: 150, justifyContent: "space-between", padding: 14 },
  shade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(30,34,48,0.38)" },
  offerList: { paddingHorizontal: 14, paddingBottom: 14, gap: 6 },
  offerRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  offerText: { flex: 1, color: colors.ink, fontSize: 12, fontWeight: "700" },
  dateBox: {
    width: 52,
    borderRadius: 14,
    backgroundColor: "#FFF",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  dateMonth: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  dateDay: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  eventTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  eventMeta: { color: colors.ink, opacity: 0.7, fontSize: 12, marginTop: 2 },
  eventProducts: { flexDirection: "row", padding: 12, gap: 8 },
  eventItem: { flex: 1, alignItems: "center" },
  eventThumb: { width: "100%", aspectRatio: 1, borderRadius: 14, overflow: "hidden" },
  eventItemName: { color: colors.ink, fontSize: 11, fontWeight: "600", marginTop: 6 },
  eventItemPrice: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  catRow: { paddingHorizontal: 20, gap: 16 },
  cat: { width: 76, alignItems: "center" },
  catCircle: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  catLabel: { color: colors.ink, fontSize: 12, fontWeight: "600", marginTop: 8 },
});
