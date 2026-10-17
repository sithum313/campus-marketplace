import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

type Slide = {
  key: string;
  bg: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  photo?: boolean;
};

// Colors sampled from the reference design (pink, teal, yellow).
const SLIDES: Slide[] = [
  {
    key: "sell",
    bg: "#F4D4E1",
    title: "Sell with\nease",
    subtitle: "List what you no longer need and earn right on campus.",
    image: require("../../assets/onboarding/sell.png"),
  },
  {
    key: "buy",
    bg: "#85DAE1",
    title: "Buy\nsmart",
    subtitle: "Find great student deals from sellers around you.",
    image: require("../../assets/onboarding/buy.png"),
  },
  {
    key: "events",
    bg: "#F6C52A",
    title: "Events,\nsorted",
    subtitle: "Run event buying and selling in one place.",
    image: require("../../assets/onboarding/events.jpg"),
    photo: true,
  },
];

const INK = "#1E2230";

export function OnboardingPage({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  const backgroundColor = scrollX.interpolate({
    inputRange: SLIDES.map((_, i) => i * width),
    outputRange: SLIDES.map((slide) => slide.bg),
  });

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  const next = () => {
    if (last) return onDone();
    scroller.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };

  return (
    <Animated.View style={[styles.root, { backgroundColor }]}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.logo}>
            uni<Text style={styles.logoAccent}>zon</Text>
          </Text>
          {!last && (
            <Pressable onPress={onDone} hitSlop={12}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          )}
        </View>

        <Animated.ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onMomentumScrollEnd={onEnd}
        >
          {SLIDES.map((slide) => (
            <View key={slide.key} style={{ width }}>
              <View style={[styles.art, { height: height * 0.46 }]}>
                <Image
                  source={slide.image}
                  resizeMode={slide.photo ? "cover" : "contain"}
                  style={
                    slide.photo
                      ? styles.photo
                      : { width: width * 0.8, height: "100%" }
                  }
                />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </View>
            </View>
          ))}
        </Animated.ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((slide, i) => (
              <View
                key={slide.key}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>
          <Pressable style={styles.next} onPress={next}>
            <Text style={[styles.nextText, last && styles.startText]}>
              {last ? "Start" : "›"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: { color: INK, fontSize: 26, fontWeight: "400", letterSpacing: -0.5 },
  logoAccent: { fontWeight: "900" },
  skip: { color: INK, fontSize: 15, fontWeight: "600" },
  art: { alignItems: "center", justifyContent: "center", marginTop: 12 },
  photo: { width: "62%", height: "100%", borderRadius: 28 },
  copy: { paddingHorizontal: 28, marginTop: 28 },
  title: {
    color: INK,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: INK,
    opacity: 0.75,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 300,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingBottom: 28,
    paddingTop: 12,
  },
  dots: { flexDirection: "row", gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: INK,
    opacity: 0.25,
  },
  dotActive: { width: 22, opacity: 1 },
  next: {
    minWidth: 64,
    height: 64,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: INK, fontSize: 26, fontWeight: "700" },
  startText: { fontSize: 16 },
});
