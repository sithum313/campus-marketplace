import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { DesignGrid } from "../components/DesignPicker";
import { Button, Chip, Field, Label, ScreenHeader, page } from "../components/ui";
import { categories } from "../data";
import { capColors, designLibrary, shirtColors, shirtSizes } from "../designs";
import { colors, listPriceOf, money } from "../theme";
import { CampusEvent, Listing, ProductKind, Swatch } from "../types";

/** Everything a seller fills in; the app adds id, seller and sellerId when saving. */
export type ProductDraft = Omit<Listing, "id" | "seller" | "sellerId">;

const PALETTE: Swatch[] = [
  ...shirtColors,
  { name: "Green", hex: "#2E9E6B" },
  { name: "Grey", hex: "#9AA0AA" },
];
const CONDITIONS = ["New", "Like new", "Good condition", "Used"];
const KINDS: { kind: ProductKind; label: string; icon: string }[] = [
  { kind: "ticket", label: "Ticket", icon: "ticket-outline" },
  { kind: "tshirt", label: "T-shirt", icon: "mci:tshirt-crew-outline" },
  { kind: "cap", label: "Cap", icon: "mci:hat-fedora" },
  { kind: "bookmark", label: "Bookmark", icon: "bookmark-outline" },
];
export const kindLabel = (k?: ProductKind) => KINDS.find((x) => x.kind === k)?.label.toLowerCase() || "item";
const kindIcon = (k?: ProductKind) => KINDS.find((x) => x.kind === k)?.icon;
const CATEGORIES = categories.filter((c) => c !== "All items" && c !== "Event merch");
const num = (v: string) => (v === "" || isNaN(Number(v)) ? 0 : Number(v));
const digits = (v: string) => v.replace(/[^0-9.]/g, "");

