import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, money } from "../theme";
import { Order } from "../types";
import { StatusPill } from "./ui";

export function OrderCard({
  order,
  partyLabel,
  actions,
}: {
  order: Order;
  partyLabel: string;
  actions?: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View>
          <Text style={styles.id}>{order.id}</Text>
          <Text style={styles.meta}>
            {order.date} · {partyLabel} {order.party}
          </Text>
        </View>
        <StatusPill status={order.status} />
      </View>
      <View style={{ gap: 8, marginTop: 12 }}>
        {order.lines.map((line, i) => (
          <View key={i} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {line.qty} × {line.title}
              </Text>
              {line.variant ? <Text style={styles.meta}>{line.variant}</Text> : null}
            </View>
            <Text style={styles.price}>{money(Math.round(line.qty * line.unitPrice * 100) / 100)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.foot}>
        <Text style={styles.meta}>Total</Text>
        <Text style={styles.total}>{money(order.total)}</Text>
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  id: { color: colors.ink, fontWeight: "800", fontSize: 14 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  line: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  name: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  price: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  foot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 12,
    paddingTop: 10,
  },
  total: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
});
