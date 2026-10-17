import { useState } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../components/AppIcon";
import { OfferBanner } from "../components/OfferBanner";
import { ProductImage } from "../components/ProductImage";
import { Button, Chip, Field, Label, ScreenHeader, page } from "../components/ui";
import { coverKeys, eventCovers } from "../designs";
import { colors, money } from "../theme";
import { CampusEvent, Listing, Offer, OfferKind, ProductKind } from "../types";
import { kindLabel } from "./ProductForm";
import React from "react";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const TINTS = [colors.yellow, colors.teal, colors.pink, colors.blue];

function parseDate(text: string) {
  const m = text.trim().match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\.?\s*(\d{4})?$/);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[2].toUpperCase());
  const day = Number(m[1]);
  if (mi < 0 || day < 1 || day > 31) return null;
  const mon = MONTHS[mi];
  return {
    month: mon,
    day: String(day).padStart(2, "0"),
    date: `${day} ${mon[0]}${mon.slice(1).toLowerCase()} ${m[3] || new Date().getFullYear()}`,
  };
}

const stats = (products: Listing[]) => ({
  tickets: products.filter((p) => p.kind === "ticket").reduce((s, p) => s + (p.sold || 0), 0),
  revenue: Math.round(products.reduce((s, p) => s + (p.sold || 0) * p.price, 0) * 100) / 100,
});

/* ---------- list of events ---------- */

