# GMB.live

A creator/brand marketplace connecting brands with live-shopping hosts. Brands post products, creators apply, and deals are negotiated end-to-end with chat, contracts, escrow, shipment tracking, and analytics.

## Tech Stack
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui (styling & components)
- Supabase (backend/auth/realtime database)
- React Router v6 (routing)
- TanStack React Query v5 (data fetching)
- Vitest (testing)

## Commands
- `npm run dev` — start dev server (port 8080)
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm run test` — run tests
- `npm run test:watch` — run tests in watch mode

## Branch Conventions
- `main` — production branch (auto-deploys to Vercel at gmb.live)
- `dev` — staging/integration branch
- `feat/description` — feature branches (branch from `dev`)
- `fix/description` — bug fix branches (branch from `dev` or `main`)

## Workflow
1. Create a feature or fix branch from `dev`
2. Make changes and test locally
3. Open a PR to merge into `dev`
4. After validation, merge `dev` → `main` to deploy

## Project Structure
- `src/pages/` — page-level components (one per route)
- `src/components/` — shared UI components (shadcn/ui based)
- `src/components/deals/` — deal room tabs: chat, contract, shipment, analytics
- `src/components/feeds/` — brand and creator feed views
- `src/components/onboarding/` — onboarding flow components
- `src/contexts/AuthContext.tsx` — auth state and user role management
- `src/integrations/supabase/` — Supabase client and generated types
- `supabase/migrations/` — all database migrations in order

## Environment
- Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key
- Never commit `.env` — it is in `.gitignore`

## Supabase
- Auth: email/password only (Google OAuth removed)
- Realtime: enabled for `messages`, `deals`, `deal_offers` tables
- RLS: enabled on all tables with policies scoped to deal participants
- Run migrations in order when setting up a fresh project: `supabase db push`
- Update `supabase/config.toml` with your own project ID

## Deployment
- Deployed on Vercel — `vercel.json` configures SPA routing
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as environment variables in Vercel project settings
- Pushes to `main` trigger automatic deploys

## Key Features
- **Auth**: email sign-up / log-in with Supabase Auth
- **Roles**: brand or creator, selected during onboarding
- **Feed**: role-specific feed (brands see creators, creators see products)
- **Deal flow**: brand sends offer → negotiation via chat → contract signing → escrow → shipment → analytics
- **Deal chat**: realtime messaging with offer cards, counter-offer modal, system events
- **Contract**: e-signature by both parties, auto-generates when offer accepted
- **Shipment tracker**: brand enters tracking info, creator confirms delivery
- **Analytics tab**: creator submits GMV/viewers/orders; brand approves
