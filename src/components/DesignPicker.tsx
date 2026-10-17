import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { designById } from "../designs";
import { colors } from "../theme";
import { Swatch } from "../types";
import { AppIcon } from "./AppIcon";

/** Grid of design thumbnails. Works for single choice (buyer) and multi choice (seller). */
export function DesignGrid({
  options,
  selected,
  onToggle,
  columns = 3,
}: {
  options: string[];
  selected: string[];
  onToggle: (id: string) => void;
  columns?: number;
}) {
  const gap = 10;
  return (
    <View style={[styles.grid, { gap }]}>
      {options.map((id) => {
        const design = designById(id);
        if (!design) return null;
        const on = selected.includes(id);
        return (
          <Pressable
            key={id}
            accessibilityLabel={design.name}
            onPress={() => onToggle(id)}
            style={{ width: `${100 / columns - 3}%` as any }}
          >
            <View style={[styles.thumb, on && styles.thumbOn]}>
              <Image source={design.source} style={styles.img} />
              {on ? (
                <View style={styles.check}>
                  <AppIcon name="checkmark" size={13} color="#FFF" />
                </View>
              ) : null}
            </View>
            <Text style={[styles.name, on && { fontWeight: "800" }]} numberOfLines={1}>
              {design.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SwatchRow({
  swatches,
  value,
  onChange,
}: {
  swatches: Swatch[];
  value?: string;
  onChange: (name: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {swatches.map((sw) => {
        const on = value === sw.name;
        return (
          <Pressable
            key={sw.name}
            accessibilityLabel={sw.name}
            onPress={() => onChange(sw.name)}
            style={{ alignItems: "center", width: 52 }}
          >
            <View style={[styles.swatchRing, on && { borderColor: colors.ink }]}>
              <View style={[styles.swatch, { backgroundColor: sw.hex }]}>
                {on ? (
                  <AppIcon
                    name="checkmark"
                    size={16}
                    color={sw.hex === "#FFFFFF" || sw.hex === "#F6C52A" ? colors.ink : "#FFF"}
                  />
                ) : null}
              </View>
            </View>
            <Text style={styles.swName} numberOfLines={1}>
              {sw.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** T-shirt mock-up: the shirt takes the chosen colour and the chosen design is printed on it. */
export function ShirtPreview({ hex, design }: { hex: string; design?: string }) {
  const art = designById(design);
  return (
    <View style={styles.shirtBox}>
      <AppIcon name="mci:tshirt-crew" size={190} color={hex} />
      {art ? (
        <Image source={art.source} style={styles.print} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap" },
  thumb: {
    aspectRatio: 0.75,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.blue,
  },
  thumbOn: { borderColor: colors.ink },
  img: { width: "100%", height: "100%" },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { color: colors.ink, fontSize: 11, marginTop: 5, textAlign: "center", fontWeight: "600" },
  swatchRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(30,34,48,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  swName: { fontSize: 10, color: colors.muted, marginTop: 3 },
  shirtBox: {
    height: 210,
    backgroundColor: "#E9EDF3",
    alignItems: "center",
    justifyContent: "center",
  },
  print: {
    position: "absolute",
    top: 78,
    width: 62,
    height: 76,
    borderRadius: 6,
  },
});
