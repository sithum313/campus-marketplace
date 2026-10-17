import { useState } from "react";
import { Image, StyleProp, View, ViewStyle } from "react-native";
import { designById } from "../designs";
import { productImages } from "../productImages";
import { colors } from "../theme";
import { Listing } from "../types";
import { AppIcon } from "./AppIcon";

const tints = [colors.pink, colors.teal, colors.blue, "#FBE9A6"];

/** Shows the listing photo, or a soft colored tile with an icon when there is none. */
export function ProductImage({
  item,
  style,
  iconSize = 34,
}: {
  item: Listing;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  const local = productImages[item.id];
  if (local)
    return <Image source={local} style={[{ width: "100%", height: "100%" }, style as object]} />;
  if (item.image && !failed)
    return (
      <Image
        onError={() => setFailed(true)}
        source={{ uri: item.image }}
        style={[{ width: "100%", height: "100%" }, style as object]}
      />
    );
  const art = item.kind === "bookmark" ? designById(item.designs?.[0]) : undefined;
  if (art)
    return <Image source={art.source} style={[{ width: "100%", height: "100%" }, style as object]} />;
  const tint = tints[Math.abs(hash(item.id)) % tints.length];
  return (
    <View
      style={[
        {
          width: "100%",
          height: "100%",
          backgroundColor: tint,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <AppIcon name={item.icon || "cube-outline"} size={iconSize} color={colors.ink} />
    </View>
  );
}

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return h;
}
