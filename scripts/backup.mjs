/**
 * Writes a full JSON snapshot of the database to `backups/`.
 *
 * Run with: npm run db:backup
 *
 * The snapshot format is identical to the one produced by
 * `GET /api/admin/backup` and consumed by `POST /api/admin/restore`, so you
 * can move between the CLI and the admin UI freely.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TABLES = {
  users: () => prisma.user.findMany(),
  languages: () => prisma.language.findMany(),
  settings: () => prisma.setting.findMany(),
  channels: () => prisma.channel.findMany(),
  content: () => prisma.content.findMany(),
  packages: () => prisma.package.findMany(),
  packageChannels: () => prisma.packageChannel.findMany(),
  subscriptions: () => prisma.subscription.findMany(),
  payments: () => prisma.payment.findMany(),
  favorites: () => prisma.favorite.findMany(),
  supportTickets: () => prisma.supportTicket.findMany(),
  auditLogs: () => prisma.auditLog.findMany(),
  analyticsEvents: () => prisma.analyticsEvent.findMany(),
  passwordResetTokens: () => prisma.passwordResetToken.findMany(),
};

async function main() {
  const snapshot = {
    meta: {
      app: "lumistream2",
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: "scripts/backup.mjs",
      counts: {},
    },
  };

  for (const [name, read] of Object.entries(TABLES)) {
    process.stdout.write(`  reading ${name}… `);
    const rows = await read();
    snapshot[name] = rows;
    snapshot.meta.counts[name] = rows.length;
    console.log(`${rows.length}`);
  }

  const dir = join(process.cwd(), "backups");
  await mkdir(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = join(dir, `lumistream-backup-${stamp}.json`);

  await writeFile(file, JSON.stringify(snapshot, null, 2), "utf8");

  console.log(`\nBackup written to ${file}`);
  console.log(
    `  ${snapshot.meta.counts.users} users · ${snapshot.meta.counts.channels} channels · ${snapshot.meta.counts.content} titles`,
  );
}

main()
  .catch((error) => {
    console.error("Backup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });