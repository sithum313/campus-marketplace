import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

/** Use "mci:name" for MaterialCommunityIcons, otherwise an Ionicons name. */
export function AppIcon({
  name,
  size = 22,
  color = "#1E2230",
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  if (name.startsWith("mci:"))
    return (
      <MaterialCommunityIcons
        name={name.slice(4) as any}
        size={size}
        color={color}
      />
    );
  return <Ionicons name={name as any} size={size} color={color} />;
}