export function SellerEvents({
  events,
  eventProducts,
  offers,
  onCreate,
  onOpen,
}: {
  events: CampusEvent[];
  eventProducts: Listing[];
  offers: Offer[];
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Event space</Text>
      <Text style={styles.sub}>Sell tickets and merch, and publish offers for your events</Text>
      <Button icon="add-circle-outline" label="Create an event" onPress={onCreate} style={{ marginTop: 18 }} />
      <View style={{ gap: 14, marginTop: 18 }}>
        {events.map((event) => {
          const products = eventProducts.filter((p) => p.eventId === event.id);
          const s = stats(products);
          const cover = event.cover ? eventCovers[event.cover] : undefined;
          return (
            <Pressable key={event.id} style={styles.card} onPress={() => onOpen(event.id)}>
              {cover ? (
                <ImageBackground source={cover} style={styles.banner}>
                  <View style={styles.shade} />
                  <Text style={styles.bannerTitle}>{event.title}</Text>
                  <Text style={styles.bannerMeta}>
                    {event.date} · {event.venue}
                  </Text>
                </ImageBackground>
              ) : (
                <View style={[styles.banner, { backgroundColor: event.color }]}>
                  <Text style={[styles.bannerTitle, { color: colors.ink }]}>{event.title}</Text>
                  <Text style={[styles.bannerMeta, { color: colors.ink }]}>
                    {event.date} · {event.venue}
                  </Text>
                </View>
              )}
              <View style={styles.statRow}>
                <Stat label="Products" value={String(products.length)} />
                <Stat label="Tickets sold" value={String(s.tickets)} />
                <Stat label="Sales" value={money(s.revenue)} />
                <Stat label="Offers" value={String(offers.filter((o) => o.eventId === event.id).length)} />
              </View>
            </Pressable>
          );
        })}
        {events.length === 0 ? <Text style={styles.empty}>No events yet. Create your first one.</Text> : null}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ---------- create / edit event ---------- */

export function EventForm({
  initial,
  organizerDefault,
  onSubmit,
  onCancel,
}: {
  initial?: CampusEvent;
  organizerDefault: string;
  onSubmit: (event: Omit<CampusEvent, "id">) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date || "");
  const [venue, setVenue] = useState(initial?.venue || "");
  const [organizer, setOrganizer] = useState(initial?.organizer || organizerDefault);
  const [description, setDescription] = useState(initial?.description || "");
  const [cover, setCover] = useState<string | undefined>(initial?.cover);
  const parsed = parseDate(date);
  const valid = title.trim().length > 1 && !!parsed && venue.trim().length > 1;
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader title={initial ? "Edit event" : "Create event"} onBack={onCancel} />
      <Label>Cover photo</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {coverKeys.map((key) => (
          <Pressable key={key} onPress={() => setCover(key)}>
            <ImageBackground
              source={eventCovers[key]}
              style={[styles.coverThumb, cover === key && styles.coverOn]}
              imageStyle={{ borderRadius: 12 }}
            >
              {cover === key ? (
                <View style={styles.coverCheck}>
                  <AppIcon name="checkmark" size={14} color="#FFF" />
                </View>
              ) : null}
            </ImageBackground>
          </Pressable>
        ))}
        <Pressable onPress={() => setCover(undefined)} style={[styles.coverThumb, styles.coverNone, !cover && styles.coverOn]}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>No photo</Text>
        </Pressable>
      </ScrollView>
      <Label>Event name</Label>
      <Field placeholder="e.g. Poetry Open Mic" value={title} onChangeText={setTitle} />
      <Label hint={date && !parsed ? "Use a format like 8 Nov 2026" : "Format: 8 Nov 2026"}>Date</Label>
      <Field placeholder="8 Nov 2026" value={date} onChangeText={setDate} />
      <Label>Venue</Label>
      <Field placeholder="Main Auditorium" value={venue} onChangeText={setVenue} />
      <Label>Organizer</Label>
      <Field placeholder="Your club or society" value={organizer} onChangeText={setOrganizer} />
      <Label>About the event</Label>
      <Field multiline placeholder="What should students expect?" value={description} onChangeText={setDescription} />
      <View style={styles.footer}>
        <Button kind="outline" label="Cancel" onPress={onCancel} style={{ flex: 1 }} />
        <Button
          label={initial ? "Save changes" : "Create event"}
          disabled={!valid}
          style={{ flex: 1.5 }}
          onPress={() =>
            parsed &&
            onSubmit({
              title: title.trim(),
              date: parsed.date,
              month: parsed.month,
              day: parsed.day,
              venue: venue.trim(),
              organizer: organizer.trim() || organizerDefault,
              description: description.trim() || undefined,
              cover,
              color: initial?.color || TINTS[Math.floor(Math.random() * TINTS.length)],
            })
          }
        />
      </View>
    </ScrollView>
  );
}

/* ---------- manage one event ---------- */

const KIND_OPTIONS: { key: ProductKind | "all"; label: string }[] = [
  { key: "ticket", label: "Tickets" },
  { key: "tshirt", label: "T-shirts" },
  { key: "cap", label: "Caps" },
  { key: "bookmark", label: "Bookmarks" },
  { key: "all", label: "Everything" },
];
const OFFER_KINDS: { key: OfferKind; label: string; icon: string }[] = [
  { key: "percent", label: "% off", icon: "pricetag-outline" },
  { key: "bogo", label: "Buy 1 get 1 free", icon: "gift-outline" },
  { key: "bundle", label: "Free gift", icon: "sparkles-outline" },
  { key: "info", label: "Notice", icon: "megaphone-outline" },
];
const plural = (k: ProductKind | "all") => (k === "all" ? "everything" : `${kindLabel(k)}s`);

export function EventManager({
  event,
  products,
  offers,
  onBack,
  onEdit,
  onDelete,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onSaveOffer,
  onDeleteOffer,
}: {
  event: CampusEvent;
  products: Listing[];
  offers: Offer[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddProduct: (kind: ProductKind) => void;
  onEditProduct: (item: Listing) => void;
  onDeleteProduct: (id: string) => void;
  onSaveOffer: (offer: Omit<Offer, "id">) => void;
  onDeleteOffer: (id: string) => void;
}) {
  const [offerOpen, setOfferOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const s = stats(products);
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={{ height: 30 }} />
      <ScreenHeader
        title={event.title}
        onBack={onBack}
        right={
          <Pressable style={styles.editBtn} onPress={onEdit}>
            <AppIcon name="create-outline" size={18} />
          </Pressable>
        }
      />
      <Text style={styles.sub}>
        {event.date} · {event.venue}
      </Text>

      <View style={[styles.statRow, styles.statCard]}>
        <Stat label="Tickets sold" value={String(s.tickets)} />
        <Stat label="Sales" value={money(s.revenue)} />
        <Stat label="Products" value={String(products.length)} />
      </View>

      <Text style={styles.section}>Tickets & merch</Text>
      <View style={{ gap: 10 }}>
        {products.map((p) => (
          <View key={p.id} style={styles.prod}>
            <View style={styles.thumb}>
              <ProductImage item={p} iconSize={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.prodName} numberOfLines={1}>
                {p.title}
              </Text>
              <Text style={styles.sub}>
                {money(p.price)} · {p.sold || 0} sold{p.stock !== undefined ? ` · ${p.stock} in stock` : ""}
                {p.designs?.length ? ` · ${p.designs.length} designs` : ""}
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={() => onEditProduct(p)} style={styles.iconBtn}>
              <AppIcon name="create-outline" size={18} />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => onDeleteProduct(p.id)} style={styles.iconBtn}>
              <AppIcon name="trash-outline" size={18} color={colors.red} />
            </Pressable>
          </View>
        ))}
        {products.length === 0 ? <Text style={styles.empty}>Nothing on sale yet.</Text> : null}
      </View>
      <Label>Add to this event</Label>
      <View style={styles.wrap}>
        {(["ticket", "tshirt", "cap", "bookmark"] as ProductKind[]).map((k) => (
          <Chip key={k} icon="add" label={k === "tshirt" ? "T-shirt" : kindLabel(k)[0].toUpperCase() + kindLabel(k).slice(1)} onPress={() => onAddProduct(k)} />
        ))}
      </View>

      <Text style={styles.section}>Offers & notices</Text>
      <View style={{ gap: 10 }}>
        {offers.map((o) => (
          <View key={o.id}>
            <OfferBanner offer={o} />
            <Pressable style={styles.remove} onPress={() => onDeleteOffer(o.id)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ))}
        {offers.length === 0 ? <Text style={styles.empty}>No offers yet. Add a discount or a notice for buyers.</Text> : null}
      </View>
      {offerOpen ? (
        <OfferForm
          onCancel={() => setOfferOpen(false)}
          onSubmit={(offer) => {
            onSaveOffer({ ...offer, eventId: event.id });
            setOfferOpen(false);
          }}
        />
      ) : (
        <Button kind="soft" icon="megaphone-outline" label="New offer or notice" onPress={() => setOfferOpen(true)} style={{ marginTop: 12 }} />
      )}

      <Button
        kind="outline"
        label={confirm ? "Tap again to delete event" : "Delete event"}
        onPress={() => (confirm ? onDelete() : setConfirm(true))}
        style={{ marginTop: 32, borderColor: colors.red }}
      />
    </ScrollView>
  );
}

function OfferForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (offer: Omit<Offer, "id" | "eventId">) => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<OfferKind>("percent");
  const [target, setTarget] = useState<ProductKind | "all">("tshirt");
  const [gives, setGives] = useState<ProductKind>("bookmark");
  const [percent, setPercent] = useState("20");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [until, setUntil] = useState("");
  const pct = Math.min(90, Number(percent) || 0);
  const auto =
    kind === "percent"
      ? `${plural(target)[0].toUpperCase()}${plural(target).slice(1)}: ${pct}% off`
      : kind === "bogo"
        ? `Buy 1 ${target === "all" ? "item" : kindLabel(target)}, get 1 free`
        : kind === "bundle"
          ? `Free ${kindLabel(gives)} with every ${kindLabel(target === "all" ? "ticket" : target)}`
          : "";
  const valid = kind === "info" ? title.trim().length > 1 : kind !== "percent" || pct > 0;
  const bundleTarget = target === "all" ? "ticket" : target;
  return (
    <View style={styles.form}>
      <Label>Type</Label>
      <View style={styles.wrap}>
        {OFFER_KINDS.map((k) => (
          <Chip key={k.key} icon={k.icon} label={k.label} active={kind === k.key} onPress={() => setKind(k.key)} />
        ))}
      </View>
      {kind !== "info" ? (
        <>
          <Label>{kind === "bundle" ? "When a buyer gets" : "Applies to"}</Label>
          <View style={styles.wrap}>
            {KIND_OPTIONS.filter((o) => kind !== "bundle" || o.key !== "all").map((o) => (
              <Chip key={o.key} label={o.label} active={(kind === "bundle" ? bundleTarget : target) === o.key} onPress={() => setTarget(o.key)} />
            ))}
          </View>
        </>
      ) : null}
      {kind === "bundle" ? (
        <>
          <Label>They get this free</Label>
          <View style={styles.wrap}>
            {KIND_OPTIONS.filter((o) => o.key !== "all" && o.key !== bundleTarget).map((o) => (
              <Chip key={o.key} label={o.label} active={gives === o.key} onPress={() => setGives(o.key as ProductKind)} />
            ))}
          </View>
        </>
      ) : null}
      {kind === "percent" ? (
        <>
          <Label>Discount</Label>
          <Field placeholder="20" keyboardType="numeric" value={percent} onChangeText={(v) => setPercent(v.replace(/\D/g, ""))} />
        </>
      ) : null}
      <Label hint={kind === "info" ? undefined : "Leave empty to use the suggested title"}>Headline</Label>
      <Field placeholder={auto || "e.g. Gates open at 5 PM"} value={title} onChangeText={setTitle} />
      <Label>Details (optional)</Label>
      <Field multiline placeholder="Anything buyers should know" value={detail} onChangeText={setDetail} />
      <Label>Valid until (optional)</Label>
      <Field placeholder="e.g. Until 20 Nov" value={until} onChangeText={setUntil} />
      <View style={styles.footer}>
        <Button kind="outline" label="Cancel" onPress={onCancel} style={{ flex: 1 }} />
        <Button
          label="Publish"
          disabled={!valid}
          style={{ flex: 1.5 }}
          onPress={() => {
            const needsTarget = kind === "percent" || kind === "bogo" || kind === "bundle";
            onSubmit({
              kind,
              target: needsTarget ? (kind === "bundle" ? bundleTarget : target) : undefined,
              percent: kind === "percent" ? pct : undefined,
              gives: kind === "bundle" ? gives : undefined,
              title: title.trim() || auto,
              detail: detail.trim() || undefined,
              until: until.trim() || undefined,
            });
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: page,
  title: { color: colors.ink, fontSize: 28, fontWeight: "800" },
  sub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  empty: { color: colors.muted, fontSize: 13, textAlign: "center", padding: 14 },
  card: { backgroundColor: "#FFF", borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  banner: { height: 130, padding: 14, justifyContent: "flex-end" },
  shade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(30,34,48,0.4)" },
  bannerTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  bannerMeta: { color: "#FFF", opacity: 0.9, fontSize: 12, marginTop: 2 },
  statRow: { flexDirection: "row", paddingVertical: 12 },
  statCard: { backgroundColor: "#FFF", borderRadius: 18, borderWidth: 1, borderColor: colors.line, marginTop: 14 },
  statValue: { color: colors.ink, fontWeight: "900", fontSize: 16 },
  statLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  section: { color: colors.ink, fontSize: 18, fontWeight: "800", marginTop: 26, marginBottom: 12 },
  prod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  thumb: { width: 48, height: 48, borderRadius: 12, overflow: "hidden" },
  prodName: { color: colors.ink, fontWeight: "800", fontSize: 13 },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  editBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFF", borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  remove: { alignSelf: "flex-end", paddingVertical: 6 },
  removeText: { color: colors.red, fontSize: 12, fontWeight: "800" },
  form: { backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginTop: 12, borderWidth: 1, borderColor: colors.line },
  footer: { flexDirection: "row", gap: 10, marginTop: 24 },
  coverThumb: { width: 110, height: 74, borderRadius: 12, borderWidth: 2, borderColor: "transparent", justifyContent: "flex-end", alignItems: "flex-end", padding: 6 },
  coverOn: { borderColor: colors.ink },
  coverNone: { backgroundColor: "#E9EDF3", alignItems: "center", justifyContent: "center" },
  coverCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
