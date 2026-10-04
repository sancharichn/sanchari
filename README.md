# Sanchari Chennai Travel Group

**TRAVEL WITH NATURE.** The web app for [@sanchari.chennai](https://instagram.com/sanchari.chennai): upcoming trips, registrations with a waitlist, trip accounts, a photo gallery and the Instagram feed.

Contact: [sanchari.chn@gmail.com](mailto:sanchari.chn@gmail.com)

## What's in it

| Who | What they get |
| --- | --- |
| Anyone | Home page, trips (upcoming, on the trail, past), trip pages with the day-by-day plan, gallery, feedback |
| Members (Google sign-in) | Register for a trip, join the waitlist when it's full, see payment and gear-check status, cancel while nothing is paid, review completed trips, keep phone / emergency contact / blood group up to date |
| Organiser (`ADMIN_EMAIL`) | `/admin`: create and edit trips and itineraries, set status, manage the roster (payment, gear check, remove), log expenses and see who owes whom, members list, moderate feedback, download the roster as CSV |

`/admin` returns the 404 page to everyone who isn't ADMIN. The role is checked in middleware, again in the admin layout against the database, and again inside every organiser action and the CSV route.

### Rules the app follows

- **Seats go in order of registration.** The first `maxCapacity` registrations have seats; later ones are the waitlist, in order. Nothing extra is stored, so when someone cancels or is removed, the next person moves up on their own.
- **Statuses:** Draft (organisers only) → Open → Waitlist / Full → On the trail → Completed → Archived (hidden). Open and Waitlist take registrations; trips that have started don't.
- **Cancelling:** members can cancel their own registration until the trip starts, as long as no payment is recorded. After that, the organiser removes them.
- **Expenses** are split equally across everyone with a seat, in whole paise. Trip fees members pay the organiser are tracked as payment status on the roster, not as expenses.
- **Reviews** of a trip come from people who had a seat on it, once it's Completed. One review per person per trip; posting again replaces it.
- **The estimated cost** on a trip is per person.

## Stack

- Next.js 14 (App Router, Server Actions, TypeScript), Node 22
- Tailwind CSS, Framer Motion, shadcn/ui (Table, Dialog, Tabs); Archivo (variable width) for type
- Neon serverless Postgres + Prisma 6 (pooled `DATABASE_URL` for the app, direct `DIRECT_URL` for schema changes)
- NextAuth.js v4 with Google OAuth and JWT sessions
- Vercel; Google Drive API (gallery); Instagram API with Instagram Login (feed)

## Environment variables

Copy `.env.example` to `.env` for local work. On Vercel, add the same keys under **Project → Settings → Environment Variables** (Production, and Preview if you use preview deployments). Never commit `.env`.

| Key | What it is | Where it comes from |
| --- | --- | --- |
| `DATABASE_URL` | Pooled Postgres URL (host contains `-pooler`), ending `?sslmode=require&connect_timeout=15` | Neon → sanchariwebsite → `production` → **Connect**, pooling on |
| `DIRECT_URL` | Direct Postgres URL, same ending | Same dialog, pooling off |
| `NEXTAUTH_URL` | The site's URL, e.g. `https://sanchari.vercel.app` | Vercel → Domains |
| `NEXTAUTH_SECRET` | Random secret for signing sessions | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth client for "Sign in with Google" | Google Cloud, see below |
| `ADMIN_EMAIL` | The organiser account | `sanchari.chn@gmail.com` |
| `INSTAGRAM_HANDLE` | Shown in links | `sanchari.chennai` |
| `INSTAGRAM_ACCESS_TOKEN` | Long-lived token for the feed (optional) | Meta app, see below |
| `GOOGLE_DRIVE_FOLDER_ID` | The gallery folder (optional) | The folder's URL: `drive.google.com/drive/folders/<this part>` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The service account key file, pasted whole or base64-encoded (optional) | Google Cloud, see below |

The gallery and the Instagram feed are optional: without their variables, the site shows a link to Instagram instead.

## Setting it up

### 1. Database (Neon)

This folder is linked (`.neon`) to the Neon project **sanchariwebsite** (`holy-brook-41730869`) in the Sanchari organisation, branch `production`. `neon.ts` holds the empty config-as-code policy; `neon deploy` applies it.

There's no migration step to run by hand: **Vercel production builds run `prisma db push`** (see `scripts/db-sync.mjs`) before `next build`, so the first deploy creates the tables and later schema changes apply when they reach `main`. Preview builds never touch the schema. A change that would drop data stops the build instead of the data.

Locally: `npm run db:push`.

### 2. Google sign-in

In [Google Cloud console](https://console.cloud.google.com), signed in as sanchari.chn@gmail.com:

1. Create a project (for example `sanchari-web`).
2. **Google Auth Platform → Branding:** app name *Sanchari Chennai*, support email sanchari.chn@gmail.com, home page `https://<your-vercel-domain>`, privacy policy `https://<your-vercel-domain>/privacy`. **Publish app** stays greyed out until these links are filled in. Don't upload a logo: a logo means Google has to verify the app first.
3. **Audience:** External, then **Publish app** so any Google account can sign in. The app only asks for name, email and photo, so no verification is needed.
4. **Clients → Create client → Web application.** Authorised redirect URIs:
   - `https://<your-vercel-domain>/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
5. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### 3. Gallery (optional)

1. In the same Google Cloud project, enable the **Google Drive API**.
2. **IAM & Admin → Service accounts → Create** (for example `sanchari-gallery`), no roles needed. Then **Keys → Add key → JSON**, and paste the downloaded file's contents into `GOOGLE_SERVICE_ACCOUNT_JSON`.
3. In Drive, make a folder for the gallery and **share it with the service account's email as Viewer**. Each subfolder becomes an album named after the folder; photos directly in the folder show as "Latest".
4. Put the folder's ID in `GOOGLE_DRIVE_FOLDER_ID`.

### 4. Instagram feed (optional)

The feed uses the Instagram API with Instagram Login, so @sanchari.chennai must be a professional (Business or Creator) account.

1. At [developers.facebook.com](https://developers.facebook.com), create an app with the **Instagram** product, and add the account under **API setup with Instagram login**.
2. Generate a token for @sanchari.chennai and put it in `INSTAGRAM_ACCESS_TOKEN`.
3. Long-lived tokens last about 60 days. When the feed shows the plain "Open @sanchari.chennai" card instead of posts, generate a new token and update the variable.

### 5. Vercel

1. Import `sancharichn/sanchari` as a new project (framework: Next.js; the build command comes from `package.json`).
2. Add the environment variables above, then deploy.
3. Set `NEXTAUTH_URL` to the production URL and add that URL's callback to the Google OAuth client.
4. Functions run in **Cleveland (`cle1`)**, set in `vercel.json`, because the Neon project is in AWS us-east-2 (Ohio) and each page makes several database round trips. If the database ever moves, change the region to match.

Sign in once as sanchari.chn@gmail.com: that account becomes ADMIN on first sign-in, and the **Organiser** link appears in the header.

## Development

```bash
npm install
cp .env.example .env   # fill in the values
npm run db:push        # create the tables in your database
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client, sync the schema (Vercel production only), build |
| `npm run typecheck` | Type-check |
| `npm run lint` | Lint |
| `npm test` | Unit tests (expense splitting, waitlist order, dates and rupees, CSV, gallery URL signing) |
