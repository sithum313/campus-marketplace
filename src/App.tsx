import { StatusBar } from "expo-status-bar";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
  User,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { BottomTabs, buyerTabs } from "./components/BottomTabs";
import { ModeToggle } from "./components/ModeToggle";
import { seedEvents, seedListings, seedOffers } from "./data";
import { auth, db, firebaseConfigured } from "./firebase";
import { AuthPage, SignUpData } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DiscountsPage, EventsPage } from "./pages/SubPages";
import { colors } from "./theme";
import { CampusEvent, Listing, Mode, Offer, SubPage, Tab } from "./types";

async function registerUser(user: User) {
  if (!db) return;
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      displayName:
        user.displayName || user.email?.split("@")[0] || "Campus student",
      email: user.email || "",
      photoURL: user.photoURL || null,
      campus: "North Campus",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}


function ComingSoon({ title }: { title: string }) {
  return (
    <View style={styles.soon}>
      <Text style={styles.soonTitle}>{title}</Text>
      <Text style={styles.soonText}>This part of Unizon is coming in the next update.</Text>
    </View>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>("buyer");
  const [tab, setTab] = useState<Tab>("Home");
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [user, setUser] = useState<User | null>(auth?.currentUser || null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [profileReady, setProfileReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [toast, setToast] = useState("");

  // marketplace data
  const [cloudItems, setCloudItems] = useState<Listing[]>([]);
  const [events] = useState<CampusEvent[]>(seedEvents);
  const [offers] = useState<Offer[]>(seedOffers);

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast((t) => (t === message ? "" : t)), 2600);
  };

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) return;
    const handleUser = (nextUser: User | null) => {
      setUser(nextUser);
      if (nextUser)
        registerUser(nextUser)
          .then(() => setProfileReady(true))
          .catch((error) =>
            setAuthError(error instanceof Error ? error.message : "Could not create profile."),
          );
      else setProfileReady(false);
    };
    let unsubscribe: () => void = () => undefined;
    setPersistence(firebaseAuth, browserLocalPersistence)
      .then(() => {
        unsubscribe = onAuthStateChanged(firebaseAuth, handleUser);
        return getRedirectResult(firebaseAuth);
      })
      .then((result) => {
        if (result?.user) handleUser(result.user);
      })
      .catch((error) =>
        setAuthError(error instanceof Error ? error.message : "Google sign-in could not be completed."),
      );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const listingsQuery = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    return onSnapshot(
      listingsQuery,
      (snapshot) =>
        setCloudItems(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Listing)),
      () => setCloudItems([]),
    );
  }, []);

  const items = useMemo(() => [...cloudItems, ...seedListings], [cloudItems]);
  const visibleItems = useMemo(() => items.filter((i) => !i.soldOut), [items]);

  /* ---------- navigation ---------- */

  const goTab = (next: Tab) => {
    setSubPage(null);
    setTab(next);
  };
  const openCategory = (_name: string) => goTab("Search");
  const openItem = (_item: Listing) => flash("Product details are coming in the next update");

  /* ---------- auth (unchanged) ---------- */

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase is not configured yet.");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setUser(cred.user);
    setAuthOpen(false);
  };
  const signUpWithEmail = async ({ name, email, phone, password }: SignUpData) => {
    if (!auth) throw new Error("Firebase is not configured yet.");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    if (db)
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          uid: cred.user.uid,
          displayName: name,
          email,
          phone,
          campus: "North Campus",
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    setUser(auth.currentUser);
    setProfileReady(true);
    setAuthOpen(false);
  };
  const signInWithGoogle = async () => {
    if (!auth) return;
    setAuthError("");
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (Platform.OS === "web") {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        await registerUser(result.user);
        setUser(result.user);
        setProfileReady(true);
        setAuthOpen(false);
      } else {
        await signInAnonymously(auth);
        setAuthOpen(false);
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : "Google sign-in failed.";
      if (Platform.OS === "web" && /popup|cancelled-popup-request/i.test(code)) {
        await signInWithRedirect(auth, new GoogleAuthProvider());
        return;
      }
      setAuthError(code);
      Alert.alert("Google sign-in failed", code);
    }
  };

  if (!onboarded) {
    return (
      <OnboardingPage
        onDone={() => {
          setOnboarded(true);
          setAuthOpen(true);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {mode === "seller" ? (
        <ComingSoon title="Seller mode" />
      ) : (
        <>
          {tab === "Home" && subPage === "discounts" && (
            <DiscountsPage items={visibleItems} onOpen={openItem} onBack={() => setSubPage(null)} />
          )}
          {tab === "Home" && subPage === "events" && (
            <EventsPage
              items={visibleItems}
              events={events}
              offers={offers}
              onOpen={openItem}
              onBack={() => setSubPage(null)}
            />
          )}
          {tab === "Home" && subPage === null && (
            <HomePage
              items={visibleItems}
              events={events}
              offers={offers}
              onOpen={openItem}
              onCategory={openCategory}
              onSeeDiscounts={() => setSubPage("discounts")}
              onSeeEvents={() => setSubPage("events")}
            />
          )}
          {tab === "Search" && <ComingSoon title="Search" />}
          {tab === "Messages" && <ComingSoon title="Messages" />}
          {tab === "Cart" && <ComingSoon title="Cart" />}
          {tab === "Profile" && <ComingSoon title="Profile" />}
          <BottomTabs tabs={buyerTabs} current={tab} onChange={(key) => goTab(key as Tab)} />
        </>
      )}

      <ModeToggle mode={mode} onChange={setMode} />

      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}

      <Modal visible={authOpen} animationType="slide" onRequestClose={() => setAuthOpen(false)}>
        <AuthPage
          onSignIn={signInWithEmail}
          onSignUp={signUpWithEmail}
          onGoogle={signInWithGoogle}
          onGuest={() => setAuthOpen(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toastWrap: { position: "absolute", left: 0, right: 0, bottom: 110, alignItems: "center", zIndex: 60 },
  toast: { backgroundColor: colors.ink, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 11 },
  toastText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  soon: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  soonTitle: { color: colors.ink, fontSize: 20, fontWeight: "800", marginBottom: 6 },
  soonText: { color: colors.muted, textAlign: "center", lineHeight: 20 },
});
