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
2. Enable **Email/Password** and **Google** under Authentication > Sign-in method. Add `localhost` and your deployed domain to Authentication > Settings > Authorized domains as needed.
3. Create a Cloud Firestore database.
4. Copy the Web app configuration into `.env` using `.env.example`.
5. Deploy `firestore.rules` with the Firebase CLI or paste them into the Firestore Rules tab.

The app uses Cloud Firestore collections:

- `listings`: public reads, authenticated seller-owned creates and edits.
- `users/{uid}` and `users/{uid}/saved/{listingId}`: owner-only access for profiles and favorites.
- `conversations` and subcollection `messages`: multi-user real-time chat between buyers and sellers with member-only security rules.
- `orders`: real-time order placement, status tracking (Placed, Ready for pickup, Completed, Cancelled) for both buyers and sellers.
- `events` & `offers`: campus events and promotional deals created and managed by student organizers.

The client Firebase configuration is intentionally public. Access control belongs in Authentication, Firestore Rules, and App Check; never put Admin SDK credentials in this app.

## Current product flows

**Buyer mode**
- Search with filters: min/max price, category, condition, campus, discounted-only and sorting.
- Product sheet: short description, heart (save), chat with seller, add to cart.
- Event merch: colour, size and design pickers (all bookmark / t-shirt designs shown as a grid).
- Event offers and notices (percent off, buy-one-get-one, free gift, plain notices) applied in the cart.
- Campus cart & handover checkout: campus meetup spot selector (Library Lobby, Union Hall, Sci Quad, Rec Center), preferred handover time window selector, buyer handover note, student promo vouchers (e.g. CAMPUS10, SAVE5, STUDYGEAR), Save for Later wishlist action, multi-seller notifications, and interactive order review & safety confirmation modal.
- Profile: cart shortcut, ongoing orders, past orders with designated campus meetup spot, time window, handover note, applied vouchers, and saved items.
- Real-time messages with sellers with auto-scrolling, quick suggestions, and instant Firestore delivery.

**Seller mode** (switch in the top-right corner)
- Dashboard: live metrics (products live, new orders, inquiries, revenue) and shortcuts.
- Product management: add / edit / toggle sold out / delete with Firestore persistence.
- Event organizer space: create campus events, sell tickets / t-shirts / caps / bookmarks, and publish promotional offers.
- Customer inquiries & messages: dedicated Messages inbox tab for sellers to receive and respond to buyer inquiries in real-time.
- Orders management: track and advance fulfillment statuses in real-time.

Email/password sign-up and sign-in use Firebase Authentication with persistent session storage across webpage reloads. Listing updates, orders, chats, events, and offers are all connected to Cloud Firestore.

## Verification checklist

- Test both buyer and seller modes, stock limits, filters, checkout, editing and deletion.
- Verify that reload retains user authentication without prompting sign-in or repeating onboarding.
- Test buyer-seller messaging: open an item as a buyer, send a message, switch to Seller mode (or log in with the seller account) and view/reply from the Seller Messages tab.

### Firebase verification checklist

1. Copy `.env.example` to `.env` and fill in the **Web app** Firebase config from your own Firebase project. Never use service account private keys here.
2. In Firebase Console enable Email/Password sign-in and create Firestore.
3. Deploy `firestore.rules` using Firebase CLI (`firebase deploy --only firestore:rules`) or paste rules in the Firebase console.
4. Run `npm install`, `npm run web`, and test signing up with a new email.
5. Sign out, sign in again, publish a product, refresh, and confirm it persists.
6. Save a product, refresh, and confirm it remains saved under the same account.
7. Test seller ownership using two separate accounts.
8. Complete the team's real names, contributions, GitHub history, and video demo.
