import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Mode } from "../types";
import { AppIcon } from "./AppIcon";
import React from "react";

/** Always-visible Buyer / Seller switch pinned to the top-right corner. */
export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  const seg = (value: Mode, label: string, icon: string) => {
    const on = mode === value;
    return (
      <Pressable
        accessibilityLabel={`${label} mode`}
        onPress={() => onChange(value)}
        style={[styles.seg, on && styles.segOn]}
      >
        <AppIcon name={icon} size={14} color={on ? "#FFF" : colors.ink} />
        <Text style={[styles.text, on && { color: "#FFF" }]}>{label}</Text>
      </Pressable>
    );
  };
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.pill}>
        {seg("buyer", "Buyer", "bag-handle-outline")}
        {seg("seller", "Seller", "storefront-outline")}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 10,
    right: 14,
    zIndex: 100,
    elevation: 20,
  },
  pill: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#1E2230",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  seg: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  segOn: { backgroundColor: colors.ink },
  text: { color: colors.ink, fontSize: 12, fontWeight: "800" },
});
