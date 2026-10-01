/**
 * Restores the database from a snapshot written by `npm run db:backup`.
 *
 * Run with: npm run db:restore -- backups/lumistream-backup-2024-01-01.json
 *
 * Destructive: every table is cleared and repopulated from the file. Rows are
 * inserted children-first so foreign keys stay satisfied.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Insert order matters — children before parents. */
const ORDER = [
  "languages",
  "settings",
  "users",
  "channels",
  "content",
  "packages",
  "packageChannels",
  "payments",
  "subscriptions",
  "favorites",
  "supportTickets",
  "auditLogs",
  "analyticsEvents",
  "passwordResetTokens",
];

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npm run db:restore -- <snapshot.json>");
    process.exit(1);
  }

  const file = resolve(process.cwd(), arg);
  const snapshot = JSON.parse(await readFile(file, "utf8"));

  if (!snapshot || typeof snapshot !== "object" || !Array.isArray(snapshot.users)) {
    console.error(`"${arg}" is not a LumiStream backup (no users array).`);
    process.exit(1);
  }

  if (!process.argv.includes("--yes")) {
    console.log(`About to replace the database with ${arg}.`);
    console.log("Re-run with --yes to confirm:");
    console.log(`  npm run db:restore -- ${arg} --yes`);
    process.exit(1);
  }

  // Clear children before parents.
  await prisma.analyticsEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.packageChannel.deleteMany();
  await prisma.content.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.package.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.language.deleteMany();
  await prisma.user.deleteMany();

  for (const name of ORDER) {
    const rows = Array.isArray(snapshot[name]) ? snapshot[name] : [];
    if (rows.length === 0) continue;

    process.stdout.write(`  restoring ${name}… `);
    await prisma[name].createMany({ data: rows });
    console.log(`${rows.length}`);
  }

  console.log("\nRestore complete.");
}

main()
  .catch((error) => {
    console.error("Restore failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });