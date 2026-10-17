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

Email/password sign-up and sign-in use Firebase Authentication. Product listings and user favorites persist in Firestore when Firebase is configured. Orders, chats, events and offers are still in-memory demonstrations, not a complete multi-user backend.


## Verification and limitations

- This project contains seeded demonstration products and orders. These are examples, not actual marketplace transactions.
- Firebase listing changes require a configured Firebase project and deployed Firestore rules.
- Cart, order history, conversations, events and offers are currently held in application state and are reset on reload. The chat UI does not send messages to another user's device. Do not present these as real-time production services in the video.
- Google sign-in uses a browser popup/redirect. On mobile, use the email/password authentication form instead.
- Test both buyer and seller modes, stock limits, filters, checkout, editing and deletion before submitting.
- Add the group's actual member names and their genuine GitHub contributions to this README before submission.

## Important: submission readiness

This repository is **not fully backend-complete**. Do not describe chat, order placement, event creation or offers as real multi-device database features. To deliver those, implement Firestore document writes and listeners, appropriate security rules, and test with two separate authenticated accounts.

### Firebase verification checklist

1. Copy `.env.example` to `.env` and fill in the **Web app** Firebase config from your own Firebase project. Never use service account private keys here.
2. In Firebase Console enable Email/Password sign-in and create Firestore.
3. Deploy `firestore.rules` using Firebase CLI (`firebase deploy --only firestore:rules`) or paste rules in the Firebase console.
4. Run `npm install`, `npm run web`, and test signing up with a new email.
5. Sign out, sign in again, publish a product, refresh, and confirm it persists.
6. Save a product, refresh, and confirm it remains saved under the same account.
7. Test seller ownership using two separate accounts.
8. Complete the team's real names, contributions, GitHub history, and video demo.
