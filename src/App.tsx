import { StatusBar } from "expo-status-bar";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { BottomTabs, buyerTabs } from "./components/BottomTabs";
import { ListingModal } from "./components/ListingModal";
import { ModeToggle } from "./components/ModeToggle";
import { seedEvents, seedListings, seedOffers, seedOrders, seedSellerOrders } from "./data";
import { auth, db, firebaseConfigured } from "./firebase";
import { lineKeyOf, priceCart, variantLabel } from "./lib/cart";
import { applyFilters, defaultFilters } from "./lib/filter";
import { AllItemsPage } from "./pages/AllItemsPage";
import { AuthPage, SignUpData } from "./pages/AuthPage";
import { CartPage } from "./pages/CartPage";
import { ChatPage } from "./pages/ChatPage";
import { HomePage } from "./pages/HomePage";
import { MessagesPage } from "./pages/MessagesPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProfilePage, ProfileTab } from "./pages/ProfilePage";
import { DiscountsPage, EventsPage } from "./pages/SubPages";
import { ProductDraft } from "./seller/ProductForm";
import { SellerApp } from "./seller/SellerApp";
import { colors } from "./theme";
import {
  CampusEvent,
  CartLine,
  Conversation,
  Filters,
  Listing,
  Message,
  Mode,
  Offer,
  Order,
  OrderStatus,
  SubPage,
  Tab,
} from "./types";
import React from "react";

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

