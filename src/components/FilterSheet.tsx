// FilterSheet - initial price range inputs
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { categories } from "../data";
import { applyFilters, defaultFilters } from "../lib/filter";
import { colors } from "../theme";
import { Filters, Listing } from "../types";
import { Button, Chip, Field, Label } from "./ui";

const SORTS: { key: Filters["sort"]; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "priceAsc", label: "Price: low to high" },
  { key: "priceDesc", label: "Price: high to low" },
  { key: "discount", label: "Biggest discount" },
];
const CONDITIONS = ["Any", "New", "Like new", "Good condition"];
const PRESETS: { label: string; min: string; max: string }[] = [
  { label: "Under $10", min: "", max: "10" },
  { label: "$10 – $25", min: "10", max: "25" },
  { label: "$25 – $50", min: "25", max: "50" },
  { label: "$50+", min: "50", max: "" },
];

export function FilterSheet({
  visible,
  filters,
  items,
  query,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: Filters;
  items: Listing[];
  query: string;
  onApply: (filters: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(filters);
  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const campuses = useMemo(
    () => ["Any", ...Array.from(new Set(items.map((i) => i.campus))).sort()],
    [items],
  );
  const count = useMemo(() => applyFilters(items, query, draft).length, [items, query, draft]);
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const digits = (v: string) => v.replace(/[^0-9.]/g, "");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>Filters</Text>
            <Pressable onPress={() => setDraft({ ...defaultFilters })} hitSlop={10}>
              <Text style={styles.clear}>Clear all</Text>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Label>Sort by</Label>
            <View style={styles.wrap}>
              {SORTS.map((s) => (
                <Chip key={s.key} label={s.label} active={draft.sort === s.key} onPress={() => set("sort", s.key)} />
              ))}
            </View>

            <Label hint="Prices shown are after discount">Price range</Label>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field
                  prefix="$"
                  placeholder="Min"
                  keyboardType="numeric"
                  value={draft.min}
                  onChangeText={(v) => set("min", digits(v))}
                />
              </View>
              <Text style={{ color: colors.muted }}>to</Text>
              <View style={{ flex: 1 }}>
                <Field
                  prefix="$"
                  placeholder="Max"
                  keyboardType="numeric"
                  value={draft.max}
                  onChangeText={(v) => set("max", digits(v))}
                />
              </View>
            </View>
            <View style={[styles.wrap, { marginTop: 10 }]}>
              {PRESETS.map((p) => (
                <Chip
                  key={p.label}
                  label={p.label}
                  active={draft.min === p.min && draft.max === p.max}
                  onPress={() => setDraft((d) => ({ ...d, min: p.min, max: p.max }))}
                />
              ))}
            </View>

            <Label>Category</Label>
            <View style={styles.wrap}>
              {categories.map((c) => (
                <Chip key={c} label={c} active={draft.category === c} onPress={() => set("category", c)} />
              ))}
            </View>

            <Label>Condition</Label>
            <View style={styles.wrap}>
              {CONDITIONS.map((c) => (
                <Chip key={c} label={c} active={draft.condition === c} onPress={() => set("condition", c)} />
              ))}
            </View>

            <Label>Campus / pickup spot</Label>
            <View style={styles.wrap}>
              {campuses.map((c) => (
                <Chip key={c} label={c} active={draft.campus === c} onPress={() => set("campus", c)} />
              ))}
            </View>

            <Label>Deals</Label>
            <View style={styles.wrap}>
              <Chip
                icon="pricetag-outline"
                label="Discounted only"
                active={draft.discountOnly}
                onPress={() => set("discountOnly", !draft.discountOnly)}
              />
            </View>
          </ScrollView>
          <Button
            label={`Show ${count} item${count === 1 ? "" : "s"}`}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(30,34,48,.45)", justifyContent: "flex-end", alignItems: "center" },
  sheet: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "88%",
    backgroundColor: "#F6F8FB",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 26,
  },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.ink, fontSize: 22, fontWeight: "800" },
  clear: { color: colors.red, fontWeight: "800", fontSize: 13 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
});
