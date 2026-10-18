# Campus Marketplace

Expo SDK 57 React Native app for buying and selling items within a campus community.

## Run locally

Expo SDK 57 requires Node 22.13 or newer.

```bash
cp .env.example .env
npm install
npm run web
```

The app runs in demo mode until Firebase values are added to `.env`.

## Firebase setup

1. Create a Firebase project and register a Web app.
2. Enable Google Authentication under Authentication > Sign-in method. Anonymous Authentication remains available for native fallback.
3. Create a Cloud Firestore database.
4. Copy the Web app configuration into `.env` using `.env.example`.
5. Deploy `firestore.rules` with the Firebase CLI or paste them into the Firestore Rules tab.

The app uses:

- `listings`: public reads, authenticated seller-owned creates and edits.
- `users/{uid}` and `users/{uid}/saved/{listingId}`: owner-only access.
- `conversations`: members-only access, with messages in a subcollection.

The client Firebase configuration is intentionally public. Access control belongs in Authentication, Firestore Rules, and App Check; never put Admin SDK credentials in this app.

## Current product flows

**Buyer mode**
- Search with filters: min/max price, category, condition, campus, discounted-only and sorting.
- Product sheet: short description, heart (save), chat with seller, add to cart.
- Event merch: colour, size and design pickers (all bookmark / t-shirt designs shown as a grid).
- Event offers and notices (percent off, buy-one-get-one, free gift, plain notices) applied in the cart.
- Profile: cart shortcut, ongoing orders, past orders and saved items.

**Seller mode** (switch in the top-right corner)
- Dashboard, product management (add / edit / sold out / delete), event organizer space and orders.
- Event organizers create events, sell tickets / t-shirts / caps / bookmarks and publish offers.

Orders, chats, events and offers are in-memory demo data for now. Product listings use Firestore when it is configured.
