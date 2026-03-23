# GMB.live

A creator/brand marketplace connecting brands with live-shopping hosts. Brands post products, creators apply, and deals are negotiated end-to-end with chat, contracts, escrow, shipment tracking, and analytics.

**Hosted at**: gmb.live (Vercel)

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Supabase (auth, database, realtime)
- React Router v6
- TanStack React Query v5

## Local Development

```sh
# 1. Clone the repo
git clone https://github.com/YOUR_ORG/GMB.LIVE_codebase.git
cd GMB.LIVE_codebase

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key in .env

# 4. Start dev server
npm run dev
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 8080 |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## Supabase Setup

1. Create a new Supabase project at supabase.com
2. Copy the Project URL and anon key into `.env`
3. Run all migrations: `supabase db push` (or apply via Supabase dashboard SQL editor)
4. Enable Realtime for `messages`, `deals`, and `deal_offers` tables (already in migrations)

## Deployment (Vercel)

This repo is deployed on Vercel with SPA routing configured in `vercel.json`.

1. Connect the GitHub repo to Vercel
2. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy — Vercel handles builds automatically on push to `main`

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — auto-deploys to Vercel |
| `dev` | Staging / integration branch |
| `feat/description` | Feature branches (branch from `dev`) |
| `fix/description` | Bug fix branches (branch from `dev` or `main`) |
