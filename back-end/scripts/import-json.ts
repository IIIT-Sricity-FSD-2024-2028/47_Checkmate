/**
 * Imports the OLD JSON database (a backup of back-end/data/database.json) into
 * PostgreSQL.   Run:  npm run db:import -- data/database.backup-2026-11-19.json
 *
 * - Empties the tables first, then copies every collection into its table.
 * - A row that points at something missing (e.g. an assignment for a deleted
 *   event) is skipped and listed at the end, instead of failing everything.
 * - The JSON file itself is only READ, never changed.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { DataService } from '../src/database/data.service';
import { PrismaService } from '../src/database/prisma.service';

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: npm run db:import -- <path to database.json backup>');
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const prisma = new PrismaService();
  await prisma.$connect();
  const report = await new DataService(prisma).importAppData(json);
  console.log('Imported rows per table:', report.counts);
  console.log(report.skipped.length ? `Skipped ${report.skipped.length}:\n  - ${report.skipped.join('\n  - ')}` : 'Nothing skipped.');
  console.log(report.filled.length ? `Filled ${report.filled.length} missing required value(s):\n  - ${report.filled.join('\n  - ')}` : 'No values had to be filled.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
