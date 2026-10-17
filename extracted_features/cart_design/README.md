# Campus Marketplace — Cart Design & Checkout Flow

**Feature Owner**: `imantha35` (`302586620+imantha35@users.noreply.github.com` / `imanthaashan99@gmail.com`)  
**Branch**: `feature/cart-design`  
**Target Module**: Cart & Peer Handover System

---

## 🚀 Overview

The **Cart Design** feature provides an end-to-end shopping cart and checkout architecture built specifically for university campus peer-to-peer exchanges. It eliminates delivery costs by facilitating direct campus meetups, provides transparent student discounts, and guarantees payment safety.

---

## 🎨 Key Design & Functional Highlights

### 1. Campus Handover & Meetup Spot Selector
- **Interactive Spot Picker**: Allows buyers to select verified campus locations:
  - 🏛️ **Main Library Lobby**: CCTV monitored, ground floor safe hub.
  - ☕ **Student Union Hall**: High foot-traffic cafeteria lounge.
  - 💻 **Science & Tech Quad**: Well-lit outdoor plaza between lecture halls.
  - 🏋️ **Campus Rec & Gym Center**: Staffed front desk turnstile lounge.
- Automatic safety tags (`CCTV Monitored · Safe Zone`, `Staffed Front Desk Area`) displayed on cards.

### 2. Upgraded Product Cart Cards
- **Seller Identity Tag**: Prominently highlights the seller's name with student faculty icon (`🎓 Sold by [Seller]`).
- **Campus Meetup Badge**: Displays `📍 Campus Meetup` on every line item.
- **Stock Indicators**: Shows dynamic alerts (`🔥 Only X left in stock` or `Available on Campus`).
- **Tactile Stepper Controls**: Rounded plus/minus stepper buttons with high-contrast active state and immediate recalculation.
- **Clear Price Breakdown**: Shows calculated line total (`$24.00`) and unit price (`$12.00 each`).

### 3. Student Promo Voucher System
- Dedicated promo voucher input field with real-time feedback.
- Pre-configured campus discount codes:
  - `CAMPUS10`: 10% off entire cart subtotal.
  - `SAVE5`: $5 discount on orders over $25.
  - `FRESHER`: $3 freshman welcome perk on orders over $10.
- Applied promo tag with immediate `✕ Remove` action and savings calculation.

### 4. Transparent Receipt & Cost Breakdown
- Detailed itemized receipt:
  - Subtotal (with total unit quantity counter).
  - Event Offers (promotional event savings highlighted in emerald green).
  - Student Voucher Discount (deductions from promo codes).
  - Campus Handover Fee (`FREE`).
  - Student Platform Fee (`$0.00`).
- Total Savings celebratory banner highlighting money saved.

### 5. Campus Safety Guarantee
- In-person inspection guarantee: Payment is held securely until the student inspects the product during peer handover.
- Zero hidden platform fees.

### 6. Refined OrderCard Receipt & Order Tracking
- Color-coded order status badges:
  - `Placed` (Soft Blue with clock icon)
  - `Ready for Handover` (Warm Amber with package icon)
  - `Handed Over` (Emerald Green with checkmark)
  - `Cancelled` (Soft Red with cross icon)
- Item line counts, date, seller/buyer party details, and itemized breakdown.

---

## 📂 File Architecture

| File | Purpose |
|------|---------|
| `CartPage.tsx` | Main shopping cart UI with itemized list, meetup selector, promo input, and checkout CTA |
| `OrderCard.tsx` | Reusable order summary card for Profile ongoing/completed order tracking |
| `cart.ts` | Pricing engine, promotional discounts, campus meetup hubs, and promo validation |

---

## 🛠️ Usage Example

```tsx
import { CartPage } from "./CartPage";

<CartPage
  lines={cartLines}
  items={catalogItems}
  offers={eventOffers}
  onQty={(key, qty) => updateCartQuantity(key, qty)}
  onRemove={(key) => removeFromCart(key)}
  onOpen={(item) => navigateToItem(item)}
  onBrowse={() => navigateToCatalog()}
  onCheckout={() => proceedToCheckout()}
/>
```
