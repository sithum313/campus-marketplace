import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { AppIcon } from "../components/AppIcon";
import { ListingCard } from "../components/ListingCard";
import { ProductImage } from "../components/ProductImage";
import { ProductTile } from "../components/ProductTile";
import { SearchBar } from "../components/SearchBar";
import { SectionHeader, SeeMoreButton } from "../components/SectionHeader";
import { categories, categoryIcons, categoryTints } from "../data";
import { OfferBanner } from "../components/OfferBanner";
import { CoverImage } from "../components/CoverImage";
import { coverKeyFor } from "../designs";
import { colors } from "../theme";
import { CampusEvent, Listing, Offer } from "../types";

export function HomePage({
  items,
  events,
  offers,
  query,
  savedIds,
  onQueryChange,
  onSearch,
  onOpen,
  onSave,
  onCategory,
  onSeeDiscounts,
  onSeeEvents,
  onSeeAll,
}: {
  items: Listing[];
  events: CampusEvent[];
  offers: Offer[];
  query: string;
  savedIds: string[];
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onOpen: (item: Listing) => void;
  onSave: (id: string) => void;
  onCategory: (category: string) => void;
  onSeeDiscounts: () => void;
  onSeeEvents: () => void;
  onSeeAll: () => void;
}) {
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, 520);
  const tileWidth = (pageWidth - 40 - 24) / 3;

  const discounted = items.filter((item) => item.discountPercent).slice(0, 6);
  const popular = items.filter((item) => item.popular).slice(0, 6);
  const rows: Listing[][] = [];
  for (let i = 0; i < popular.length; i += 2) rows.push(popular.slice(i, i + 2));

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

      <View style={{ marginTop: 18 }}>
        <SearchBar value={query} onChangeText={onQueryChange} onSubmit={onSearch} />
      </View>

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

      {/* Offers & notices from event organizers */}
      <SectionHeader title="Offers & notices" subtitle="Deals and updates from event organizers" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.eventRow}
        style={styles.bleed}
      >
        {offers.map((offer) => (
          <OfferBanner
            key={offer.id}
            offer={offer}
            width={280}
            eventTitle={events.find((e) => e.id === offer.eventId)?.title}
          />
        ))}
      </ScrollView>

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

      {/* Popular */}
      <SectionHeader title="Popular items" subtitle="What students are buying" />
      <View style={{ gap: 14 }}>
        {rows.map((row, index) => (
          <View key={index} style={styles.pair}>
            {row.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                saved={savedIds.includes(item.id)}
                onSave={() => onSave(item.id)}
                onOpen={() => onOpen(item)}
              />
            ))}
            {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </View>
      <SeeMoreButton label="See all items" onPress={onSeeAll} />
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
  return (
    <View style={[styles.event, wide && { width: "100%" }]}>
      <CoverImage coverKey={coverKeyFor(event)} style={styles.banner}>
        <View style={styles.dateBox}>
          <Text style={styles.dateMonth}>{event.month}</Text>
          <Text style={styles.dateDay}>{event.day}</Text>
        </View>
      </CoverImage>
      <View style={[styles.eventInfo, { borderLeftColor: event.color }]}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {event.venue} · by {event.organizer}
        </Text>
      </View>
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
  tagline: { color: colors.muted, fontSize: 13, marginTop: 2 },
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
  banner: { width: "100%", aspectRatio: 2, padding: 12 },
  eventInfo: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2, borderLeftWidth: 5, marginLeft: 0 },
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
  eventTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  eventMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  eventProducts: { flexDirection: "row", padding: 12, gap: 8 },
  eventItem: { flex: 1, alignItems: "center" },
  eventThumb: { width: "100%", aspectRatio: 1, borderRadius: 14, overflow: "hidden" },
  eventItemName: { color: colors.ink, fontSize: 11, fontWeight: "600", marginTop: 6 },
  eventItemPrice: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  catRow: { paddingHorizontal: 20, gap: 16 },
  cat: { width: 76, alignItems: "center" },
  catCircle: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  catLabel: { color: colors.ink, fontSize: 12, fontWeight: "600", marginTop: 8 },
  pair: { flexDirection: "row", gap: 14 },
});
