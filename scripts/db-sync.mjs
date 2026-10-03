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

console.log("[db-sync] Pushing the Prisma schema to the production database…");
const result = spawnSync(command, args, {
  stdio: "inherit",
  env: { ...process.env, DIRECT_URL: directUrl },
});

if (result.status !== 0) {
  console.error("[db-sync] prisma db push failed — the build stops here so the app never runs against an out-of-date schema.");
  process.exit(result.status ?? 1);
}

console.log("[db-sync] Schema is in sync.");
