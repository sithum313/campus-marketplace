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
  writeBatch,
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
import { Alert, Modal, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { BottomTabs, buyerTabs } from "./components/BottomTabs";
import { ListingModal } from "./components/ListingModal";
import { ModeToggle } from "./components/ModeToggle";
import { seedEvents, seedListings, seedOffers, seedOrders, seedSellerOrders } from "./data";
import { auth, db, firebaseConfigured } from "./firebase";
import { CheckoutDetails, lineKeyOf, priceCart, variantLabel } from "./lib/cart";
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
  Mode,
  Offer,
  Order,
  OrderStatus,
  SubPage,
  Tab,
} from "./types";

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
  const [user, setUser] = useState<User | null>(auth?.currentUser || null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [profileReady, setProfileReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [toast, setToast] = useState("");

  // marketplace data
  const [cloudItems, setCloudItems] = useState<Listing[]>([]);
  const [localItems, setLocalItems] = useState<Listing[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<Listing>>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>(seedEvents);
  const [offers, setOffers] = useState<Offer[]>(seedOffers);

  // buyer data
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    if (firebaseConfigured) return [];
    const local = getStoredOrders();
    return local.length > 0 ? local : seedOrders;
  });
  const [conversations, setConversations] = useState<Conversation[]>(
    firebaseConfigured ? [] : seedConversations,
  );
  const [chatId, setChatId] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<{ tab: ProfileTab; nonce: number }>({ tab: "ongoing", nonce: 0 });

  // seller data
  const [sellerOrders, setSellerOrders] = useState<Order[]>(() => {
    const local = getStoredSellerOrders();
    if (local.length > 0) return local;
    return seedSellerOrders;
  });

  const ownerId = user?.uid || "demo-seller";
  const ownerName = user?.displayName || user?.email?.split("@")[0] || "You";
  const needsSignIn = firebaseConfigured && !user;
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

  // Sync saved favorites
  useEffect(() => {
    if (!db || !user) { setSavedIds([]); return; }
    return onSnapshot(collection(db, "users", user.uid, "saved"),
      (snapshot) => setSavedIds(snapshot.docs.map((entry) => entry.id)),
      (error) => flash(`Could not load saved items: ${error.message}`));
  }, [user?.uid]);

  // Sync Buyer Orders from Firestore
  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, "orders"), where("buyerId", "==", user.uid));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Order);
        list.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });
        setOrders(list);
      },
      (error) => console.warn("Buyer orders sync notice:", error.message),
    );
  }, [user?.uid]);

  // Only show orders whose sellerId belongs to the signed-in seller.
  useEffect(() => {
    if (!db || !user) { setSellerOrders([]); return; }
    const q = query(collection(db, "orders"), where("sellerId", "==", user.uid));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((entry) => {
        const data = entry.data();
        return { ...data, id: entry.id, party: data.buyerName || "Buyer" } as Order;
      });
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setSellerOrders(list);
    }, (error) => console.warn("Could not load seller orders:", error));
  }, [user?.uid]);

  // Sync user conversations (both where user is buyer or seller)
  useEffect(() => {
    if (!db || !user) {
      if (!firebaseConfigured) {
        setConversations(seedConversations);
      } else {
        setConversations([]);
      }
      return;
    }
    const q = query(collection(db, "conversations"), where("memberIds", "array-contains", user.uid));
    return onSnapshot(
      q,
      (snapshot) => {
        setConversations((prev) => {
          const list = snapshot.docs.map((d) => {
            const data = d.data();
            const existing = prev.find((c) => c.id === d.id);
            return {
              id: d.id,
              ...data,
              messages: existing?.messages || [],
            } as Conversation;
          });
          list.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
          return list;
        });
      },
      (error) => console.warn("Conversations sync error:", error),
    );
  }, [user?.uid]);

  // Sync messages in the currently active chat (works for both buyer and seller)
  useEffect(() => {
    if (!db || !user || !chatId || chatId.startsWith("c-")) return;
    const q = query(collection(db, "conversations", chatId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            text: data.text || "",
            senderId: data.senderId,
            senderName: data.senderName,
            senderRole: data.senderRole,
            mine: data.senderId === user.uid,
            at: data.createdAt?.toMillis?.() || Date.now(),
          };
        });
        setConversations((current) =>
          current.map((c) => (c.id === chatId ? { ...c, messages: msgs } : c)),
        );
      },
      (error) => console.warn("Messages sync error:", error),
    );
  }, [chatId, user?.uid]);

  // Sync events & offers from Firestore
  useEffect(() => {
    if (!db) return;
    const unsubEvents = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        if (!snapshot.empty) {
          setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CampusEvent));
        }
      },
      (error) => console.warn("Events sync notice:", error.message),
    );
    const unsubOffers = onSnapshot(
      collection(db, "offers"),
      (snapshot) => {
        if (!snapshot.empty) {
          setOffers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Offer));
        }
      },
      (error) => console.warn("Offers sync notice:", error.message),
    );
    return () => {
      unsubEvents();
      unsubOffers();
    };
  }, []);

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

  const toggleSaved = (id: string) =>
    setSavedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  const addToCart = (input: Omit<CartLine, "key">) => {
    const key = lineKeyOf(input.itemId, input);
    setCart((current) =>
      current.some((l) => l.key === key)
        ? current.map((l) => (l.key === key ? { ...l, qty: l.qty + input.qty } : l))
        : [...current, { ...input, key }],
    );
  };
  const setLineQty = (key: string, qty: number) =>
    setCart((current) => current.map((l) => (l.key === key ? { ...l, qty } : l)));
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

  const checkout = async (details?: CheckoutDetails) => {
    if (needsSignIn) return setAuthOpen(true);
    const { rows, total } = priceCart(cart, items, offers);
    if (!rows.length) return;
    if (
      rows.length !== cart.length ||
      rows.some(
        (r) =>
          r.item.soldOut ||
          (r.item.stock !== undefined &&
            cart.filter((l) => l.itemId === r.item.id).reduce((n, l) => n + l.qty, 0) > r.item.stock!),
      )
    ) {
      flash("Some cart items are unavailable or exceed stock. Please review your cart.");
      return;
    }
    // Create a separate order for each seller. Do not assign an order to the buyer.
    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
      const sellerId = row.item.sellerId;
      if (!sellerId && db && user) {
        flash(`Seller account is missing for ${row.item.title}. Order not placed.`);
        return;
      }
      const key = sellerId || "demo-seller";
      grouped.set(key, [...(grouped.get(key) || []), row]);
    }
    const promoDiscount = details?.promoDiscount || 0;
    const newOrders: Order[] = [];
    for (const [sellerId, sellerRows] of grouped) {
      const eventIds = Array.from(new Set(sellerRows.map((r) => r.item.eventId)));
      const sellerTotal = priceCart(sellerRows.map((r) => r.line), items, offers).total;
      const share = total > 0 ? promoDiscount * sellerTotal / total : 0;
      newOrders.push({
        id: `ORD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
        date: today(),
        status: "Placed",
        party: sellerRows[0].item.seller || "Seller",
        eventId: eventIds.length === 1 ? eventIds[0] : undefined,
        total: Math.max(0, Math.round((sellerTotal - share) * 100) / 100),
        lines: sellerRows.map((r) => ({
          title: r.item.title,
          qty: r.line.qty,
          unitPrice: r.item.price,
          variant: variantLabel(r.line) || undefined,
          itemId: r.item.id,
        })),
        buyerId: user?.uid || ownerId,
        buyerName: ownerName,
        buyerEmail: user?.email || "",
        sellerId,
        meetupSpot: details?.meetupSpotName || "Campus Safe Handover",
        meetupTime: details?.meetupTime,
        notes: details?.notes,
        promoCode: details?.promoCode,
        discount: share,
      });
    }

    if (db && user) {
      // Only report success after every seller's order is stored successfully.
      try {
        const batch = writeBatch(db);
        for (const order of newOrders) {
          batch.set(doc(db, "orders", order.id), {
            ...clean(order),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      } catch (error) {
        flash(error instanceof Error ? `Order not sent: ${error.message}` : "Order not sent");
        return;
      }
      // The buyer and seller Firestore listeners receive their respective orders.
      for (const row of rows.filter((row, index, all) => all.findIndex((other) => other.item.id === row.item.id) === index)) {
        if (!cloudItems.some((item) => item.id === row.item.id)) continue;
        const item = row.item;
        const qty = cart.filter((line) => line.itemId === item.id).reduce((sum, line) => sum + line.qty, 0);
        try {
          await updateDoc(doc(db, "listings", item.id), {
            sold: (item.sold || 0) + qty,
            ...(item.stock === undefined ? {} : {
              stock: Math.max(0, item.stock - qty),
              soldOut: item.stock - qty <= 0,
            }),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.warn("Could not update listing stock:", error);
        }
      }
    } else {
      setOrders((previous) => {
        const next = [...newOrders, ...previous];
        setStoredOrders(next);
        return next;
      });
      setSellerOrders((previous) => {
        const next = [...newOrders.map((order) => ({ ...order, party: ownerName })), ...previous];
        setStoredSellerOrders(next);
        return next;
      });
    }

    // Keep local stock / sold counts in step
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
    setCart([]);
    setProfileTab((p) => ({ tab: "ongoing", nonce: p.nonce + 1 }));
    goTab("Profile");
    flash(`${newOrders.length} order${newOrders.length === 1 ? "" : "s"} placed`);
  };

  const cancelOrder = async (id: string) => {
    if (db && user) {
      try {
        await updateDoc(doc(db, "orders", id), { status: "Cancelled", updatedAt: serverTimestamp() });
        flash("Order cancelled");
      } catch (e) {
        flash(e instanceof Error ? e.message : "Could not cancel order");
      }
    }
    setOrders((o) => {
      const next = o.map((x) => (x.id === id ? { ...x, status: "Cancelled" as OrderStatus } : x));
      setStoredOrders(next);
      return next;
    });
    setSellerOrders((o) => {
      const next = o.map((x) => (x.id === id ? { ...x, status: "Cancelled" as OrderStatus } : x));
      setStoredSellerOrders(next);
      return next;
    });
  };
  const cancelOrder = (id: string) =>
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status: "Cancelled" } : x)));

  const openChat = (item: Listing) => {
    if (needsSignIn) return setAuthOpen(true);
    const id = `c-${item.id}`;
    setConversations((list) =>
      list.some((c) => c.id === id)
        ? list
        : [{ id, itemId: item.id, itemTitle: item.title, seller: item.seller, messages: [] }, ...list],
    );
    setChatId(id);
    setSelected(null);
    setMode("buyer");
    setSubPage("chat");
    setTab("Messages");
  };
  const sendMessage = (text: string) =>
    setConversations((list) =>
      list.map((c) =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, { id: String(Date.now()), mine: true, text, at: Date.now() }] }
          : c,
      ),
    );

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
      const data = { ...draft, seller: event?.organizer || ownerName, sellerId: ownerId };
      if (id) {
        await patchListing(id, clean(data));
        flash("Changes saved");
      } else if (db && user && !draft.eventId) {
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
    if (!item) return;
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

  const sellerConversations = useMemo(
    () =>
      conversations.filter(
        (c) =>
          c.sellerId === ownerId ||
          (c.sellerId === "demo-seller" && (!user || mode === "seller")) ||
          c.seller === ownerName ||
          (!c.sellerId && c.memberIds?.includes(ownerId)),
      ),
    [conversations, ownerId, ownerName, user, mode],
  );
  const buyerConversations = useMemo(
    () =>
      conversations.filter(
        (c) =>
          c.buyerId === ownerId ||
          (c.buyerId === "buyer-alex" && !user) ||
          (c.buyerId === "buyer-nethmi" && !user) ||
          c.buyer === ownerName ||
          (!c.buyerId && c.memberIds?.includes(ownerId)),
      ),
    [conversations, ownerId, ownerName, user],
  );
  const displaySellerConversations = sellerConversations.length ? sellerConversations : conversations;
  const displayBuyerConversations = buyerConversations.length ? buyerConversations : conversations;

  /* ---------- seller actions ---------- */

  const saveProduct = async (draft: ProductDraft, id?: string) => {
    if (id) {
      if (db && user) {
        try {
          await updateDoc(doc(db, "listings", id), clean({ ...draft, updatedAt: serverTimestamp() }));
        } catch (e) {
          console.warn("Could not update listing in Firestore:", e);
        }
      }
      setEdits((current) => ({ ...current, [id]: draft }));
      flash("Product updated");
    } else {
      const newId = `prod-${Date.now()}`;
      if (db && user) {
        try {
          const docRef = await addDoc(
            collection(db, "listings"),
            clean({
              ...draft,
              seller: ownerName,
              sellerId: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
          );
          setLocalItems((list) => [{ ...draft, id: docRef.id, seller: ownerName, sellerId: user.uid }, ...list]);
          flash("Product listed");
          return;
        } catch (e) {
          console.warn("Could not save listing in Firestore:", e);
        }
      }
      const newItem: Listing = {
        ...draft,
        id: newId,
        seller: ownerName,
        sellerId: ownerId,
      };
      setLocalItems((list) => [newItem, ...list]);
      flash("Product listed");
    }
  };

  const deleteProduct = async (id: string) => {
    if (db && user) {
      try {
        await deleteDoc(doc(db, "listings", id));
      } catch (e) {
        console.warn("Could not delete listing from Firestore:", e);
      }
    }
    setRemoved((list) => [...list, id]);
    setLocalItems((list) => list.filter((i) => i.id !== id));
    flash("Listing removed");
  };

  const toggleSoldOut = async (id: string) => {
    const item = items.find((i) => i.id === id);
    const nextSoldOut = !item?.soldOut;
    if (db && user) {
      try {
        await updateDoc(doc(db, "listings", id), { soldOut: nextSoldOut, updatedAt: serverTimestamp() });
      } catch (e) {
        console.warn("Could not toggle sold out in Firestore:", e);
      }
    }
    setEdits((current) => ({
      ...current,
      [id]: { ...(current[id] || {}), soldOut: nextSoldOut },
    }));
    flash(nextSoldOut ? "Item marked as sold out" : "Item relisted");
  };

  const saveEvent = (data: Omit<CampusEvent, "id">, id?: string): string => {
    if (id) {
      if (db && user) {
        updateDoc(doc(db, "events", id), clean({ ...data, updatedAt: serverTimestamp() })).catch(console.warn);
      }
      setEvents((list) => list.map((e) => (e.id === id ? { ...e, ...data } : e)));
      flash("Event updated");
      return id;
    }
    const newId = `evt-${Date.now()}`;
    if (db && user) {
      setDoc(
        doc(db, "events", newId),
        clean({
          ...data,
          id: newId,
          organizerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      ).catch(console.warn);
    }
    setEvents((list) => [{ ...data, id: newId }, ...list]);
    flash("Event created");
    return newId;
  };

  const deleteEvent = async (id: string) => {
    if (db && user) {
      try {
        await deleteDoc(doc(db, "events", id));
      } catch (e) {
        console.warn("Could not delete event from Firestore:", e);
      }
    }
    setEvents((list) => list.filter((e) => e.id !== id));
    flash("Event deleted");
  };

  const saveOffer = async (offer: Omit<Offer, "id">) => {
    const newId = `off-${Date.now()}`;
    if (db && user) {
      try {
        await setDoc(doc(db, "offers", newId), clean({ ...offer, id: newId, createdAt: serverTimestamp() }));
      } catch (e) {
        console.warn("Could not save offer in Firestore:", e);
      }
    }
    setOffers((list) => [{ ...offer, id: newId }, ...list]);
    flash("Offer created");
  };

  const setOrderStatus = async (id: string, status: OrderStatus) => {
    if (db && user) {
      try {
        await updateDoc(doc(db, "orders", id), { status, updatedAt: serverTimestamp() });
      } catch (e) {
        console.warn("Could not update order status in Firestore:", e);
      }
    }
    setSellerOrders((list) => {
      const next = list.map((o) => (o.id === id ? { ...o, status } : o));
      setStoredSellerOrders(next);
      return next;
    });
    setOrders((list) => {
      const next = list.map((o) => (o.id === id ? { ...o, status } : o));
      setStoredOrders(next);
      return next;
    });
    flash(`Order status: ${status}`);
  };

  if (authLoading && !user) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (!onboarded && !user) {
    return (
      <OnboardingPage
        onDone={() => {
          setOnboarded(true);
          setAuthOpen(true);
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
          ownerName={ownerName}
          campus="North Campus"
          products={myProducts}
          events={events}
          eventProducts={eventProducts}
          offers={offers}
          orders={sellerOrders}
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
              onSend={sendMessage}
              onBack={() => setSubPage(null)}
              currentUserId={user?.uid}
              isSeller={mode === "seller"}
            />
          )}
          {tab === "Messages" && !(subPage === "chat" && activeChat) && (
            <MessagesPage
              conversations={conversations}
              currentUserId={user?.uid}
              isSeller={mode === "seller"}
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
              onSaveForLater={(itemId, key) => {
                if (!savedIds.includes(itemId)) {
                  toggleSaved(itemId);
                }
                removeLine(key);
                flash("Moved to Saved items");
              }}
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
