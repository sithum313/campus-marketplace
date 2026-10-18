import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export type SignUpData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

type Props = {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (data: SignUpData) => Promise<void>;
  onGoogle: () => Promise<void>;
  onGuest: () => void;
};

const YELLOW = "#BFE2F7"; // light blue
const INK = "#1E2230";

function friendlyError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  if (/email-already-in-use/.test(text)) return "This email is already registered. Try signing in.";
  if (/invalid-credential|wrong-password|user-not-found/.test(text)) return "Incorrect email or password.";
  if (/invalid-email/.test(text)) return "Please enter a valid email address.";
  if (/weak-password/.test(text)) return "Password should be at least 6 characters.";
  if (/network/.test(text)) return "Network error. Check your connection and try again.";
  if (/operation-not-allowed/.test(text)) return "Email/password sign-in is not enabled in Firebase yet.";
  return text || "Something went wrong. Please try again.";
}

export function AuthPage({ onSignIn, onSignUp, onGoogle, onGuest }: Props) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signUp = mode === "up";

  const google = async () => {
    setError("");
    setBusy(true);
    try {
      await onGoogle();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: "in" | "up") => {
    setMode(next);
    setError("");
  };

  const submit = async () => {
    const cleanEmail = email.trim();
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (signUp && !name.trim()) return setError("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError("Please enter a valid email address.");
    if (signUp && !/^\+?\d{9,15}$/.test(cleanPhone)) return setError("Please enter a valid phone number.");
    if (password.length < 6) return setError("Password should be at least 6 characters.");
    if (signUp && !agreed) return setError("Please agree to the Terms & Conditions.");
    setError("");
    setBusy(true);
    try {
      if (signUp) await onSignUp({ name: name.trim(), email: cleanEmail, phone: cleanPhone, password });
      else await onSignIn(cleanEmail, password);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.top}>
              <Text style={styles.welcome}>Welcome to</Text>
              <Text style={styles.brand}>
                uni<Text style={styles.brandBold}>zon</Text>
              </Text>
              <Text style={styles.tagline}>
                {signUp ? "Create your account to get started" : "Sign in to continue"}
              </Text>

              <View style={styles.tabs}>
                <Tab label="Sign in" active={!signUp} onPress={() => switchMode("in")} />
                <Tab label="Sign up" active={signUp} onPress={() => switchMode("up")} />
              </View>

              {signUp && (
                <Field
                  placeholder="Full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              )}
              <Field
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {signUp && (
                <Field
                  placeholder="Phone number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              )}
              <Field
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoComplete={signUp ? "new-password" : "current-password"}
                right={
                  <Pressable onPress={() => setShowPw(!showPw)} hitSlop={10}>
                    <Text style={styles.show}>{showPw ? "Hide" : "Show"}</Text>
                  </Pressable>
                }
              />
            </View>

            {/* brush-stroke edge between yellow and white */}
            <View style={styles.brush}>
              <View style={[styles.stroke, { top: 18, height: 70, transform: [{ rotate: "-3deg" }] }]} />
              <View style={[styles.stroke, { top: 8, height: 12, width: "55%", left: "-8%", transform: [{ rotate: "2deg" }] }]} />
              <View style={[styles.stroke, { top: 12, height: 8, width: "35%", left: "70%", transform: [{ rotate: "-5deg" }] }]} />
            </View>

            <View style={styles.bottom}>
              <Pressable style={styles.go} onPress={submit} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.goText}>›</Text>
                )}
              </Pressable>

              {signUp && (
                <Pressable style={styles.terms} onPress={() => setAgreed(!agreed)}>
                  <View style={[styles.box, agreed && styles.boxOn]}>
                    {agreed && <Text style={styles.tick}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>I agree with Terms & Conditions</Text>
                </Pressable>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.orLine} />
              </View>
              <Pressable style={styles.google} onPress={google} disabled={busy}>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </Pressable>

              <Pressable style={{ marginTop: 18 }} onPress={() => switchMode(signUp ? "in" : "up")}>
                <Text style={styles.switch}>
                  {signUp ? "Already have an account? " : "New to unizon? "}
                  <Text style={styles.switchBold}>{signUp ? "Sign in" : "Sign up"}</Text>
                </Text>
              </Pressable>
              <Pressable onPress={onGuest} hitSlop={8}>
                <Text style={styles.guest}>Browse as guest</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabOn]}>
      <Text style={[styles.tabText, active && styles.tabTextOn]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  right,
  ...props
}: React.ComponentProps<typeof TextInput> & { right?: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <TextInput
        {...props}
        placeholderTextColor="#8A8F9C"
        style={styles.input}
      />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: YELLOW },
  scroll: { flexGrow: 1, backgroundColor: "#FAFAF7" },
  top: { backgroundColor: YELLOW, paddingHorizontal: 28, paddingTop: 36, paddingBottom: 8 },
  welcome: { color: INK, fontSize: 18, fontWeight: "500" },
  brand: { color: INK, fontSize: 44, fontWeight: "400", letterSpacing: -1, marginTop: 2 },
  brandBold: { fontWeight: "900" },
  tagline: { color: INK, opacity: 0.75, fontSize: 15, marginTop: 4, marginBottom: 20 },
  tabs: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,.45)",
    borderRadius: 24,
    padding: 4,
    marginBottom: 18,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 20 },
  tabOn: { backgroundColor: "#FFF" },
  tabText: { color: INK, opacity: 0.7, fontWeight: "600" },
  tabTextOn: { opacity: 1, fontWeight: "800" },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 52,
    marginBottom: 12,
  },
  input: { flex: 1, color: INK, fontSize: 15, height: "100%" },
  show: { color: INK, fontWeight: "700", fontSize: 13 },
  brush: { height: 70, backgroundColor: YELLOW, overflow: "hidden" },
  stroke: {
    position: "absolute",
    left: "-15%",
    width: "130%",
    backgroundColor: "#FAFAF7",
  },
  bottom: { alignItems: "center", paddingHorizontal: 28, paddingBottom: 32, marginTop: -26 },
  go: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  goText: { color: "#FFF", fontSize: 32, marginTop: -3 },
  terms: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: INK,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  boxOn: { backgroundColor: INK },
  tick: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  termsText: { color: INK, fontSize: 13 },
  error: {
    color: "#B64950",
    backgroundColor: "#FBECEE",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
    alignSelf: "stretch",
  },
  orRow: { flexDirection: "row", alignItems: "center", alignSelf: "stretch", gap: 12, marginBottom: 14, marginTop: 4 },
  orLine: { flex: 1, height: 1, backgroundColor: "#DDE3EA" },
  orText: { color: "#8A8F9C", fontSize: 13 },
  google: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#D5DCE5",
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleG: { color: "#4285F4", fontSize: 20, fontWeight: "900" },
  googleText: { color: INK, fontWeight: "700", fontSize: 15 },
  switch: { color: INK, fontSize: 14 },
  switchBold: { fontWeight: "800" },
  guest: { color: "#6B7080", fontSize: 13, marginTop: 14, textDecorationLine: "underline" },
});
