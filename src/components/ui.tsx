import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors } from "../theme";
import { AppIcon } from "./AppIcon";

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: string;
}) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipOn]}>
      {icon ? <AppIcon name={icon} size={15} color={active ? "#FFF" : colors.ink} /> : null}
      <Text style={[s.chipText, active && { color: "#FFF" }]}>{label}</Text>
    </Pressable>
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <View style={{ marginTop: 18, marginBottom: 8 }}>
      <Text style={s.label}>{children}</Text>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Field(props: TextInputProps & { prefix?: string }) {
  const { prefix, style, ...rest } = props;
  return (
    <View style={[s.fieldWrap, rest.multiline && { height: 96, alignItems: "flex-start" }]}>
      {prefix ? <Text style={s.prefix}>{prefix}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        {...rest}
        style={[s.input, rest.multiline && { paddingTop: 12, textAlignVertical: "top" }, style]}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = "primary",
  disabled,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "outline" | "soft";
  disabled?: boolean;
  icon?: string;
  style?: object;
}) {
  const dark = kind === "primary";
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        s.btn,
        kind === "outline" && s.btnOutline,
        kind === "soft" && { backgroundColor: colors.yellow },
        dark && { backgroundColor: colors.ink },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {icon ? <AppIcon name={icon} size={18} color={dark ? "#FFF" : colors.ink} /> : null}
      <Text style={[s.btnText, dark && { color: "#FFF" }]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <View style={s.stepper}>
      <Pressable style={s.stepBtn} hitSlop={6} onPress={() => onChange(Math.max(min, value - 1))}>
        <AppIcon name="remove" size={16} />
      </Pressable>
      <Text style={s.stepVal}>{value}</Text>
      <Pressable style={s.stepBtn} hitSlop={6} onPress={() => onChange(Math.min(max, value + 1))}>
        <AppIcon name="add" size={16} />
      </Pressable>
    </View>
  );
}

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={s.header}>
      {onBack ? (
        <Pressable style={s.back} onPress={onBack} accessibilityLabel="Back">
          <AppIcon name="chevron-back" size={22} />
        </Pressable>
      ) : null}
      <Text style={s.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  const done = status === "Completed";
  const bad = status === "Cancelled";
  const bg = bad ? "#FBE3E4" : done ? "#E3F4EA" : status === "Ready for pickup" ? "#FFF3C7" : colors.blue;
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={s.pillText}>{status}</Text>
    </View>
  );
}

export const page = {
  padding: 20,
  paddingTop: 28,
  paddingBottom: 130,
  maxWidth: 520,
  alignSelf: "center" as const,
  width: "100%" as const,
};

const s = StyleSheet.create({
  chip: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 19,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  hint: { color: colors.muted, fontSize: 11, marginTop: 2 },
  fieldWrap: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  prefix: { color: colors.muted, fontWeight: "700", marginRight: 4 },
  input: { flex: 1, color: colors.ink, fontSize: 15, height: 50 },
  btn: {
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
  },
  btnOutline: { borderWidth: 1.5, borderColor: colors.ink, backgroundColor: "transparent" },
  btnText: { color: colors.ink, fontWeight: "800", fontSize: 15 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stepBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  stepVal: { minWidth: 24, textAlign: "center", fontWeight: "800", color: colors.ink },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 24, fontWeight: "800" },
  pill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, alignSelf: "flex-start" },
  pillText: { color: colors.ink, fontSize: 11, fontWeight: "800" },
});
