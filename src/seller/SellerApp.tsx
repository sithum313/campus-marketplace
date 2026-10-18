import { useState } from "react";
import { BottomTabs, sellerTabs } from "../components/BottomTabs";
import { CampusEvent, Listing, Offer, Order, OrderStatus, ProductKind, SellerTab } from "../types";
import { ProductDraft, ProductForm } from "./ProductForm";
import { SellerDashboard } from "./SellerDashboard";
import { EventForm, EventManager, SellerEvents } from "./SellerEvents";
import { SellerOrders } from "./SellerOrders";
import { SellerProducts } from "./SellerProducts";

type View =
  | { name: "home" }
  | { name: "product"; editing?: Listing }
  | { name: "eventForm"; editing?: CampusEvent }
  | { name: "event"; id: string }
  | { name: "eventProduct"; eventId: string; kind?: ProductKind; editing?: Listing };

export type SellerProps = {
  ownerName: string;
  campus: string;
  products: Listing[];
  events: CampusEvent[];
  eventProducts: Listing[];
  offers: Offer[];
  orders: Order[];
  onSaveProduct: (draft: ProductDraft, id?: string) => void;
  onDeleteProduct: (id: string) => void;
  onToggleSoldOut: (id: string) => void;
  onSaveEvent: (event: Omit<CampusEvent, "id">, id?: string) => string;
  onDeleteEvent: (id: string) => void;
  onSaveOffer: (offer: Omit<Offer, "id">) => void;
  onDeleteOffer: (id: string) => void;
  onOrderStatus: (id: string, status: OrderStatus) => void;
};

/** Everything a seller / event organizer sees. Rendered when the top-right switch is on "Seller". */
export function SellerApp(p: SellerProps) {
  const [tab, setTab] = useState<SellerTab>("Dashboard");
  const [view, setView] = useState<View>({ name: "home" });
  const home = () => setView({ name: "home" });
  const go = (next: SellerTab) => {
    setTab(next);
    home();
  };

  let body;
  let showTabs = true;

  if (view.name === "product") {
    showTabs = false;
    body = (
      <ProductForm
        initial={view.editing}
        campusDefault={p.campus}
        onCancel={home}
        onSubmit={(draft) => {
          p.onSaveProduct(draft, view.editing?.id);
          home();
        }}
      />
    );
  } else if (view.name === "eventForm") {
    showTabs = false;
    const editing = view.editing;
    body = (
      <EventForm
        initial={editing}
        organizerDefault={p.ownerName}
        onCancel={() => setView(editing ? { name: "event", id: editing.id } : { name: "home" })}
        onSubmit={(data) => {
          const id = p.onSaveEvent(data, editing?.id);
          setView({ name: "event", id });
        }}
      />
    );
  } else if (view.name === "eventProduct") {
    showTabs = false;
    const event = p.events.find((e) => e.id === view.eventId);
    const back = () => setView({ name: "event", id: view.eventId });
    body = event ? (
      <ProductForm
        initial={view.editing}
        event={event}
        kind={view.kind || view.editing?.kind}
        campusDefault={p.campus}
        onCancel={back}
        onSubmit={(draft) => {
          p.onSaveProduct(draft, view.editing?.id);
          back();
        }}
      />
    ) : null;
  } else if (view.name === "event") {
    const event = p.events.find((e) => e.id === view.id);
    body = event ? (
      <EventManager
        event={event}
        products={p.eventProducts.filter((x) => x.eventId === event.id)}
        offers={p.offers.filter((o) => o.eventId === event.id)}
        onBack={home}
        onEdit={() => setView({ name: "eventForm", editing: event })}
        onDelete={() => {
          p.onDeleteEvent(event.id);
          home();
        }}
        onAddProduct={(kind) => setView({ name: "eventProduct", eventId: event.id, kind })}
        onEditProduct={(item) => setView({ name: "eventProduct", eventId: event.id, editing: item })}
        onDeleteProduct={p.onDeleteProduct}
        onSaveOffer={p.onSaveOffer}
        onDeleteOffer={p.onDeleteOffer}
      />
    ) : null;
  } else if (tab === "Dashboard") {
    body = (
      <SellerDashboard
        name={p.ownerName}
        products={p.products}
        eventProducts={p.eventProducts}
        offers={p.offers}
        orders={p.orders}
        onAddProduct={() => {
          setTab("Products");
          setView({ name: "product" });
        }}
        onCreateEvent={() => {
          setTab("Events");
          setView({ name: "eventForm" });
        }}
        onOrders={() => go("Orders")}
      />
    );
  } else if (tab === "Products") {
    body = (
      <SellerProducts
        products={p.products}
        onAdd={() => setView({ name: "product" })}
        onEdit={(item) => setView({ name: "product", editing: item })}
        onToggleSoldOut={p.onToggleSoldOut}
        onDelete={p.onDeleteProduct}
      />
    );
  } else if (tab === "Events") {
    body = (
      <SellerEvents
        events={p.events}
        eventProducts={p.eventProducts}
        offers={p.offers}
        onCreate={() => setView({ name: "eventForm" })}
        onOpen={(id) => setView({ name: "event", id })}
      />
    );
  } else {
    body = <SellerOrders orders={p.orders} onStatus={p.onOrderStatus} />;
  }

  return (
    <>
      {body}
      {showTabs ? (
        <BottomTabs tabs={sellerTabs} current={tab} onChange={(key) => go(key as SellerTab)} />
      ) : null}
    </>
  );
}
