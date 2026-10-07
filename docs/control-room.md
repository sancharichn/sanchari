# Trip control room

## Included workflows

- Trip day & payments: search registrations, filter outstanding payments and arrivals, record partial family attendance, coordinate ride requests, record receipts and refunds, export an immutable payment ledger.
- Tasks: create, assign to an existing organiser, set a due date, complete and reopen.
- Incidents: record severity and description, save a follow-up note, resolve or reopen.
- Feedback: private New / In progress / Resolved follow-up and notes, alongside existing feedback analysis and moderation.
- Reports & delivery: net receipts, expenses, attendance, feedback, and email attempt logs.
- Profile: optional month/day birthdays, family editing/removal, resized JPEG uploads saved in the database. Birth-year is not collected for birthday wishes. Uploaded images are excluded from JWT cookies.

## Financial records

Old PAID/PARTIAL labels do not create money records. Enter opening receipts once before relying on report totals. Amounts are recorded in rupees, calculated in integer paise, and persisted as decimals. Refunds are negative ledger entries and cannot exceed recorded receipts. Duplicate submission IDs are rejected; concurrent writes use serializable transactions. Payment records prevent deletion of their trip or registration. Existing expense settlement remains separate from trip fee receipts.

## Deployment

Vercel production builds run scripts/db-sync.mjs. It calls Prisma db push without accept-data-loss. A failed schema sync fails the deployment. No additional manual schema push is needed when DATABASE_URL and DIRECT_URL (or DATABASE_URL_UNPOOLED) are configured.

## Email activation

Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, BIRTHDAY_FROM_EMAIL=sanchari.chn@gmail.com, CRON_SECRET and a public HTTPS NEXTAUTH_URL. Gmail requires an account-authorized send token. Do not paste credentials into the repository.

Birthday cron: daily at 04:00 UTC, matched using Asia/Kolkata calendar dates. February 29 birthdays are sent only on February 29. A missing photo does not block a wish. Family wishes are emailed to the registering adult.

Trip reminder cron: daily at 05:00 UTC. Explicitly set TRIP_EMAILS_ENABLED=true after a controlled Gmail test. It sends one payment reminder three days before, one briefing one day before, and feedback one day after the trip only when its feedback form is open.

Delivery claims are persisted before sending. SENT means Gmail accepted the request, not proof of inbox delivery. SENDING or REVIEW_REQUIRED requires checking Gmail before retrying; no automatic retries risk duplicate messages. Live Gmail delivery has not been tested without account credentials.

## Verification

Unit tests: npm test. Real-database integration tests run only when TEST_DATABASE_URL contains localhost and verify. Use a dedicated empty test database, sync the schema to it, then run npm test with that variable. Tests create and delete only their own fixtures.

## Remaining roadmap

Granular finance/leader/moderator permissions, an audit stream covering every edit, automated waitlist notifications, WhatsApp Business delivery, self-service account export/deletion, and cancellation trend analytics remain separate enhancements. Current access is MEMBER/ADMIN; all operational writes require ADMIN. No finer permission controls are claimed by this release.
