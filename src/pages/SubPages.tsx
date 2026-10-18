import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { AppIcon } from "../components/AppIcon";
import { ProductTile } from "../components/ProductTile";
import { colors } from "../theme";
import { CampusEvent, Listing, Offer } from "../types";
import { EventCard } from "./HomePage";

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.back} onPress={onBack} accessibilityLabel="Back">
        <AppIcon name="chevron-back" size={22} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

export function DiscountsPage({
  items,
  onOpen,
  onBack,
}: {
  items: Listing[];
  onOpen: (item: Listing) => void;
  onBack: () => void;
}) {
  const { width } = useWindowDimensions();
  const tileWidth = (Math.min(width, 520) - 40 - 24) / 3;
  const discounted = items.filter((item) => item.discountPercent);
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Header title="All discounts" onBack={onBack} />
      <Text style={styles.count}>{discounted.length} discounted items</Text>
      <View style={styles.grid3}>
        {discounted.map((item) => (
          <ProductTile key={item.id} item={item} width={tileWidth} onOpen={() => onOpen(item)} />
        ))}
      </View>
    </ScrollView>
  );
}

export function EventsPage({
  items,
  events,
  offers,
  onOpen,
  onBack,
}: {
  items: Listing[];
  events: CampusEvent[];
  offers: Offer[];
  onOpen: (item: Listing) => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Header title="All events" onBack={onBack} />
      <Text style={styles.count}>{events.length} upcoming events</Text>
      <View style={{ gap: 16 }}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            wide
            event={event}
            products={items.filter((item) => item.eventId === event.id)}
            offers={offers.filter((o) => o.eventId === event.id)}
            onOpen={onOpen}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 24, paddingBottom: 130, maxWidth: 520, alignSelf: "center", width: "100%" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.ink, fontSize: 24, fontWeight: "800" },
  count: { color: colors.muted, fontSize: 12, marginVertical: 14 },
  grid3: { flexDirection: "row", flexWrap: "wrap", gap: 12, rowGap: 16 },
});
