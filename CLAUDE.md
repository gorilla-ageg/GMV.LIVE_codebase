# GMV.live — Claude Code Master Instructions

## What This Product Is
GMV.live is a two-sided marketplace connecting **brands** with **live stream creators** (starting with college students). The platform handles the entire deal lifecycle: brand posts product → creator discovers/gets approached → chat → offer negotiation → contract generation → e-signing → product shipment + tracking → live stream → performance analytics → payment release.

## Branding
- Product name: **GMV.live** (NOT GMB.live — fix any occurrence of GMB)
- Primary color: hsl(349, 98%, 56%) — red/pink
- Accent color: hsl(174, 91%, 55%) — teal
- Dark theme only. Background: near-black (#080808)

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (auth, database, realtime, storage)
- React Router v6
- TanStack React Query v5
- Stream Chat (stream-chat-react) for deal room messaging
- Stripe Connect for payments and creator payouts
- pdf-lib for contract PDF generation

## Coding Standards
- Always use TypeScript with strict types — no `any`
- All Supabase queries must handle errors explicitly
- All components must be under 200 lines — split if larger
- Use React Query for all data fetching — no raw useEffect for data
- Never expose STRIPE_SECRET_KEY or STREAM_API_SECRET client-side
- Secret operations go in Supabase Edge Functions

## Current Directory Structure
- `src/pages/` — one file per route
- `src/components/deals/` — deal room tabs
- `src/components/feeds/` — brand and creator feed views
- `src/components/chat/` — Stream Chat wrappers (to be built)
- `src/contexts/AuthContext.tsx` — auth + role state
- `src/integrations/supabase/` — client + generated types
- `supabase/functions/` — edge functions (Stripe, Stream token)

## Database (Supabase — DO NOT change existing schema)
Core tables: profiles, user_roles, creator_profiles, brand_profiles, products, conversations, messages, deals, deal_offers, deal_signatures, escrow_payments, shipments
All tables have RLS enabled. Use `has_role(user_id, role)` security definer function for role checks.

## Active Build Tasks (work through these in order)

### TASK 1 — Global rename GMB → GMV
Find and replace every instance of "GMB.live", "GMB", "gmb" across all src/ files. Replace with "GMV.live", "GMV", "gmv" respectively. Do not touch node_modules or .git.

### TASK 2 — Authenticated App UX Redesign
The logged-in experience is cluttered and outdated. Redesign the post-auth UI with these principles:
- Clean sidebar navigation (collapsed by default on mobile)
- Generous whitespace — cards should breathe
- Consistent use of the design tokens in index.css
- Role-aware: brand dashboard ≠ creator dashboard
- Every page should have a clear primary action

**Brand Dashboard should show:**
- Top: key metrics (active deals, total GMV generated, pending shipments)
- Main: product listings with deal status badges
- Quick action: "Post New Product" button always visible
- Side: recent deal activity feed

**Creator Dashboard should show:**
- Top: earnings summary, upcoming streams, deal pipeline
- Main: available brand products to apply for
- My Deals: active deals with status timeline
- Quick action: "Update My Profile" always accessible

### TASK 3 — Replace DealChat with Stream Chat
- Remove the existing Supabase-polling chat in `src/components/deals/DealChat.tsx`
- Replace with Stream Chat using `stream-chat-react` Channel component
- Stream Chat channel ID format: `deal-{dealId}`
- Get user token from Supabase Edge Function: `supabase/functions/stream-token/index.ts`
- Keep the offer cards, system events, and OfferModal — just replace the message transport
- Style Stream Chat to match the dark theme using Stream Chat's CSS override system

Edge function for Stream token (`supabase/functions/stream-token/index.ts`):
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { StreamChat } from 'npm:stream-chat'

serve(async (req) => {
  const { userId, userName } = await req.json()
  const client = StreamChat.getInstance(
    Deno.env.get('STREAM_API_KEY')!,
    Deno.env.get('STREAM_API_SECRET')!
  )
  const token = client.createToken(userId)
  return new Response(JSON.stringify({ token }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### TASK 4 — Stripe Connect Integration
- Brands pay into escrow when a deal offer is accepted
- Creators receive payout when analytics are approved
- Use Stripe Connect Express for creator onboarding

Edge function: `supabase/functions/stripe-payment/index.ts`
- Create PaymentIntent when deal moves to `contract_signed` status
- Store `stripe_payment_intent_id` in `escrow_payments` table
- Webhook handler: on `payment_intent.succeeded` → update escrow status

Edge function: `supabase/functions/stripe-connect/index.ts`
- Create Stripe Express account for creator
- Return onboarding link
- Store `stripe_account_id` in `creator_profiles` table

### TASK 5 — Contract PDF Generation
- When both parties sign (`deal_signatures` has 2 rows for a deal), generate PDF
- Use `pdf-lib` to create a professional contract document
- Include: party names, product details, rate, deliverables, live date, usage rights
- Upload to Supabase Storage bucket `contracts`
- Store URL in `deals.contract_url`
- Add download button in `ContractView.tsx`

### TASK 6 — Shipment Tracking Polish
- `ShipmentTracker.tsx` currently is manual input only
- Add tracking number validation (basic format check)
- Add carrier detection from tracking number format
- Add a "Copy tracking link" button
- Status timeline should auto-advance based on `shipments.status` field updates

## Design Principles for All New UI
- **No tables** — use cards with clear hierarchy instead
- **Progressive disclosure** — show summary first, details on expand/click
- **Status is always visible** — deal status, shipment status, payment status shown with colored badges
- **Empty states** — every list/feed needs a helpful empty state with a clear CTA
- **Loading states** — every async operation needs a skeleton or spinner
- **Mobile first** — all layouts must work on 375px width

## What NOT to Touch
- `src/pages/Index.tsx` (brand landing page) — preserve exactly
- `src/pages/ForCreators.tsx` (creator landing page) — preserve exactly
- `src/index.css` (CSS variables and cloud-blob utility) — preserve exactly
- `tailwind.config.ts` — preserve exactly
- `supabase/migrations/` — never modify migration files
- `docs/ALL_MIGRATIONS.sql` — never modify

## Environment Variables
Client-side (VITE_ prefix):
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_STREAM_API_KEY
- VITE_STRIPE_PUBLISHABLE_KEY

Server-side (Supabase Edge Functions only — never in client code):
- STREAM_API_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

## Running the Project
```bash
npm run dev        # dev server on port 8080
npm run build      # production build
npm run lint       # ESLint
npm run test       # Vitest
```
