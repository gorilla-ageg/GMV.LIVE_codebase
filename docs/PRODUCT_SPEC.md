# GMV.live — Product Architecture & Build Spec

## Product Overview
GMV.live is a two-sided marketplace connecting brands with live stream creators.
First target market: college students as creators, e-commerce brands as the paying side.

---

## User Roles

### Brand
- Posts products with budget, deliverables, and preferred stream date
- Browses creator profiles
- Initiates deals or responds to creator applications
- Sends offer, negotiates terms, signs contract
- Pays creator directly after contract (Venmo/PayPal/Zelle/CashApp/Wire)
- Ships product, enters tracking number
- Reviews and approves creator's stream analytics
- Pays platform fee (future)

### Creator
- Creates profile with niche, platforms, follower count, portfolio
- Sets payment method + handle (required, gated behind contract reveal)
- Browses brand products
- Applies to products or accepts brand invitations
- Negotiates deal terms, signs contract
- Confirms payment received
- Confirms product delivery
- Submits stream analytics (GMV, viewers, orders)

---

## Full Deal Lifecycle

```
[Brand] Posts Product
        ↓
[Either] Initiates Deal (brand messages creator OR creator applies)
        ↓
[Both] Chat in Deal Room (Stream Chat)
        ↓
[Brand] Sends Offer: rate, deliverables, live date, usage rights
        ↓
[Creator] Accepts OR Counter-offers
        ↓ (loop until agreement)
[Auto] Offer accepted → Contract generated (pdf-lib)
        ↓
[Both] E-sign contract (sequentially — brand first or creator first)
        ↓ (auto-advances when both signatures present)
[Brand] Sees creator payment info (revealed only now)
[Brand] Pays creator via their chosen method
[Brand] Clicks "Mark Payment Sent"
        ↓
[Creator] Confirms payment received
        ↓
[Brand] Ships product + enters tracking number + carrier
        ↓
[Creator] Confirms delivery
        ↓
[Creator] Goes live, then submits: GMV, viewers, orders, stream link
        ↓
[Brand] Reviews analytics, clicks Approve
        ↓
[Auto] Deal marked Complete
```

---

## Database Schema

### Existing Tables (do not modify)
- `profiles` — id, role, display_name, avatar_url, bio
- `user_roles` — user_id, role
- `creator_profiles` — user_id, niches, platforms, follower_count, avg_gmv, rating, portfolio_urls, past_collabs, location
- `brand_profiles` — user_id, company_name, website, industry, logo_url
- `products` — brand_id, title, description, images, category, budget_min, budget_max, target_platforms, preferred_date, commission_info, status
- `conversations` — brand_user_id, creator_user_id, product_id
- `messages` — conversation_id, sender_id, content, type
- `deals` — conversation_id, status, contract_url, terms
- `deal_offers` — deal_id, sender_id, rate, deliverables, live_date, usage_rights, status
- `deal_signatures` — deal_id, user_id, signed_at
- `escrow_payments` — deal_id, amount, status (repurposed as payment record)
- `shipments` — deal_id, tracking_number, carrier, status

### New Fields (add via new migrations only)

**creator_profiles additions:**
```sql
payment_method TEXT CHECK (payment_method IN ('Venmo','PayPal','Zelle','CashApp','Wire','Other'))
payment_handle TEXT
```

**deals additions:**
```sql
payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','sent','confirmed'))
payment_method_used TEXT
```

### RLS Rule for Payment Info
`creator_profiles.payment_handle` and `payment_method` are readable by:
1. The creator themselves (always)
2. A brand that has a deal with that creator at status `contract_signed` or later

---

## Page Map & Routes

### Public (no auth required)
| Route | Page | Description |
|---|---|---|
| `/` | ForCreators.tsx | Creator-facing landing page |
| `/for-brands` | Index.tsx | Brand-facing landing page |
| `/auth` | Auth.tsx | Login + signup |
| `/pricing` | Pricing.tsx | Pricing page |
| `/blog` | Blog.tsx | Blog |
| `/coming-soon` | ComingSoon.tsx | Placeholder |

### Onboarding (auth required, onboarding not complete)
| Route | Page | Description |
|---|---|---|
| `/onboarding/role` | OnboardingRole.tsx | Pick brand or creator |
| `/onboarding/brand` | OnboardingBrand.tsx | Brand profile setup |
| `/onboarding/creator` | OnboardingCreator.tsx | Creator profile + **payment setup** |

### App (auth + onboarding required)
| Route | Page | Description |
|---|---|---|
| `/dashboard` | BrandDashboard or CreatorDashboard | Role-aware home |
| `/my-products` | MyProducts.tsx | Brand: manage products |
| `/products/new` | NewProduct.tsx | Brand: post new product |
| `/products/:id` | ProductDetail.tsx | Product detail + apply |
| `/products/:id/edit` | EditProduct.tsx | Brand: edit product |
| `/creators/:id` | CreatorDetail.tsx | Creator public profile |
| `/deals` | DealInbox.tsx | All deals list |
| `/deals/:id` | DealRoom.tsx | Full deal room |
| `/messages` | Messages.tsx | Conversations list |
| `/messages/:id` | ConversationThread.tsx | Individual conversation |
| `/profile` | Profile.tsx | Own profile view |
| `/settings/profile` | Settings.tsx | Settings tabs |
| `/settings/payment` | Settings.tsx | Creator payment settings tab |

---

## Component Architecture

