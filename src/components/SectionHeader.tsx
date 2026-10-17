import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SeeMoreButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 30, marginBottom: 14 },
  title: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  button: {
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
