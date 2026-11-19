# PostgreSQL migration plan — APPROVED by the owner and IMPLEMENTED (2026-11-19)

## Tool: Prisma (not TypeORM)
- **One readable schema file** (`back-end/prisma/schema.prisma`) is the single source of truth. It's easy to show in the viva; TypeORM spreads the schema over decorators in 15+ entity classes.
- **Migrations are generated** from that file (`prisma migrate dev`) as plain SQL files we can commit and explain.
- **Typed client** (`prisma.event.findMany(...)`) and simple transactions: `prisma.$transaction(async (tx) => { ... })`.
- TypeORM's `synchronize: true` shortcut can silently drop columns; Prisma never changes the database without a migration.

## Tables (snake_case in Postgres, money as NUMERIC(12,2), times as TIMESTAMPTZ)

| Table | Key columns | Links |
|---|---|---|
| `users` | id, name, email (unique), phone, role (enum admin/superuser/vendor/client/staff), status, password_hash (bcrypt), created_at | |
| `vendors` | id, name, business_name, category, status, user_id (unique) | → users |
| `vendor_applications` | id, vendor_name, business_name, email, phone, documents (JSONB), status, rejection_reason, decided_by, decided_at, password_hash | |
| `staff` | id, name, role, phone, email, vendor_id, user_id, experience_years, skills (TEXT[]), bio, avatar | → vendors, users |
| `events` | id, name, type, date, end_date, time, end_time, venue, guests, budget, status (enum), client_id, vendor_id, quoted_price, notes, requested_resources (JSONB), requested_staff (JSONB), cancellation_reason, cancelled_by (JSONB), rejection_reason, approved_at, started_at, ended_at, created_at | → users (client), vendors |
| `resources` | id, name, category, total, price, unit, condition_status, vendor_id | → vendors |
| `allocations` | id, event_id, resource_id, quantity, status (allocated/released), released_at | → events, resources (replaces the `resourceAllocations` map) |
| `staff_assignments` | id, staff_id, event_id, role, status, decline_reason, declined_by (JSONB), tasks (JSONB), responded_at | → staff, events |
| `bookings` | id, event_id (unique), client_id, vendor_id, status, cost, original_cost, advance_paid, payment_status, commission_rate, commission_amount, vendor_payout_amount, payout_status, cancellation_fee_rate, refund_amount, vendor_splits (JSONB), settled_at, settled_by, created_at | → events, users, vendors |
| `payments` | id, booking_id, client_id, amount, method, method_label, status (processing/paid/failed), gateway, gateway_ref, receipt_no, failure_reason, created_at, completed_at | → bookings, users |
| `staff_ratings` | id, staff_id, event_id, vendor_id, rated_by, stars (1–5 CHECK), comment, created_at, updated_at — **UNIQUE (vendor_id, staff_id, event_id)** | → staff, events, vendors |
| `vendor_feedback` | id, vendor_id, event_id (unique), client_id, stars (1–5 CHECK), comment, created_at, updated_at | → vendors, events, users |
| `packages` | id, name, category, price, duration, capacity, description, resources (TEXT[]), staff (TEXT[]), status, vendor_id | → vendors |
| `issues` | id, event_id, title, description, category, priority, status, target, reporter_id, reporter_name, reporter_role, created_at | → events, users |
| `messages` | id, thread_id (e.g. client-EVT001), sender_id, sender_name, sender_role, text, created_at — INDEX (thread_id, created_at) | → users |
| `admin_chat_messages` | id, sender_id, sender_email, recipient_email, text, type, issue_id, created_at | → users |
| `message_reads` | user_id, thread_key, read_at — PK (user_id, thread_key) | → users |
| `notifications` | id, user_id, title, message, type, is_read, link_url, created_at — INDEX (user_id) | → users |
| `settings` | key (PK), value (JSONB) — platformSettings, cancellation fee, venues, contingency plans, monitor progress… | |
| `activity_logs` | id, user_id, user_role, action, entity_type, entity_id, details (JSONB), created_at | |

The database itself enforces rules the code checks today: unique email, one booking per event, one rating per vendor/staff/event, one feedback per event, stars between 1 and 5, and foreign keys (no orphan rows).

## Triggers become service transactions
- **Confirm event → booking:** `prisma.$transaction`: update the event status, then insert the booking with the commission split. If the second step fails, both roll back.
- **Complete / cancel / reject → release:** one transaction: update the event, mark its allocations released, close its assignments, apply the cancellation fee to the booking (booking-rules.ts stays as pure functions).
- **Approve vendor application → vendor + user**: one transaction.

## Steps (each one testable on its own)
1. `docker-compose.yml` (Postgres 16) + `.env.example` gets `DATABASE_URL` + Prisma installed + schema + first migration.
2. `prisma/seed.ts` (the same 5 accounts + demo data) and `scripts/import-json.ts` (reads a **backup** of `database.json` into Postgres).
3. A `PrismaService`, then move the modules over **one at a time** (users/auth → events + bookings + payments → staff → resources → messages → the rest). The Jest specs move to a test database (or Prisma mocks), and the whole suite must pass after each module.
4. Update the `Database/` docs and the README setup guide; run the full Playwright workflow again.

## Honest size estimate
Every service is synchronous today, and Prisma is asynchronous, so **all ~15 modules and most of the 125 tests change**. This is a large rewrite, several hours of careful work in the steps above.
