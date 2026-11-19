/**
 * Seeds an EMPTY PostgreSQL database with the demo data from src/database/seed.ts:
 * the same 5 sign-in accounts (see README), events, staff, resources, demo
 * ratings and feedback.   Run:  npm run db:seed
 * WARNING: it first empties every table (it is meant for a fresh database).
 */
import 'dotenv/config';
import { DataService } from '../src/database/data.service';
import { PrismaService } from '../src/database/prisma.service';
import { seedData } from '../src/database/seed';

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const data = new DataService(prisma);
  const report = await data.importAppData(structuredClone(seedData));
  console.log('Seeded:', report.counts);
  if (report.skipped.length) console.log('Skipped:', report.skipped);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
