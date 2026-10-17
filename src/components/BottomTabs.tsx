import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { AppIcon } from "./AppIcon";
import React from "react";

export type TabDef = {
  key: string;
  label: string;
  icon: string;
  active: string;
  badge?: number;
};

const IDLE_MS = 2600;

/**
 * Floating tab bar. While nobody is touching it, it fades to a see-through glass
 * look so content shows behind it; touching/hovering it (or switching tab)
 * brings it back to solid, then it relaxes again after a moment.
 */
export function BottomTabs({
  tabs,
  current,
  onChange,
}: {
  tabs: TabDef[];
  current: string;
  onChange: (key: string) => void;
}) {
  const t = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const engage = () => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(t, { toValue: 1, duration: 160, useNativeDriver: false }).start();
    timer.current = setTimeout(
      () => Animated.timing(t, { toValue: 0, duration: 600, useNativeDriver: false }).start(),
      IDLE_MS,
    );
  };

  useEffect(() => {
    engage();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const barBg = t.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.32)", "rgba(255,255,255,0.98)"],
  });
  const borderColor = t.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"],
  });
  const shadowOpacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.16] });
  const iconOpacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const glass = Platform.OS === "web" ? ({ backdropFilter: "blur(14px)" } as object) : null;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Animated.View
        onTouchStart={engage}
        {...(Platform.OS === "web" ? ({ onPointerEnter: engage } as object) : {})}
        style={[styles.bar, glass, { backgroundColor: barBg, borderColor, shadowOpacity }]}
      >
        {tabs.map((item) => {
          const active = current === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityLabel={item.label}
              onPressIn={engage}
              onPress={() => onChange(item.key)}
              style={[styles.item, active && styles.itemActive]}
            >
              <Animated.View style={{ opacity: iconOpacity, alignItems: "center" }}>
                <AppIcon
                  name={active ? item.active : item.icon}
                  size={active ? 27 : 25}
                  color={colors.ink}
                />
              </Animated.View>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

export const buyerTabs: TabDef[] = [
  { key: "Home", label: "Home", icon: "home-outline", active: "home" },
  { key: "Messages", label: "Messages", icon: "mail-outline", active: "mail" },
  { key: "Search", label: "Search", icon: "search-outline", active: "search" },
  { key: "Cart", label: "Cart", icon: "cart-outline", active: "cart" },
  { key: "Profile", label: "Profile", icon: "person-circle-outline", active: "person-circle" },
];

export const sellerTabs: TabDef[] = [
  { key: "Dashboard", label: "Dashboard", icon: "stats-chart-outline", active: "stats-chart" },
  { key: "Products", label: "Products", icon: "cube-outline", active: "cube" },
  { key: "Messages", label: "Messages", icon: "mail-outline", active: "mail" },
  { key: "Events", label: "Events", icon: "ticket-outline", active: "ticket" },
  { key: "Orders", label: "Orders", icon: "receipt-outline", active: "receipt" },
];

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
    paddingHorizontal: 18,
  },
  bar: {
    width: "100%",
    maxWidth: 460,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 40,
    borderWidth: 1,
    padding: 8,
    shadowColor: "#1E2230",
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  item: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  itemActive: { backgroundColor: "rgba(30,34,48,0.08)" },
  badge: {
    position: "absolute",
    top: 8,
    right: 18,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
});