### AppLayout.tsx
```
AppLayout
  ├── Sidebar (desktop: 240px, tablet: 64px icons, mobile: hidden)
  │   ├── Logo
  │   ├── NavItems (role-aware)
  │   └── UserMenu (avatar, name, sign out)
  └── Main Content Area
      ├── Page Header (title + primary action button)
      └── Page Content
```

### DealRoom.tsx
```
DealRoom
  ├── DealHeader (both parties info, product, status badge)
  ├── DealStatusBar (step timeline, current step highlighted)
  └── Tabs
      ├── Chat (Stream Chat)
      ├── Contract (ContractView — sign + download)
      ├── Payment (PaymentStep — gated by contract_signed)
      ├── Shipment (ShipmentTracker)
      └── Analytics (AnalyticsTab)
```

### PaymentStep.tsx (new component)
```
PaymentStep
  ├── [if status < contract_signed] → locked state "Sign contract first"
  ├── [if brand, status = contract_signed] → SendPaymentCard
  │   ├── Amount, creator handle, method
  │   └── "Mark Payment Sent" button
  ├── [if creator, status = payment_sent] → ConfirmPaymentCard
  │   ├── "Brand says they sent $X via [method]"
  │   └── "Confirm Received" + "Message Brand" buttons
  └── [if status = confirmed] → PaymentConfirmedBadge
```

---

## Stream Chat Integration

### Setup
- Library: `stream-chat-react`
- Channel per deal: `messaging` type, ID = `deal-{dealId}`
- User token: generated server-side via Supabase Edge Function `stream-token`
- Users upserted to Stream on first token request

### Channel Members
- Added when deal is created: brand user + creator user
- Never add third parties

### Custom Message Types (keep existing)
- `offer` — renders OfferCard component
- `system` — renders SystemEventCard component
- `text` — default

### Theme
Override Stream Chat CSS to match dark theme (see CLAUDE.md for CSS variables)

---

## Contract PDF Spec

Generated by `pdf-lib` when both signatures present.

**Page layout:**
```
[GMV.live]                              [Date: Jan 1, 2025]
─────────────────────────────────────────────────────────
              LIVE STREAM COLLABORATION AGREEMENT
─────────────────────────────────────────────────────────

PARTIES
Brand:    [brand company name]
Creator:  [creator display name]

PRODUCT
Name:         [product title]
Description:  [product description]

DEAL TERMS
Rate:           $[agreed rate]
Deliverables:   [deliverables text]
Live Date:      [agreed date]
Usage Rights:   [usage rights]
Platform(s):    [target platforms]

SIGNATURES
Brand:    [display name] — Signed [timestamp]
Creator:  [display name] — Signed [timestamp]

─────────────────────────────────────────────────────────
Facilitated by GMV.live | support@gmv.live
Deal ID: [dealId]
```

Stored in Supabase Storage bucket `contracts` as `{dealId}.pdf`
URL saved to `deals.contract_url`

---

## Creator Payment Setup — Onboarding Step

### When it appears
- Step 3 of creator onboarding (after profile basics)
- Also available at Settings → Payment anytime

### Fields
| Field | Type | Required | Notes |
|---|---|---|---|
| Payment Method | Dropdown | Yes | Venmo, PayPal, Zelle, CashApp, Wire, Other |
| Handle / ID | Text | Yes | Placeholder changes per method |

### Handle placeholders by method
- Venmo → `@your-username`
- PayPal → `your@email.com`
- Zelle → `Phone number or email linked to Zelle`
- CashApp → `$your-cashtag`
- Wire → `Your bank name (we'll coordinate directly)`
- Other → `How should the brand send money?`

### Validation
- Both fields required before onboarding can complete
- Display a lock icon with: *"This is only shown to brands after your contract is signed"*
- In Settings, show masked handle: `@sar****` with Edit button

### Missing payment info warning
If a creator somehow has no payment info set, show a yellow banner in their dashboard:
`"Set up your payment method to start receiving deals →"`
Clicking it goes to Settings → Payment.

---

## Shipment Tracker Spec

### Brand side
- Enter: Carrier (dropdown: UPS, FedEx, USPS, DHL, Other) + Tracking Number
- Basic format validation per carrier
- "Copy Tracking Link" button → links to carrier tracking page
- Once entered, deal status auto-advances to `shipped`

### Creator side
- See carrier + tracking number
- "Track Package" button → opens carrier URL in new tab
- "Confirm Delivery" button → advances status to `delivered`

### Status timeline display
```
○ Pending → ● Shipped → ○ In Transit → ○ Delivered
```
Visual step indicator, current step highlighted in primary color

---

## Analytics Submission Spec

### Creator submits (after live stream)
- Total GMV generated ($)
- Peak concurrent viewers
- Total orders placed
- Stream duration (minutes)
- Stream link/recording URL (optional)
- Notes (optional)

### Brand reviews
- Sees submitted data
- Two options: Approve → deal moves to `completed` | Request revision → message creator

---

## Empty States

Every list needs one. Copy:

| Page | Empty State |
|---|---|
| Brand Dashboard (no products) | "Post your first product to start finding creators →" |
| Brand Dashboard (no deals) | "Your deals will appear here once creators respond" |
| Creator Dashboard (no deals) | "Browse brand products and apply for your first deal →" |
| Deal Inbox | "No active deals yet. Start by messaging a creator / browsing products" |
| My Products | "You haven't posted any products yet. Post your first one →" |
| Messages | "No conversations yet" |

---

## What NOT to Touch
- `src/pages/Index.tsx`
- `src/pages/ForCreators.tsx`
- `src/index.css`
- `tailwind.config.ts`
- Any existing file in `supabase/migrations/`
- `docs/ALL_MIGRATIONS.sql`