export function ProductForm({
  initial,
  event,
  kind: kindProp,
  campusDefault,
  onSubmit,
  onCancel,
}: {
  initial?: Listing;
  event?: CampusEvent;
  kind?: ProductKind;
  campusDefault: string;
  onSubmit: (draft: ProductDraft) => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<ProductKind>(initial?.kind || kindProp || "ticket");
  const [title, setTitle] = useState(initial?.title || (event ? `${event.title} ${kindLabel(kindProp || "ticket")}` : ""));
  const [description, setDescription] = useState(initial?.description === "Listed by a student on campus." ? "" : initial?.description || "");
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [condition, setCondition] = useState(initial?.condition || "New");
  const [listPrice, setListPrice] = useState(initial ? String(listPriceOf(initial)) : "");
  const [discount, setDiscount] = useState(initial?.discountPercent ? String(initial.discountPercent) : "");
  const [stock, setStock] = useState(initial?.stock !== undefined ? String(initial.stock) : "");
  const [place, setPlace] = useState(initial?.campus || campusDefault);
  const [image, setImage] = useState(initial?.image || "");
  const [hasColors, setHasColors] = useState(!!initial?.colors?.length || kindProp === "tshirt" || kindProp === "cap");
  const [pickedColors, setPickedColors] = useState<string[]>(
    initial?.colors?.map((c) => c.name) || (kindProp === "tshirt" ? shirtColors.map((c) => c.name) : kindProp === "cap" ? capColors.map((c) => c.name) : []),
  );
  const [hasSizes, setHasSizes] = useState(!!initial?.sizes?.length || kindProp === "tshirt");
  const [pickedSizes, setPickedSizes] = useState<string[]>(initial?.sizes || (kindProp === "tshirt" ? shirtSizes : []));
  const [designs, setDesigns] = useState<string[]>(
    initial?.designs || (kindProp === "tshirt" ? ["crew", "laugh", "sunset"] : kindProp === "bookmark" ? ["peace", "joy", "sunset", "waves"] : []),
  );

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const d = Math.max(0, Math.min(90, num(discount)));
  const base = num(listPrice);
  const final = Math.round(base * (1 - d / 100) * 100) / 100;
  const wantsDesigns = !!event && (kind === "tshirt" || kind === "bookmark");
  const valid = title.trim().length > 1 && Number.isFinite(base) && base > 0 && (stock === "" || (Number.isInteger(num(stock)) && num(stock) >= 0)) && num(discount) <= 90 && (!wantsDesigns || designs.length > 0);

  const submit = () => {
    if (!valid) return;
    const swatches = hasColors ? PALETTE.filter((c) => pickedColors.includes(c.name)) : [];
    onSubmit({
      title: title.trim(),
      description: description.trim() || (event ? `${kindLabel(kind)} for ${event.title}.` : "Listed by a student on campus."),
      category: event ? "Event merch" : category,
      condition: event && kind === "ticket" ? "Entry ticket" : condition,
      price: final,
      listPrice: d > 0 ? base : undefined,
      discountPercent: d > 0 ? d : undefined,
      stock: stock === "" ? undefined : Math.floor(num(stock)),
      sold: initial?.sold ?? 0,
      soldOut: stock !== "" && num(stock) === 0 ? true : initial?.soldOut && num(stock) > 0 ? false : initial?.soldOut,
      campus: event ? "Event organizers" : place.trim() || campusDefault,
      image: image.trim() || undefined,
      icon: kindIcon(event ? kind : undefined) || initial?.icon,
      eventId: event?.id,
      kind: event ? kind : "general",
      colors: swatches.length ? swatches : undefined,
      sizes: hasSizes && pickedSizes.length ? shirtSizes.filter((s) => pickedSizes.includes(s)) : undefined,
      designs: wantsDesigns ? designs : undefined,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title={initial ? "Edit product" : event ? `Add to ${event.title}` : "Sell a product"}
        onBack={onCancel}
      />

      {event && !kindProp && !initial ? (
        <>
          <Label>Product type</Label>
          <View style={styles.wrap}>
            {KINDS.map((k) => (
              <Chip key={k.kind} icon={k.icon} label={k.label} active={kind === k.kind} onPress={() => {
                setKind(k.kind);
                setHasColors(k.kind === "tshirt" || k.kind === "cap");
                setHasSizes(k.kind === "tshirt");
                if (k.kind === "tshirt") { setPickedColors(shirtColors.map((c) => c.name)); setPickedSizes(shirtSizes); }
                if (k.kind === "cap") setPickedColors(capColors.map((c) => c.name));
              }} />
            ))}
          </View>
        </>
      ) : null}

      <Label hint="Paste a link to a photo. Leave empty to show an icon.">Photo</Label>
      <View style={styles.photoRow}>
        <View style={styles.photo}>
          {image.trim() ? <Image source={{ uri: image.trim() }} style={{ width: "100%", height: "100%" }} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Field placeholder="https://…" autoCapitalize="none" value={image} onChangeText={setImage} />
        </View>
      </View>

      <Label>Product name</Label>
      <Field placeholder="e.g. Organic Chemistry textbook" value={title} onChangeText={setTitle} />

      <Label>Description</Label>
      <Field multiline placeholder="Condition, edition, what's included, why you're selling…" value={description} onChangeText={setDescription} />

      {!event ? (
        <>
          <Label>Category</Label>
          <View style={styles.wrap}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>
          <Label>Condition</Label>
          <View style={styles.wrap}>
            {CONDITIONS.map((c) => (
              <Chip key={c} label={c} active={condition === c} onPress={() => setCondition(c)} />
            ))}
          </View>
        </>
      ) : null}

      <Label hint="Set the full price, then add a discount if you want one">Pricing</Label>
      <View style={styles.row}>
        <View style={{ flex: 1.3 }}>
          <Field prefix="$" placeholder="Price" keyboardType="numeric" value={listPrice} onChangeText={(v) => setListPrice(digits(v))} />
        </View>
        <View style={{ flex: 1 }}>
          <Field placeholder="Discount" keyboardType="numeric" value={discount} onChangeText={(v) => setDiscount(digits(v))} />
        </View>
        <Text style={styles.pct}>%</Text>
      </View>
      {base > 0 ? (
        <Text style={styles.preview}>
          Buyers pay <Text style={{ fontWeight: "900" }}>{money(final)}</Text>
          {d > 0 ? ` (${d}% off ${money(base)})` : ""}
        </Text>
      ) : null}

      <Label hint="Leave empty for unlimited. Set 0 to mark sold out.">Quantity in stock</Label>
      <Field placeholder="e.g. 50" keyboardType="numeric" value={stock} onChangeText={(v) => setStock(digits(v).split(".")[0])} />

      {!event ? (
        <>
          <Label hint="Where buyers can pick it up">Meetup spot / campus</Label>
          <Field placeholder="North Campus" value={place} onChangeText={setPlace} />
        </>
      ) : null}

      <Label>Options for buyers</Label>
      <View style={styles.wrap}>
        <Chip icon="color-palette-outline" label="Colours" active={hasColors} onPress={() => setHasColors(!hasColors)} />
        <Chip icon="resize-outline" label="Sizes" active={hasSizes} onPress={() => setHasSizes(!hasSizes)} />
      </View>
      {hasColors ? (
        <View style={{ marginTop: 14 }}>
          <SwatchMulti picked={pickedColors} onToggle={(n) => toggle(pickedColors, setPickedColors, n)} />
        </View>
      ) : null}
      {hasSizes ? (
        <View style={[styles.wrap, { marginTop: 14 }]}>
          {shirtSizes.map((s) => (
            <Chip key={s} label={s} active={pickedSizes.includes(s)} onPress={() => toggle(pickedSizes, setPickedSizes, s)} />
          ))}
        </View>
      ) : null}

      {wantsDesigns ? (
        <>
          <Label hint={`${designs.length} selected · buyers pick one when ordering`}>
            {kind === "bookmark" ? "Bookmark designs" : "T-shirt print designs"}
          </Label>
          <DesignGrid options={designLibrary.map((x) => x.id)} selected={designs} onToggle={(id) => toggle(designs, setDesigns, id)} columns={4} />
        </>
      ) : null}

      <View style={styles.footer}>
        <Button kind="outline" label="Cancel" onPress={onCancel} style={{ flex: 1 }} />
        <Button label={initial ? "Save changes" : "Publish"} disabled={!valid} onPress={submit} style={{ flex: 1.5 }} />
      </View>
    </ScrollView>
  );
}

/** Multi-select colour dots. */
function SwatchMulti({ picked, onToggle }: { picked: string[]; onToggle: (name: string) => void }) {
  return (
    <View style={styles.wrap}>
      {PALETTE.map((sw) => (
        <Chip key={sw.name} label={sw.name} active={picked.includes(sw.name)} onPress={() => onToggle(sw.name)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: page,
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  pct: { color: colors.muted, fontWeight: "800" },
  preview: { color: colors.green, fontSize: 13, marginTop: 8 },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  photo: { width: 64, height: 64, borderRadius: 14, backgroundColor: colors.blue, overflow: "hidden" },
  footer: { flexDirection: "row", gap: 10, marginTop: 30 },
});
