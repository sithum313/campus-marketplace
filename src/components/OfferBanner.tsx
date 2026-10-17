import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Offer } from "../types";
import { AppIcon } from "./AppIcon";

const ICON = { percent: "pricetag", bogo: "gift", bundle: "gift", info: "megaphone" } as const;
const TINT = { percent: colors.yellow, bogo: colors.pink, bundle: colors.teal, info: colors.blue } as const;

/** A notice or offer from an event organizer. */
export function OfferBanner({
  offer,
  eventTitle,
  width,
}: {
  offer: Offer;
  eventTitle?: string;
  width?: number;
}) {
  return (
    <View style={[styles.card, { backgroundColor: TINT[offer.kind] }, width ? { width } : null]}>
      <View style={styles.icon}>
        <AppIcon name={ICON[offer.kind]} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        {eventTitle ? (
          <Text style={styles.event} numberOfLines={1}>
            {eventTitle.toUpperCase()}
          </Text>
        ) : null}
        <Text style={styles.title}>{offer.title}</Text>
        {offer.detail ? (
          <Text style={styles.detail} numberOfLines={2}>
            {offer.detail}
          </Text>
        ) : null}
        {offer.until ? <Text style={styles.until}>{offer.until}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, borderRadius: 18, padding: 14, alignItems: "flex-start" },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  event: { color: colors.ink, opacity: 0.6, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: 1 },
  detail: { color: colors.ink, opacity: 0.75, fontSize: 12, lineHeight: 17, marginTop: 3 },
  until: { color: colors.ink, fontSize: 11, fontWeight: "700", marginTop: 6 },
});
