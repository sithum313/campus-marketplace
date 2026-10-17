// AllItemsPage - catalog integration
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../components/AppIcon";
import { FilterSheet } from "../components/FilterSheet";
import { activeFilterCount, defaultFilters } from "../lib/filter";
import { ListingCard } from "../components/ListingCard";
import { SearchBar } from "../components/SearchBar";
import { categories } from "../data";
import { colors } from "../theme";
import { Filters, Listing } from "../types";

export function AllItemsPage({
  items,
  allItems,
  query,
  filters,
  savedIds,
  onQueryChange,
  onFiltersChange,
  onSave,
  onOpen,
}: {
  items: Listing[];
  allItems: Listing[];
  query: string;
  filters: Filters;
  savedIds: string[];
  onQueryChange: (value: string) => void;
  onFiltersChange: (value: Filters) => void;
  onSave: (id: string) => void;
  onOpen: (item: Listing) => void;
}) {
  const [sheet, setSheet] = useState(false);
  const category = filters.category;
  const active = activeFilterCount(filters);
  const rows: Listing[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>All items</Text>
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar value={query} onChangeText={onQueryChange} />
        </View>
        <Pressable accessibilityLabel="Filters" style={styles.filterBtn} onPress={() => setSheet(true)}>
          <AppIcon name="options-outline" size={22} color="#FFF" />
          {active > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{active}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.bleed}
      >
        {categories.map((name) => (
          <Pressable
            key={name}
            onPress={() => onFiltersChange({ ...filters, category: name })}
            style={[styles.chip, category === name && styles.chipActive]}
          >
            <Text style={[styles.chipText, category === name && styles.chipTextActive]}>
              {name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.countRow}>
        <Text style={styles.count}>
          {items.length} items
          {filters.min || filters.max
            ? ` · $${filters.min || "0"} – ${filters.max ? "$" + filters.max : "any"}`
            : ""}
        </Text>
        {active > 0 || filters.sort !== "relevance" ? (
          <Pressable onPress={() => onFiltersChange({ ...defaultFilters })}>
            <Text style={styles.reset}>Reset filters</Text>
          </Pressable>
        ) : null}
      </View>
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
      {items.length === 0 ? (
        <Text style={styles.empty}>No items match your search and filters.</Text>
      ) : null}
      <FilterSheet
        visible={sheet}
        filters={filters}
        items={allItems}
        query={query}
        onApply={onFiltersChange}
        onClose={() => setSheet(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 28, paddingBottom: 130, maxWidth: 520, alignSelf: "center", width: "100%" },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginBottom: 16 },
  bleed: { marginHorizontal: -20 },
  chips: { paddingHorizontal: 20, gap: 8, paddingTop: 18, paddingBottom: 6 },
  chip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#FFF" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  filterBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  countRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 14 },
  count: { color: colors.muted, fontSize: 12 },
  reset: { color: colors.red, fontSize: 12, fontWeight: "800" },
  pair: { flexDirection: "row", gap: 14 },
  empty: { textAlign: "center", color: colors.muted, padding: 30 },
});
