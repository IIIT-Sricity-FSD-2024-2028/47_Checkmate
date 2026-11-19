# Database — PostgreSQL (Prisma)

The app stores everything in **PostgreSQL 16**, accessed through **Prisma**.

| File | What it is |
|---|---|
| `back-end/prisma/schema.prisma` | **The source of truth.** Every table, column and relation. |
| `back-end/prisma/migrations/` | SQL migrations generated from the schema (`npm run db:migrate` applies them). |
| `Database/schema.sql` | The full SQL of the current schema (a copy of the first migration), for reading. |
| `Database/POSTGRES_PLAN.md` | Why Prisma, the table design and the migration steps (approved plan). |
| `DBschema.sql`, `DBschema_v2_normalized.sql`, `ER Diagram.pdf` | **Outdated**, from before the app had a real database. Kept for history only. |

## Why Prisma (not TypeORM)
- One readable schema file instead of 15+ decorated entity classes.
- Migrations are generated as plain SQL that we can read and commit.
- `prisma.$transaction(...)` makes it simple to do several writes as one unit.
- It never changes the database without a migration (TypeORM's `synchronize` can silently drop columns).

## Tables

| Table | Holds | Key rules |
|---|---|---|
| `users` | Every login (admin, superuser, vendor, client, staff), bcrypt password hash | email UNIQUE |
| `vendors` | Vendor companies | user_id UNIQUE → users |
| `vendor_applications` | Sign-up requests from new vendors | password stored hashed |
| `staff` | Operational staff records (experience, skills, bio) | → vendors, users |
| `events` | Event requests and their lifecycle (pending → confirmed → live → completed / cancelled / rejected) | → users (client), vendors |
| `resources` | Inventory (stock per vendor) | → vendors |
| `allocations` | Units of a resource held by an event | → events (CASCADE), resources; quantity > 0 |
| `staff_assignments` | Staff working on an event (accept / decline + reason) | → staff, events (CASCADE) |
| `bookings` | The bill for a confirmed event: price, commission, vendor payout, cancellation fee | event_id UNIQUE (one booking per event) |
| `payments` | Every checkout attempt (simulated gateway): amount, method, status, receipt | → bookings, users; amount > 0 |
| `staff_ratings` | Vendor's 1–5★ rating of a staff member for one event | UNIQUE (vendor, staff, event); stars CHECK 1–5 |
| `vendor_feedback` | Client's 1–5★ feedback about the vendor for one event | event_id UNIQUE; stars CHECK 1–5 |
| `packages` | Vendor service packages (admin approves them) | → vendors |
| `issues` | Problems reported by clients, vendors and staff | → events |
| `messages` | Event conversations (`client-EVT…`, `staff-EVT…`) | INDEX (thread_id, created_at) |
| `admin_chat_messages` | Support chat with the admin team | recipient_email for admin replies |
| `message_reads` | When each user last opened each conversation (unread counts) | PK (user_id, thread_key) |
| `notifications` | Bell notifications per user | → users |
| `activity_logs` | Audit trail of changes | |
| `venues`, `staff_applications`, `staff_tasks` | Venues, staff join requests, task-board items | |
| `settings` | Key/value data: platformSettings (commission %, cancellation fee %), monitorProgress, contingency plans, … | key PK |

Every table also has an `extra` JSONB column. It keeps any additional field a record carries that has no column of its own, so no data from the old JSON database is lost.

## How the old "triggers" work now
The data layer (`back-end/src/database/data.service.ts`) runs each change **and everything it causes** in one `prisma.$transaction`:
- **Event confirmed → booking created**, with the commission split.
- **Event completed / cancelled / rejected → allocations released, assignments closed, booking turned into the cancellation fee** (`booking-rules.ts`).
- **Vendor application approved → vendor and login created.**
- **Assignment changed → staff workload recalculated.**

If any step fails, PostgreSQL rolls the whole change back. A test proves this (`data.service.spec.ts`: "a failing step rolls the whole change back").

## Moving data from the old JSON file
```bash
cd back-end
npm run db:import -- data/database.backup-2026-11-19.json
```
The JSON file is only read. Rows that point at something missing are skipped and listed; required values that were empty are filled and listed.
