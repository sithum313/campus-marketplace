import { ReactNode, useState } from "react";
import { ImageBackground, StyleProp, ViewStyle } from "react-native";
import { eventCovers, remoteCovers } from "../designs";

/** Event cover photo: loads the real photo, and falls back to the bundled picture if it cannot load. */
export function CoverImage({
  coverKey,
  style,
  imageStyle,
  children,
}: {
  coverKey: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: object;
  children?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const remote = remoteCovers[coverKey];
  const source = !failed && remote ? { uri: remote } : eventCovers[coverKey];
  return (
    <ImageBackground
      source={source}
      onError={() => setFailed(true)}
      style={[{ backgroundColor: "#E9EDF3", overflow: "hidden" }, style]}
      imageStyle={imageStyle}
    >
      {children}
    </ImageBackground>
  );
}
