import { StyleSheet, TextInput, View } from "react-native";
import { colors } from "../theme";
import { AppIcon } from "./AppIcon";
import React from "react";

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Search items, books, event merch...",
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.bar}>
      <AppIcon name="search-outline" size={22} color={colors.ink} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 58,
    backgroundColor: "#FFF",
    borderRadius: 29,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: "#1E2230",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  input: { flex: 1, color: colors.ink, fontSize: 15, height: "100%" },
});