const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export default function App() {
  const [mode, setMode] = useState<Mode>("buyer");
  const [tab, setTab] = useState<Tab>("Home");
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [queryText, setQueryText] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const getInitialOnboarded = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem("unizon_onboarded") === "true";
      }
    } catch {
      // fallback
    }
    return false;
  };

  const [user, setUser] = useState<User | null>(auth?.currentUser || null);
  const [authLoading, setAuthLoading] = useState(Boolean(auth));
  const [authOpen, setAuthOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [profileReady, setProfileReady] = useState(false);
  const [onboarded, setOnboarded] = useState(getInitialOnboarded);
  const [toast, setToast] = useState("");

  const markOnboarded = () => {
    setOnboarded(true);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("unizon_onboarded", "true");
      }
    } catch {
      // ignore
    }
  };

  // marketplace data
  const [cloudItems, setCloudItems] = useState<Listing[]>([]);
  const [localItems, setLocalItems] = useState<Listing[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<Listing>>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>(seedEvents);
  const [offers, setOffers] = useState<Offer[]>(seedOffers);

  // buyer data
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>(firebaseConfigured ? [] : seedOrders);
  const [localConversations, setLocalConversations] = useState<Conversation[]>([]);
  const [cloudConversations, setCloudConversations] = useState<Conversation[]>([]);
  const [cloudMessages, setCloudMessages] = useState<Record<string, Message[]>>({});
  const [chatId, setChatId] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<{ tab: ProfileTab; nonce: number }>({ tab: "ongoing", nonce: 0 });

  // seller data
  const [sellerOrders, setSellerOrders] = useState<Order[]>(seedSellerOrders);

  const ownerId = user?.uid || "demo-seller";
  const ownerName = user?.displayName || user?.email?.split("@")[0] || "You";
  const needsSignIn = firebaseConfigured && !user;
  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast((t) => (t === message ? "" : t)), 2600);
  };

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) {
      setAuthLoading(false);
      return;
    }
    const handleUser = (nextUser: User | null) => {
      setUser(nextUser);
      setAuthLoading(false);
      if (nextUser) {
        markOnboarded();
        registerUser(nextUser)
          .then(() => setProfileReady(true))
          .catch((error) =>
            setAuthError(error instanceof Error ? error.message : "Could not create profile."),
          );
      } else {
        setProfileReady(false);
      }
    };
    let unsubscribe: () => void = () => undefined;
    (Platform.OS === "web" ? setPersistence(firebaseAuth, browserLocalPersistence) : Promise.resolve())
      .then(() => {
        unsubscribe = onAuthStateChanged(firebaseAuth, handleUser);
        return getRedirectResult(firebaseAuth);
      })
      .then((result) => {
        if (result?.user) handleUser(result.user);
      })
      .catch((error) => {
        setAuthLoading(false);
        setAuthError(error instanceof Error ? error.message : "Google sign-in could not be completed.");
      });
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

  // Favorites are stored per authenticated user in Firestore.
  useEffect(() => {
    if (!db || !user) { setSavedIds([]); return; }
    return onSnapshot(collection(db, "users", user.uid, "saved"),
      (snapshot) => setSavedIds(snapshot.docs.map((entry) => entry.id)),
      (error) => flash(`Could not load saved items: ${error.message}`));
  }, [user?.uid]);

  // Listen for conversations involving current user
  useEffect(() => {
    if (!db || !user) {
      setCloudConversations([]);
      return;
    }
    const q = query(
      collection(db, "conversations"),
      where("memberIds", "array-contains", user.uid),
    );
    return onSnapshot(
      q,
      (snapshot) => {
        setCloudConversations(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              itemId: data.itemId || "",
              itemTitle: data.itemTitle || "",
              seller: data.seller || "Seller",
              sellerId: data.sellerId,
              buyer: data.buyer || "Buyer",
              buyerId: data.buyerId,
              memberIds: data.memberIds || [],
              messages: [],
              lastMessage: data.lastMessage,
              updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
            } as Conversation;
          }),
        );
      },
      (error) => {
        console.log("Conversations sync error:", error);
      },
    );
  }, [user?.uid]);

  // Listen for real-time messages in active chat
  useEffect(() => {
    if (!db || !chatId || !user) return;
    const q = query(
      collection(db, "conversations", chatId, "messages"),
      orderBy("at", "asc"),
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const isMine = d.senderId === user.uid;
          return {
            id: docSnap.id,
            text: d.text || "",
            mine: isMine,
            senderId: d.senderId,
            senderName: d.senderName,
            at: d.at?.toMillis ? d.at.toMillis() : (typeof d.at === "number" ? d.at : Date.now()),
          };
        });
        setCloudMessages((prev) => ({ ...prev, [chatId]: msgs }));
      },
      (error) => {
        console.log("Chat messages sync error:", error);
      },
    );
  }, [chatId, user?.uid]);

  const conversations = useMemo(() => {
    const map = new Map<string, Conversation>();
    for (const c of localConversations) {
      map.set(c.id, c);
    }
    for (const c of cloudConversations) {
      const msgs = cloudMessages[c.id] || c.messages || [];
      const prev = map.get(c.id);
      map.set(c.id, {
        ...c,
        messages: msgs.length ? msgs : (prev?.messages || []),
      });
    }
    return Array.from(map.values());
  }, [localConversations, cloudConversations, cloudMessages]);

  const sellerConversations = useMemo(
    () =>
      conversations.filter(
        (c) => !user || c.sellerId === ownerId || c.seller === ownerName,
      ),
    [conversations, user, ownerId, ownerName],
  );

  /** Every listing the buyer can see: your new ones, cloud ones, then the demo catalogue. */
  const items = useMemo(
    () =>
      [...localItems, ...cloudItems, ...seedListings]
        .filter((item) => !removed.includes(item.id))
        .map((item) => (edits[item.id] ? { ...item, ...edits[item.id] } : item)),
    [localItems, cloudItems, edits, removed],
  );
  const eventProducts = useMemo(() => items.filter((i) => i.eventId), [items]);
  const myProducts = useMemo(
    () => items.filter((i) => i.sellerId === ownerId && !i.eventId),
    [items, ownerId],
  );
  const visibleItems = useMemo(() => items.filter((i) => !i.soldOut), [items]);
  const filteredItems = useMemo(
    () => applyFilters(visibleItems, queryText, filters),
    [visibleItems, queryText, filters],
  );
  const cartUnits = cart.reduce((sum, line) => sum + line.qty, 0);
  const cartTotal = priceCart(cart, items, offers).total;

  /* ---------- buyer actions ---------- */

  const toggleSaved = async (id: string) => {
    if (needsSignIn) { setAuthOpen(true); return; }
    if (db && user) {
      try {
        const favorite = doc(db, "users", user.uid, "saved", id);
        if (savedIds.includes(id)) await deleteDoc(favorite);
        else await setDoc(favorite, { listingId: id, savedAt: serverTimestamp() });
      } catch (error) { flash(error instanceof Error ? error.message : "Could not update favorites"); }
      return;
    }
    setSavedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };
  const addToCart = (input: Omit<CartLine, "key">) => {
    const item = items.find((i) => i.id === input.itemId);
    if (!item || item.soldOut || item.stock === 0) { flash("This item is unavailable"); return; }
    if (!Number.isInteger(input.qty) || input.qty < 1) return;
    const existing = cart.filter((l) => l.itemId === input.itemId).reduce((n, l) => n + l.qty, 0);
    if (item.stock !== undefined && existing + input.qty > item.stock) { flash("Not enough stock available"); return; }
    const key = lineKeyOf(input.itemId, input);
    setCart((current) =>
      current.some((l) => l.key === key)
        ? current.map((l) => (l.key === key ? { ...l, qty: l.qty + input.qty } : l))
        : [...current, { ...input, key }],
    );
  };
  const setLineQty = (key: string, qty: number) => {
    const line = cart.find((l) => l.key === key);
    if (!line || !Number.isInteger(qty) || qty < 1) return;
    const item = items.find((i) => i.id === line.itemId);
    const otherQty = cart.filter((l) => l.itemId === line.itemId && l.key !== key).reduce((n, l) => n + l.qty, 0);
    if (item?.stock !== undefined && qty + otherQty > item.stock) { flash("Not enough stock available"); return; }
    setCart((current) => current.map((l) => l.key === key ? { ...l, qty } : l));
  };
  const removeLine = (key: string) => setCart((current) => current.filter((l) => l.key !== key));

  const goTab = (next: Tab) => {
    if (next === "Search") setFilters((f) => ({ ...f, category: "All items" }));
    setSubPage(null);
    setTab(next);
  };
  const openCategory = (name: string) => {
    setFilters((f) => ({ ...f, category: name }));
    setSubPage(null);
    setTab("Search");
  };

  const checkout = () => {
    if (needsSignIn) return setAuthOpen(true);
    const { rows, total } = priceCart(cart, items, offers);
    if (!rows.length) return;
    if (rows.length !== cart.length || rows.some((r) => r.item.soldOut || (r.item.stock !== undefined && cart.filter((l) => l.itemId === r.item.id).reduce((n, l) => n + l.qty, 0) > r.item.stock!))) {
      flash("Some cart items are unavailable or exceed stock. Please review your cart.");
      return;
    }
    const sellers = Array.from(new Set(rows.map((r) => r.item.seller)));
    const eventIds = Array.from(new Set(rows.map((r) => r.item.eventId)));
    const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrders((o) => [
      {
        id,
        date: today(),
        status: "Placed",
        party: sellers.length > 2 ? `${sellers.length} sellers` : sellers.join(" & "),
        eventId: eventIds.length === 1 ? eventIds[0] : undefined,
        total,
        lines: rows.map((r) => ({
          title: r.item.title,
          qty: r.line.qty,
          unitPrice: r.item.price,
          variant: variantLabel(r.line) || undefined,
          itemId: r.item.id,
        })),
      },
      ...o,
    ]);
    // keep local stock / sold counts in step
    setEdits((current) => {
      const next = { ...current };
      for (const r of rows) {
        const stock = r.item.stock === undefined ? undefined : Math.max(0, r.item.stock - r.line.qty);
        next[r.item.id] = {
          ...next[r.item.id],
          sold: (r.item.sold || 0) + r.line.qty,
          ...(stock === undefined ? {} : { stock, soldOut: stock === 0 }),
        };
      }
      return next;
    });
    // demo: orders on your own products show up in seller mode too
    const mine = rows.filter((r) => r.item.sellerId === ownerId);
    if (mine.length)
      setSellerOrders((o) => [
        {
          id: `S-${Math.floor(1000 + Math.random() * 9000)}`,
          date: today(),
          status: "Placed",
          party: ownerName,
          total: Math.round(mine.reduce((s, r) => s + r.gross - r.discount, 0) * 100) / 100,
          lines: mine.map((r) => ({
            title: r.item.title,
            qty: r.line.qty,
            unitPrice: r.item.price,
            variant: variantLabel(r.line) || undefined,
          })),
        },
        ...o,
      ]);
    setCart([]);
    setProfileTab((p) => ({ tab: "ongoing", nonce: p.nonce + 1 }));
    goTab("Profile");
    flash(`Order ${id} placed`);
  };
  const cancelOrder = (id: string) =>
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status: "Cancelled" } : x)));

  const openChat = (item: Listing) => {
    if (needsSignIn) return setAuthOpen(true);
    if (item.sellerId && user?.uid && item.sellerId === user.uid) {
      flash("You cannot message yourself");
      return;
    }
    const buyerId = user?.uid || "demo-buyer";
    const buyerName = user?.displayName || user?.email?.split("@")[0] || "Buyer";
    const sellerId = item.sellerId || "demo-seller";
    const id = `c-${item.id}-${buyerId}`;

    const newConv: Conversation = {
      id,
      itemId: item.id,
      itemTitle: item.title,
      seller: item.seller,
      sellerId,
      buyer: buyerName,
      buyerId,
      memberIds: [buyerId, sellerId],
      messages: [],
    };

    setLocalConversations((list) =>
      list.some((c) => c.id === id) ? list : [newConv, ...list],
    );

    if (db && user) {
      setDoc(
        doc(db, "conversations", id),
        {
          id,
          itemId: item.id,
          itemTitle: item.title,
          seller: item.seller,
          sellerId,
          buyer: buyerName,
          buyerId,
          memberIds: [buyerId, sellerId],
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ).catch((err) => console.log("Create conversation error:", err));
    }

    setChatId(id);
    setSelected(null);
    setMode("buyer");
    setSubPage("chat");
    setTab("Messages");
  };

  const sendMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean || !chatId) return;

    const currentConv = conversations.find((c) => c.id === chatId);
    const now = Date.now();
    const senderId = user?.uid || (mode === "seller" ? (currentConv?.sellerId || "demo-seller") : (currentConv?.buyerId || "demo-buyer"));
    const senderName = user?.displayName || user?.email?.split("@")[0] || (mode === "seller" ? (currentConv?.seller || "Seller") : "Buyer");

    const newMsg: Message = {
      id: String(now),
      mine: true,
      text: clean,
      at: now,
      senderId,
      senderName,
    };

    setLocalConversations((list) =>
      list.map((c) =>
        c.id === chatId
          ? {
              ...c,
              lastMessage: clean,
              messages: [...c.messages, newMsg],
            }
          : c,
      ),
    );

    if (db && user && currentConv) {
      try {
        const buyerId = currentConv.buyerId || user.uid;
        const sellerId = currentConv.sellerId || "demo-seller";
        const memberIds = [buyerId, sellerId];

        await setDoc(
          doc(db, "conversations", chatId),
          {
            id: chatId,
            itemId: currentConv.itemId,
            itemTitle: currentConv.itemTitle,
            seller: currentConv.seller,
            sellerId,
            buyer: currentConv.buyer || "Buyer",
            buyerId,
            memberIds,
            lastMessage: clean,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        await addDoc(collection(db, "conversations", chatId, "messages"), {
          text: clean,
          senderId: user.uid,
          senderName: user.displayName || user.email?.split("@")[0] || "Student",
          at: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to sync message to Firestore:", err);
      }
    }
  };

  /* ---------- seller actions ---------- */

  const patchListing = async (id: string, patch: Partial<Listing>) => {
    if (db && cloudItems.some((i) => i.id === id)) {
      await updateDoc(doc(db, "listings", id), clean(patch));
    } else if (localItems.some((i) => i.id === id)) {
      setLocalItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    } else {
      setEdits((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
    }
  };
  const saveProduct = async (draft: ProductDraft, id?: string) => {
    if (needsSignIn) return setAuthOpen(true);
    try {
      const event = events.find((e) => e.id === draft.eventId);
      if (!draft.title.trim() || !Number.isFinite(draft.price) || draft.price <= 0 || (draft.stock !== undefined && (!Number.isInteger(draft.stock) || draft.stock < 0))) {
        flash("Please enter a valid name, price and stock quantity"); return;
      }
      if (id && items.find((i) => i.id === id)?.sellerId !== ownerId) { flash("You can only edit your own products"); return; }
      const data = { ...draft, seller: event?.organizer || ownerName, sellerId: ownerId };
      if (id) {
        await patchListing(id, clean(data));
        flash("Changes saved");
      } else if (db && user) {
        await addDoc(collection(db, "listings"), { ...clean(data), createdAt: serverTimestamp() });
        flash("Product published");
      } else {
        setLocalItems((list) => [{ id: `local-${Date.now()}`, ...data }, ...list]);
        flash(draft.eventId ? "Added to your event" : "Product published");
      }
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not save the product");
    }
  };
  const deleteProduct = async (id: string) => {
    if (items.find((i) => i.id === id)?.sellerId !== ownerId) { flash("You can only delete your own products"); return; }
    try {
      if (db && cloudItems.some((i) => i.id === id)) await deleteDoc(doc(db, "listings", id));
      setLocalItems((list) => list.filter((i) => i.id !== id));
      setRemoved((r) => [...r, id]);
      flash("Removed");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not delete");
    }
  };
  const toggleSoldOut = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.sellerId !== ownerId) return;
    const out = item.soldOut || item.stock === 0;
    patchListing(id, out ? { soldOut: false, stock: item.stock === 0 ? 1 : item.stock } : { soldOut: true }).catch(
      (e) => flash(e instanceof Error ? e.message : "Could not update"),
    );
  };
  const saveEvent = (data: Omit<CampusEvent, "id">, id?: string) => {
    const eventId = id || `ev-${Date.now()}`;
    setEvents((list) =>
      id ? list.map((e) => (e.id === id ? { ...e, ...data } : e)) : [{ id: eventId, ...data }, ...list],
    );
    flash(id ? "Event updated" : "Event created");
    return eventId;
  };
  const deleteEvent = (id: string) => {
    const productIds = items.filter((i) => i.eventId === id).map((i) => i.id);
    setEvents((list) => list.filter((e) => e.id !== id));
    setOffers((list) => list.filter((o) => o.eventId !== id));
    setLocalItems((list) => list.filter((i) => i.eventId !== id));
    setRemoved((r) => [...r, ...productIds]);
    flash("Event deleted");
  };
  const saveOffer = (offer: Omit<Offer, "id">) => {
    setOffers((list) => [{ id: `o-${Date.now()}`, ...offer }, ...list]);
    flash("Offer published to buyers");
  };
  const setOrderStatus = (id: string, status: OrderStatus) =>
    setSellerOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));

  /* ---------- auth (unchanged) ---------- */

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase is not configured yet.");
    if (Platform.OS === "web") {
      await setPersistence(auth, browserLocalPersistence);
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setUser(cred.user);
    markOnboarded();
    setAuthOpen(false);
  };
  const signUpWithEmail = async ({ name, email, phone, password }: SignUpData) => {
    if (!auth) throw new Error("Firebase is not configured yet.");
    if (Platform.OS === "web") {
      await setPersistence(auth, browserLocalPersistence);
    }
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
    markOnboarded();
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
        markOnboarded();
        setProfileReady(true);
        setAuthOpen(false);
      } else {
        throw new Error("Google sign-in is available on the web version. Please use email sign-in on mobile.");
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

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

  if (!onboarded && !user) {
    return (
      <OnboardingPage
        onDone={() => {
          markOnboarded();
          if (!user) {
            setAuthOpen(true);
          }
        }}
      />
    );
  }

  const activeChat = conversations.find((c) => c.id === chatId);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {mode === "seller" ? (
        <SellerApp
          ownerId={ownerId}
          ownerName={ownerName}
          campus="North Campus"
          products={myProducts}
          events={events}
          eventProducts={eventProducts}
          offers={offers}
          orders={sellerOrders}
          conversations={sellerConversations}
          onSendMessage={sendMessage}
          onSaveProduct={saveProduct}
          onDeleteProduct={deleteProduct}
          onToggleSoldOut={toggleSoldOut}
          onSaveEvent={saveEvent}
          onDeleteEvent={deleteEvent}
          onSaveOffer={saveOffer}
          onDeleteOffer={(id) => setOffers((list) => list.filter((o) => o.id !== id))}
          onOrderStatus={setOrderStatus}
        />
      ) : (
        <>
          {tab === "Home" && subPage === "discounts" && (
            <DiscountsPage items={visibleItems} onOpen={setSelected} onBack={() => setSubPage(null)} />
          )}
          {tab === "Home" && subPage === "events" && (
            <EventsPage
              items={visibleItems}
              events={events}
              offers={offers}
              onOpen={setSelected}
              onBack={() => setSubPage(null)}
            />
          )}
          {tab === "Home" && subPage === null && (
            <HomePage
              items={visibleItems}
              events={events}
              offers={offers}
              query={queryText}
              savedIds={savedIds}
              onQueryChange={setQueryText}
              onSearch={() => goTab("Search")}
              onOpen={setSelected}
              onSave={toggleSaved}
              onCategory={openCategory}
              onSeeDiscounts={() => setSubPage("discounts")}
              onSeeEvents={() => setSubPage("events")}
              onSeeAll={() => goTab("Search")}
            />
          )}
          {tab === "Search" && (
            <AllItemsPage
              items={filteredItems}
              allItems={visibleItems}
              query={queryText}
              filters={filters}
              savedIds={savedIds}
              onQueryChange={setQueryText}
              onFiltersChange={setFilters}
              onSave={toggleSaved}
              onOpen={setSelected}
            />
          )}
          {tab === "Messages" && subPage === "chat" && activeChat && (
            <ChatPage
              conversation={activeChat}
              currentUserId={user?.uid || ownerId}
              onSend={sendMessage}
              onBack={() => setSubPage(null)}
            />
          )}
          {tab === "Messages" && !(subPage === "chat" && activeChat) && (
            <MessagesPage
              conversations={conversations}
              currentUserId={user?.uid || ownerId}
              onOpen={(id) => {
                setChatId(id);
                setSubPage("chat");
              }}
              onBrowse={() => goTab("Search")}
            />
          )}
          {tab === "Cart" && (
            <CartPage
              lines={cart}
              items={items}
              offers={offers}
              onQty={setLineQty}
              onRemove={removeLine}
              onOpen={setSelected}
              onBrowse={() => goTab("Search")}
              onCheckout={checkout}
            />
          )}
          {tab === "Profile" && (
            <ProfilePage
              key={profileTab.nonce}
              user={user}
              orders={orders}
              saved={items.filter((item) => savedIds.includes(item.id))}
              cartCount={cartUnits}
              cartTotal={cartTotal}
              initialTab={profileTab.tab}
              firebaseConfigured={firebaseConfigured}
              profileReady={profileReady}
              error={authError}
              onOpen={setSelected}
              onSave={toggleSaved}
              onCart={() => goTab("Cart")}
              onBrowse={() => goTab("Search")}
              onCancelOrder={cancelOrder}
              onSignIn={() => setAuthOpen(true)}
              onSignOut={() => auth && signOut(auth)}
            />
          )}
          {!(tab === "Messages" && subPage === "chat") && (
            <BottomTabs
              tabs={buyerTabs.map((t) => (t.key === "Cart" ? { ...t, badge: cartUnits } : t))}
              current={tab}
              onChange={(key) => goTab(key as Tab)}
            />
          )}
        </>
      )}

      <ModeToggle
        mode={mode}
        onChange={(next) => {
          setSelected(null);
          setMode(next);
        }}
      />

      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}

      <ListingModal
        item={selected}
        saved={selected ? savedIds.includes(selected.id) : false}
        offers={offers}
        signedIn={!needsSignIn}
        onToggleSave={() => selected && toggleSaved(selected.id)}
        onAdd={addToCart}
        onChat={() => selected && openChat(selected)}
        onViewCart={() => {
          setSelected(null);
          goTab("Cart");
        }}
        onClose={() => setSelected(null)}
      />
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
});
