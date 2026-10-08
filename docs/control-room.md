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

## Staff permissions and activity history

Full administrators assign a single staff role at `/admin/access`. The role is refreshed from the database on every session read. The restricted `/staff` workspace is linked from each staff member's profile. Finance staff can record receipts/refunds and expenses; leaders can manage attendance, carpool coordination, tasks and incidents only on explicitly assigned trips; moderators can moderate feedback. Existing full `/admin` pages remain ADMIN-only. Every server action re-checks the relevant capability, including trip assignment.

Server actions write audit rows in the same serializable database transaction as their changes. Failed transactions roll back both. `/admin/activity` provides actor and entity filters, before/after snapshots and pagination. Sensitive values (photos, names, email, birthdays, contact/medical details and free-text private notes) are redacted. Anonymous feedback uses no actor identifier. History starts at this release: it cannot reconstruct older edits, direct SQL changes or external provider activity. Provider attempts have their own delivery records. No UI edits or deletes activity rows.

## Waitlist promotion and WhatsApp

Cancellation and trip capacity edits compare whole-family FIFO rosters inside the transaction, store cancellation events and queue one EMAIL and WHATSAPP notification per promotion. The worker rechecks registration, promotion generation, departure, trip status, account and opt-in before claiming a message. Missing integration credentials leave messages queued. Concurrent workers use an atomic claim; uncertain sends are never automatically retried. `/admin/notifications` displays configuration, status totals and recent attempts. Admin retry requires checking the provider first.

The existing daily 05:00 UTC trip-message cron also drains up to 20 promotion messages, bounded by a time budget. For timely delivery and larger queues, configure an authenticated scheduler to call `/api/cron/notifications` every five minutes using `Authorization: Bearer <CRON_SECRET>`. Do not put this secret in a URL. Existing Vercel cron frequencies are unchanged; check your hosting plan before increasing them. Email uses the configured Gmail sender.

To enable WhatsApp Cloud API in Vercel:

1. Configure Meta's WhatsApp Business account and sending phone number. Add `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, a currently supported `WHATSAPP_API_VERSION`, `WHATSAPP_APP_SECRET` and a random `WHATSAPP_VERIFY_TOKEN` as server-only environment variables.
2. Obtain an approved utility template and set `WHATSAPP_PROMOTION_TEMPLATE` and `WHATSAPP_TEMPLATE_LANGUAGE`. It must have exactly two positional body text parameters: trip title and full trip URL. Suggested body: “Your waitlist places for {{1}} are now confirmed. Review your booking: {{2}}. Reply STOP to stop WhatsApp updates.”
3. Subscribe the Meta app to WhatsApp `messages` webhooks at `https://<site>/api/webhooks/whatsapp`. GET verification checks the verify token; POST checks the raw body's HMAC SHA-256 signature against the app secret. Status callbacks update delivery/read/failure state without regressing delivery state; STOP/UNSUBSCRIBE revokes opt-in.
4. Members explicitly opt in and supply a country-code number in their profile. Set `WHATSAPP_ENABLED=true` only after credentials, template and webhook are ready. Test with an opted-in organiser before rollout. No production message has been sent by the automated tests.

Implementation follows Meta's [template message API](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/messages/template/) and [webhook reference](https://www.postman.com/meta/whatsapp-business-platform/folder/tduohwq/webhook-payload-reference). Configuration alone does not prove live delivery.

## Member data requests

`/profile` offers an authenticated JSON export, WhatsApp preferences and a deletion request form. Export excludes other members and internal organiser notes. `/admin/data-requests` allows reviewing, declining with an explanation, or completing removal. Upcoming bookings must be resolved first; full admin accounts cannot be removed here. Completion removes family profiles/photos, identifiable profile details and linked feedback, clears saved companion/contact details, revokes staff/WhatsApp access and anonymises the accounting account. Financial ledgers remain intact. Organisers must review free-text operational notes and separately held exports/backups before marking completion; this workflow cannot remove external copies. Anonymous feedback that deliberately has no account link cannot be attributed to a member for deletion.

## Analytics

`/admin/analytics` compares cancellation counts/rates by departure and repeat participation over 3/6/12/24-month departure cohorts. Rates show their denominators. Repeat participation uses distinct checked-in trips per booking holder, excluding deleted accounts; family members are not individual repeat-member records. Cancellations are tracked from this release only; missing historical check-ins/cancellations are not invented.

## Release checks and activation

Run `prisma generate`, schema sync on an isolated local verification database, `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`. For real-database tests set DATABASE_URL, DIRECT_URL and TEST_DATABASE_URL to the same local database whose name includes `verify`. Production receives additive schema changes through the existing deployment script. Back up the database before deployment as usual. Gmail/Meta credentials, approved WhatsApp template, webhook subscription and a frequent scheduler are deployment configuration tasks; never commit secrets.
