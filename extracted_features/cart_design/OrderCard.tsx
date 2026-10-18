import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../../src/components/AppIcon";
import { colors, money } from "../../src/theme";
import { Order, OrderStatus } from "../../src/types";

export function OrderCard({
  order,
  partyLabel,
  actions,
}: {
  order: Order;
  partyLabel: string;
  actions?: ReactNode;
}) {
  const lines = Array.isArray(order?.lines) ? order.lines : [];
  const displayParty =
    partyLabel === "Buyer"
      ? order.buyerName || order.party || "Buyer"
      : order.party || "Seller";

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "Placed":
        return {
          bg: "#E8F0FE",
          text: "#1E88E5",
          icon: "time-outline",
          label: "Order Placed",
        };
      case "Ready for pickup":
        return {
          bg: "#FFF8E1",
          text: "#F57C00",
          icon: "cube-outline",
          label: "Ready for Handover",
        };
      case "Completed":
        return {
          bg: "#E8F8F0",
          text: colors.green,
          icon: "checkmark-circle-outline",
          label: "Handed Over",
        };
      case "Cancelled":
        return {
          bg: "#FDECEC",
          text: colors.red,
          icon: "close-circle-outline",
          label: "Cancelled",
        };
      default:
        return {
          bg: "#F0F2F5",
          text: colors.ink,
          icon: "information-circle-outline",
          label: status,
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);
  const totalItems = lines.reduce((acc, l) => acc + (l.qty || 1), 0);

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.top}>
        <View>
          <View style={styles.idRow}>
            <Text style={styles.id}>{order.id}</Text>
            <View style={styles.itemsCountBadge}>
              <Text style={styles.itemsCountText}>
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </Text>
            </View>
          </View>
          <Text style={styles.meta}>
            {order.date} · {partyLabel}: <Text style={{ fontWeight: "700" }}>{displayParty}</Text>
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
          <AppIcon name={statusConfig.icon} size={13} color={statusConfig.text} />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Campus Meetup Tag */}
      <View style={styles.campusTagBanner}>
        <AppIcon name="location-outline" size={13} color="#1E88E5" />
        <Text style={styles.campusTagText}>
          Campus Meetup & Peer Handover
        </Text>
      </View>

      {/* Line Items */}
      <View style={styles.linesList}>
        {lines.map((line, i) => (
          <View key={i} style={styles.line}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>{line.qty}×</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={2}>
                {line.title}
              </Text>
              {line.variant ? (
                <View style={styles.variantBadge}>
                  <Text style={styles.variantText}>{line.variant}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.price}>
              {money(Math.round(line.qty * line.unitPrice * 100) / 100)}
            </Text>
          </View>
        ))}

        {lines.length === 0 ? (
          <Text style={styles.emptyText}>Order placed</Text>
        ) : null}
      </View>

      {/* Foot Summary */}
      <View style={styles.foot}>
        <View>
          <Text style={styles.footMeta}>Order Total</Text>
          <Text style={styles.footSub}>Includes student discounts</Text>
        </View>
        <Text style={styles.total}>{money(order.total || 0)}</Text>
      </View>

      {/* Action Buttons */}
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 12,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  id: {
    color: colors.ink,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  itemsCountBadge: {
    backgroundColor: "#F0F4F8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemsCountText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  campusTagBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F7FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  campusTagText: {
    color: "#1E88E5",
    fontSize: 11,
    fontWeight: "600",
  },
  linesList: {
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F4F6F9",
    paddingTop: 10,
  },
  line: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  qtyBadge: {
    backgroundColor: "#F2F5F9",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qtyText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  name: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  variantBadge: {
    backgroundColor: "#F6F8FB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 3,
  },
  variantText: {
    color: colors.muted,
    fontSize: 11,
  },
  price: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
  },
  foot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 12,
    paddingTop: 12,
  },
  footMeta: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  footSub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 1,
  },
  total: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F4F6F9",
    paddingTop: 10,
  },
});
