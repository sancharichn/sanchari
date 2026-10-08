// Syncs the Prisma schema to Neon during Vercel *production* builds only.
//
// Preview deployments share the same database, so letting them push schema
// changes could alter production from an unmerged branch. Locally, run
// `npm run db:push` yourself (or set DB_SYNC=1 for a one-off build).
//
// `prisma db push` stops with an error instead of dropping data, so a schema
// change that would lose data fails the build rather than the database.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

function tripSlug(title) {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70)
      .replace(/-+$/g, "") || "trip"
  );
}

const isProductionBuild = process.env.VERCEL_ENV === "production";
const forced = process.env.DB_SYNC === "1";

if (process.env.SKIP_DB_SYNC === "1" || (!isProductionBuild && !forced)) {
  console.log("[db-sync] Skipped: not a Vercel production build.");
  process.exit(0);
}

// Accept Neon's Vercel integration name for the direct URL as a fallback.
const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED;

if (!process.env.DATABASE_URL || !directUrl) {
  console.error(
    "[db-sync] DATABASE_URL and DIRECT_URL must be set for production builds. " +
      "Add both in Vercel → Project → Settings → Environment Variables.",
  );
  process.exit(1);
}

const bin = path.join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
const command = existsSync(bin) ? bin : "npx";
const args = existsSync(bin) ? ["db", "push", "--skip-generate"] : ["prisma", "db", "push", "--skip-generate"];

// Prisma warns about adding any unique constraint to an existing table, even
// when the new nullable column contains no values. Apply this narrow additive
// change first. PostgreSQL checks uniqueness; duplicates abort the transaction.
// Never bypass unrelated schema warnings with --accept-data-loss.
const { PrismaClient } = await import("@prisma/client");
const migrationClient = new PrismaClient({ datasourceUrl: directUrl });
try {
  await migrationClient.$transaction(async (tx) => {
    const tables = await tx.$queryRawUnsafe('SELECT to_regclass(\'"PaymentEvent"\')::text AS name');
    if (tables[0]?.name) {
      await tx.$executeRawUnsafe('ALTER TABLE "PaymentEvent" ADD COLUMN IF NOT EXISTS "requestId" TEXT');
      await tx.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "PaymentEvent_requestId_key" ON "PaymentEvent" ("requestId")');
      await tx.$executeRawUnsafe('ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "slug" TEXT');
      await tx.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Trip_slug_key" ON "Trip" ("slug")');
    }
  });
} catch (error) {
  console.error("[db-sync] Payment request-key migration failed; no schema warnings will be bypassed.", error.message);
  process.exitCode = 1;
} finally {
  await migrationClient.$disconnect();
}
if (process.exitCode) process.exit(process.exitCode);

console.log("[db-sync] Pushing the Prisma schema to the production database…");
const result = spawnSync(command, args, {
  stdio: "inherit",
  env: { ...process.env, DIRECT_URL: directUrl },
});

if (result.status !== 0) {
  console.error("[db-sync] prisma db push failed — the build stops here so the app never runs against an out-of-date schema.");
  process.exit(result.status ?? 1);
}

// Existing links keep working through the ID fallback. Give every older trip a
// readable canonical link too, resolving duplicate titles deterministically.
try {
  const backfillClient = new PrismaClient({ datasourceUrl: directUrl });
  const legacyTrips = await backfillClient.trip.findMany({ where: { slug: null }, select: { id: true, title: true }, orderBy: { createdAt: "asc" } });
  for (const trip of legacyTrips) {
    const base = tripSlug(trip.title);
    let slug = base;
    for (let suffix = 2; await backfillClient.trip.findFirst({ where: { slug }, select: { id: true } }); suffix += 1) slug = `${base}-${suffix}`;
    await backfillClient.trip.update({ where: { id: trip.id }, data: { slug } });
  }
  await backfillClient.$disconnect();
} catch (error) {
  console.error("[db-sync] Trip URL backfill failed; the build stops so public URLs remain consistent.", error.message);
  process.exit(1);
}

console.log("[db-sync] Schema is in sync.");
