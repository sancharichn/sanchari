# Sanchari Chennai Travel Group

**TRAVEL WITH NATURE** — the web app for [@sanchari.chennai](https://instagram.com/sanchari.chennai): upcoming trips, registrations, trip accounts and the trip gallery.

Contact: [sanchari.chn@gmail.com](mailto:sanchari.chn@gmail.com)

## Stack

- Next.js 14 (App Router, Server Actions, TypeScript)
- Tailwind CSS, Framer Motion, shadcn/ui (Table, Dialog, Tabs)
- Neon serverless Postgres + Prisma 6 (pooled `DATABASE_URL`, direct `DIRECT_URL`)
- NextAuth.js v4 with Google OAuth and JWT sessions
- Vercel, Google Drive API (gallery), Instagram Graph API (feed)

## Environment variables

Copy `.env.example` to `.env` for local work. On Vercel, add the same keys under **Project → Settings → Environment Variables**. Never commit `.env`.

## Database

The schema lives in `prisma/schema.prisma`. Vercel **production** builds run `prisma db push` before `next build` (see `scripts/db-sync.mjs`), so merging a schema change to `main` updates the Neon `production` branch. Preview builds never touch the schema. A change that would drop data stops the build instead.

Locally: `npm run db:push`.

## Neon

This folder is linked (`.neon`) to the Neon project **sanchariwebsite** (`holy-brook-41730869`) in the Sanchari organisation, branch `production`. `neon.ts` holds the empty config-as-code policy; `neon deploy` applies it. The pooled and direct connection strings for `DATABASE_URL` and `DIRECT_URL` are under **Connect** on the `production` branch.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client, sync the schema (production only), build |
| `npm run typecheck` | Type-check |
| `npm run lint` | Lint |
| `npm test` | Unit tests |
